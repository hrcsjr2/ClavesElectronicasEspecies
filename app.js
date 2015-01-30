/************************************************************************************************************************
Código elaborado por: Herman Camacho Sánchez.
Descripción: Métodos para el procesamiento y administración de claves electrónicas
************************************************************************************************************************/
var express = require('express');
var demo = '00100111000100010001100110010000';
var http = require('http');
var converter = require('convert-json');
var MongoClient = require('mongodb').MongoClient;
var MongoConnectionString = "mongodb://localhost:27017/ClavesElectronicas";

var ObjectId = require('mongodb').ObjectID;

var multiparty = require("multiparty");

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session')
var bodyParser = require('body-parser');
var fs = require('fs');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(session({
    secret: 'electronic key',
    name: 'electronicKey',    
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'css')));
app.use('/users', users);

//Archivos soportados para la carga masiva de claves electrónicas
var extensionsSupported = ['.xls','.xlsx'];
//Método para subir un documento
app.post('/upload', function(req, res, next){
  var pathxls;
   //Se crea un formulario para iniciar el parseo del documento
  var form = new multiparty.Form();

  var title;
  var size = '';
  var fileName = '';

  form.on('error', next); 
  
  //Queda a la espera para determinar el nombre y el tamaño del archivo
  form.on('part', function(part){
	if(!part.filename) return;
    size = part.byteCount;
    fileName = part.filename;
	//console.log('part executed');
	//console.log(part);
	//console.log('end part');
  });
  //Método que recibe las propiedades del documento
  form.on('file', function(name,file){
	res.contentType('json');
	//Variable que retorna el estado de la carga
	var UploadResult = '{"status":"error"}';
	
	//console.log('file executed');
    //console.log('file path: ' + file.path);
	//console.log('file JSON:');
	//console.log(file);
	//console.log('end file JSON');	
	//console.log('Name: ' + file.originalFilename);
	req.session.fileName = file.originalFilename;
	//console.log(path.extname(file.originalFilename));	
	var tmp_path = file.path;
	//console.log('fileSize: '+ (parseFloat(file.size) / 1024 | 0));	
	//Si la extensión del archivo es la correcta, se sube el documento y se almacena la ruta temporal donde fue escrito
	if(extensionsSupported.indexOf(path.extname(file.originalFilename)) >= 0){
		//console.log('file supported');
		UploadResult = '{"status":"success", "message":"Archivo subido correctamente."}';		
		req.session.tmp_Path = tmp_path;
		//console.log ("tmp_Path Session: " + req.session.tmp_Path);
	} else {
		//console.log('file not supported');
		UploadResult = '{"status":"error", "message":"El archivo no tiene el formato esperado."}';
		fs.unlinkSync(tmp_path);
	}
	
	//console.log('tmpPath: ' + tmp_path);
	
	console.log(UploadResult);
	
	res.send({ data: UploadResult });
	});
    // parse the form
    form.parse(req);  
});
 
//Método inicial para obtener el primer carácter con sus caracteres                                                 
app.post('/getJSONTreeData', function(req, res, next){	
	console.log('Buscar Nivel: ' + req.body.OrdenNodo);	
	res.contentType('json');
	ObtenerNodo(req.body.OrdenNodo, res);
	/*
	fs.readFile('./jsondata/flare.json', 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		} else {
			//console.log('JSON data loaded successfully');
			res.contentType('json');
			res.send({ data: data });
		}		  
	});	
	*/
}); 

//Método para procesar el archivo excel subido al prototipo
app.post('/readFile', function(request, response){
    
	response.contentType('json');
	//console.log('hoja: ' + request.body.Hoja);
	//console.log('ruta temporal: ' + request.session.tmp_Path);	
	var tmp_path = request.session.tmp_Path;
	var fileName = request.session.fileName;	
	var newPath = './uploads/' + generateUUID() + '_' + fileName;
	//Se cambia la ubicación temporal a una ruta más accesible
	fs.renameSync(tmp_path, newPath);	
	//Se ejecuta proceso de verificación del archivo				
	var result = CargarArchivoExcel(newPath,path.extname(fileName), request.body.Hoja);	
	//response.send({ data: '{"status":"success", "message": "La hoja fue encontrada."}' });
	response.send({ data: result });
});

//Método para recuperar las especies relacionadas con los filtros enviados por parámetro
app.post('/BuscarEspecies', function(request, response){
    
	response.contentType('json');
	var filtros = JSON.parse(request.body.Filtros);	
	
	//console.log(filtros);
	console.log('Tamaño filtros: ' + filtros.length);
	var filtrosEspecies = new Array();
	for(var filtro in filtros) {
		
		filtrosEspecies.push(new ObjectId(filtros[filtro].IdEstadoCaracter));
	}
	BuscarEspecies(filtrosEspecies, response);
});

//Método para retornar el contenido del cuadro de diálogo que es para cargar el documento
app.post('/checkLogin', function(request, response){
    
	response.contentType('html');
	
	response.sendFile('./index.html', {root: __dirname });	
});

// Método principal para renderizar el inicio del prototipo
app.get("/", function (request, response) {    
	//connectMongodb();
	response.render("index.ejs");
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});


module.exports = app;

var server = http.createServer(app);
server.listen(3000);
console.log('Express server started on port %s', server.address().port);
//Función para buscar las especies según los filtros enviados por parámetro
function BuscarEspecies(Filtros, response) {
	console.log('BuscarEspecies');
	console.log('Filtros encontrados:');
	console.log(Filtros);
	
	MongoClient.connect(MongoConnectionString, function(err, db) {	
		if(!err) { 
			var Especie_EstadoCaracterCollection = db.collection('Especie_EstadoCaracter');
			//Se obtienen los id's de los estados de carácter relacionados con los filtros, retornando filas únicas
			Especie_EstadoCaracterCollection.distinct('IdEspecie', {IdEstadoCaracter: {$in: Filtros}}, function(err, especies_estadoCaracter) {
				//console.log('Resultado filtro');
				//console.log(especies_estadoCaracter);				
				
				//Se toman los id's encontrados pertenecientes a los filtros y se usan para consultar los nombres en la colección de especies
				var EspeciesCollection = db.collection('Especies');
				EspeciesCollection.find({_id: {$in: especies_estadoCaracter}}).toArray(function(err, especies) {
					
					//console.log(especies);
					var listaResultados = new Array();
					for(var especie in especies) {
					
						var resultado = {
											IdEspecie: new ObjectId(especies[especie]._id),
											Nombre: especies[especie].Nombre
										}
					
						listaResultados.push(resultado);//console.log(especies[especie]);
					}
					db.close();
					//console.log(listaResultados);
					response.send({data: JSON.stringify(listaResultados)});
				});
			});			
		} else {
			console.log(err);
			db.close();
		}
	});
	
	
}


//usar v, t o w (propiedades en común)
function CargarArchivoExcel(ruta,extension, hoja){
	//console.log('ruta: ' + ruta);
	//console.log('extension: ' + extension);
	
	var readFileResult;
	
	var encontrado = false;
	if(extension=='.xls'){
		//console.log ('Inicio de proceso de carga Excel 97-2003');		
		var xls_trans = converter.xls(ruta, function(err, result) {
		  if(err) {
			console.log(err);
		  } else {
			//console.log(result);	
			//console.log(result.SheetNames);			
			for(var x = 0; x < result.SheetNames.length; x++){
				//console.log(result.SheetNames[x]);
				if (result.SheetNames[x] == hoja){
					encontrado = true;
				}
			}
			
			if(encontrado == true) {
				console.log('Sheet found.');
				var hojaXLS = result.Sheets[hoja];
				//console.log(hojaXLS);
				//readSheet(hojaXLS);
				leerExcel(hojaXLS);
				readFileResult = '{"status":"success", "message": "La hoja fue encontrada."}';
			} else {
				//console.log('Sheet not found.');
				readFileResult = '{"status":"error", "message": "La hoja ' + hoja + ' no fue encontrada."}';
			}
		  } 
		});	
	} else {
		//console.log ('Inicio de proceso de carga Excel 2007-2013');		
		
		var xlsx_trans = converter.xlsx(ruta, function(err, result) {
			  if(err) {
				console.error(err);
			  } else {
				//console.log(result);					
				//console.log(result.SheetNames);
				for(var x = 0; x < result.SheetNames.length; x++){
					//console.log(result.SheetNames[x]);
					if (result.SheetNames[x] == hoja){
						encontrado = true;
					}
			    }
				
				if(encontrado == true) {
					//console.log('Sheet found.');
					
					var hojaXLSX = result.Sheets[hoja];
					//console.log(hojaXLSX);
					//readSheet(hojaXLSX);
					leerExcel(hojaXLSX);
					readFileResult = '{"status":"success", "message": "La hoja fue encontrada y cargada."}';
				} else {
					//console.log('Sheet not found.');
					readFileResult = '{"status":"error", "message": "La hoja ' + hoja + ' no fue encontrada."}';
				}
			  }
			});
	}
	
	fs.unlinkSync(ruta);
	
	//console.log (readFileResult);
	return readFileResult;
}
//Función que genera códigos GUID
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
};
//Función que revisa y almacena caracteres y especies de la hoja Excel
function GuardarColumnas(hoja) {
var esperaCaracteres = 35;
var esperaEspecies = 35;
	for(var celda in hoja) {
		var fila = celda.replace(/[^\d]/gm,'');
		var columna = celda.replace(fila,'');
		var nombre = hoja[celda].w;
		var especie;
		if (fila == '1') {
			if (columna != 'A') {				
				ValidarElementos(nombre, 'Caracteres', esperaCaracteres);
				esperaCaracteres+=35;
			}
		} else {
			if (columna == 'A') {
				especie = hoja[celda].w;
				//console.log(nombre);
				//se verifican especies o géneros
				ValidarElementos(nombre,'Especies', esperaEspecies);
				esperaEspecies+=35;
			}
		}
		
	}
	console.log('tiempo max. carga caracteres: ' + esperaCaracteres);
	console.log('tiempo max. carga especies: ' + esperaEspecies);
	if (esperaCaracteres > esperaEspecies) {
		return esperaCaracteres;
	} else {
		return esperaEspecies;
	}
}
//Función que valida y guarda los estados de carácter encontrados en la hoja de excel
function GuardarEstadosCaracter(hoja, tiempoColumnas) {
	console.log('Inicio de verificación de estados de caracter');
	var tiempo = tiempoColumnas + 35;
	var listaCaracteres = new Array();	
	for(var celda in hoja) {
		var fila = celda.replace(/[^\d]/gm,'');
		var columna = celda.replace(fila,'');
		var nombre = hoja[celda].w;
		var especie;
		if (fila == '1') {
			if (columna != 'A') {
				//se verifican los caracteres
				var columnaCaracter = {
					Nombre: nombre,
					Columna: columna
				}
				listaCaracteres.push(columnaCaracter);					
			}
		} else {
			//Si la columna es la primera (Especies o géneros), se asigna temporalmente a la variable
			if (columna == 'A') {
				especie = hoja[celda].w;
			} else if (columna != '!ref') {
				//Se realiza un split de estados de carácter por coma
				if (nombre !== undefined) {
					var estadosCaracter = nombre.split(',');					
					var columnaCaracter = ObtenerColumnaCaracter(listaCaracteres, columna);
					for(var i = 0; i < estadosCaracter.length; i++) {
						if (columnaCaracter.Nombre !==undefined) {
							if ((columnaCaracter.Nombre.trim() != '') &&(estadosCaracter[i].trim() != '')) {
								//Se valida y guarda cada estado de carácter relacionado con el carácter.
								ValidarEstadosCaracter(estadosCaracter[i].trim(),columnaCaracter.Nombre, tiempo);
								tiempo+=35;
							}
						}
					}	
				}
				
			}
		}	
	}
	console.log('tiempo carga estados de caracter: ' + tiempo);
	return tiempo;
}
//Método para verificar las relaciones de especie-estado carácter del documento y si en bd ya existen las especies, se eliminan las relaciones
function EliminarRelacionEspecieEstadoCaracter(hoja, tiempoEstadosCaracter) {	
	var tiempo = tiempoEstadosCaracter + 35;
	console.log('Eliminando relaciones de especies encontradas en el documento con estados de caracter');
	for(var celda in hoja) {
		var fila = celda.replace(/[^\d]/gm,'');
		var columna = celda.replace(fila,'');
		var nombre = hoja[celda].w;
		var especie;
		if (columna == 'A') {
			if (fila != '1') {
				if (nombre !== undefined) {
					if(nombre != '') {
						EliminarEstadosCaracterEspecie(nombre.trim(), tiempo);
						tiempo +=35;
					}
				}
			}
		}
	}
	console.log('tiempo para la eliminación de relaciones entre especies y estados de caracter: ' + tiempo);
	return tiempo;
}
//Método para validar y guardar la relación especie-estado de carácter del documento excel
function GuardarEspecieEstadoCaracter(hoja, tiempoEliminarRelacionEspecieEstadoCaracter) {
	var tiempo = tiempoEliminarRelacionEspecieEstadoCaracter + 35;
	console.log('Inicio de carga de especies por estado de caracter y caracter');
	var listaCaracteres = new Array();	
	for(var celda in hoja) {
		var fila = celda.replace(/[^\d]/gm,'');
		var columna = celda.replace(fila,'');
		var nombre = hoja[celda].w;
		var especie;
		if (fila == '1') {
			if (columna != 'A') {
				//se verifican los caracteres y se va acumulando una lista
				var columnaCaracter = {
					Nombre: nombre,
					Columna: columna
				}
				listaCaracteres.push(columnaCaracter);					
			}
		} else {
			if (columna == 'A') {
				especie = hoja[celda].w;										
			} else if (columna != '!ref') {
				//Se realiza un split de estados de carácter por coma
				if (nombre !== undefined) {
					var estadosCaracter = nombre.split(',');					
					var columnaCaracter = ObtenerColumnaCaracter(listaCaracteres, columna);
					for(var i = 0; i < estadosCaracter.length; i++) {
						if (columnaCaracter.Nombre !==undefined) {
							if ((columnaCaracter.Nombre.trim() != '') &&(estadosCaracter[i].trim() != '')) {
								//Se guardan las relaciones especie-estado de carácter que pertenezcan a los caracteres que fueron agregados anteriormente
								ValidarEspecieEstadoCaracter(especie, estadosCaracter[i].trim(), columnaCaracter.Nombre.trim(), tiempo);
								tiempo +=35;
							}
						}
						
					}	
				}
				
			}
		}	
	}
	console.log('tiempo en guardar relaciones especie-estadoCaracter:' + tiempo);
}
//Función que centraliza la funcionalidad de lectura del excel para guardar las claves electrónicas
function leerExcel (hoja) {	
	
	var tiempoColumnas = GuardarColumnas(hoja);
	//se revisan estados de carácter con caracteres	
	setTimeout(function() {
		var tiempoEstadosCaracter = GuardarEstadosCaracter(hoja, tiempoColumnas);
		console.log('Carga de Estados de Caracter');
		setTimeout(function() {
			//Se eliminan las relaciones entre especies y estados de carácter según los datos del documento
			var tiempoEliminarRelacionEspecieEstadoCaracter = EliminarRelacionEspecieEstadoCaracter(hoja, tiempoColumnas);
			//se revisan estados de carácter con especies
			setTimeout(function() {
				GuardarEspecieEstadoCaracter(hoja, tiempoEliminarRelacionEspecieEstadoCaracter);
				console.log('inicio guardar especies por estado de caracter');
			}, tiempoEliminarRelacionEspecieEstadoCaracter + 1000);
		}, tiempoEstadosCaracter + 1000);
	}, (800 + tiempoColumnas));
}
//Método que retorna el nombre de una columna según la posición
function ObtenerColumnaCaracter(listaColumnas, col) {
	for(var x = 0; x < listaColumnas.length; x++) {
		if (listaColumnas[x].Columna == col) {
			return listaColumnas[x];
		}
	}
}
//Función genérica que valida en la colección especificada si el nombre existe, para posteriormente instalar los nuevos elementos
function ValidarElementos(nombre, coleccion, tiempo) {
	
	MongoClient.connect(MongoConnectionString, function(err, db) {	
		if(err) {
			console.log(err);
		} else { 
			var collection = db.collection(coleccion); 
			setTimeout(function() {
				collection.findOne({Nombre: nombre}, function(err, elemento) {
					if (elemento == null) {
						//console.log('El elemento ' + nombre + ' no se encuentra en bd como ' + coleccion);
						collection.count(function(err, count) {
							//console.log('Cantidad de elementos en colección de ' + coleccion + ': ' + count);
							var nuevoElemento;
							if (coleccion == 'Caracteres') {
								nuevoElemento = {Nombre : nombre, Orden : (count + 1)};
							} else {
								nuevoElemento = {Nombre : nombre};
							}
							collection.insert(nuevoElemento, {w: 1}, function(err, filas){
								//console.log('El elemento ' + nombre + ' fue guardado como ' + coleccion);
								db.close();
							});
						});
					} else {
						//console.log ('El elemento ' + nombre + " ya existe como " + coleccion);
						db.close();
					}
				});
			}, tiempo);
		}
		
	});
}
//Función que verifica y guarda los estados de carácter en el caracter especificado (relación estado de carácter-carácter)
function ValidarEstadosCaracter(nombreEstadoCaracter,nombreCaracter, tiempo) {
	MongoClient.connect(MongoConnectionString, function(err, db) {	
		if(err) {
			console.log(err);
		} else { 
			var CaracterCollection = db.collection('Caracteres'); 
			CaracterCollection.findOne({Nombre: nombreCaracter}, function(err, caracter) {
				if (caracter == null) {
					//console.log('El caracter ' + nombreCaracter + ' no se encuentra.');
					db.close();
				} else {
					//console.log ('El caracter ' + nombreCaracter + ' existe.');					
					var EstadoCaracterCollection = db.collection('EstadoCaracter');
					//console.log('tiempo antes de estadoCaracter: ' + tiempo);
					setTimeout(function() {
							//console.log('tiempo despues de estadoCaracter: ' + tiempo);
							EstadoCaracterCollection.findOne({Nombre: nombreEstadoCaracter, IdCaracter: new ObjectId(caracter._id)}, function(err, estadoCaracter) {
							if (estadoCaracter == null) {
								//console.log('El estado de caracter ' + nombreEstadoCaracter + ' no existe.');
								EstadoCaracterCollection.count({IdCaracter: new ObjectId(caracter._id)}, function(err, count) {
									var nuevoEstadoCaracter = {
																Nombre : nombreEstadoCaracter,
																Orden : (count + 1),
																IdCaracter : new ObjectId(caracter._id)
															  };
									//console.log(nuevoEstadoCaracter);
										EstadoCaracterCollection.insert(nuevoEstadoCaracter, {w: 1}, function(err, filas){								
											//console.log(filas);
											console.log('El estado de caracter ' + nombreEstadoCaracter + ' fue guardado correctamente.');
											db.close();
										});
								});
							} else {							
								//console.log('El estado de caracter ' + nombreEstadoCaracter + ' existe.');
								db.close();
							}
						});
					}, tiempo);
					
				}
			});
		}
	});
}

//Función para eliminar las relaciones de estados de carácter de la especie especificada como parámetro
function EliminarEstadosCaracterEspecie(nombreEspecie, tiempo) {
	MongoClient.connect(MongoConnectionString, function(err, db) {	
		if(err) {
			console.log(err);
		} else { 
			var EspecieCollection = db.collection('Especies');
			setTimeout(function() {
				EspecieCollection.findOne({Nombre: nombreEspecie}, function(err, especie) {
					if (especie == null) {
						console.log('El elemento ' + nombreEspecie + ' no existe.');
						db.close();
					} else {
						var Especie_EstadoCaracterCollection = db.collection('Especie_EstadoCaracter');
						console.log('EspecieEliminar:' + especie._id);
						Especie_EstadoCaracterCollection.remove({IdEspecie: new ObjectId(especie._id)}, function(err,resultado) {
							if (err) {
								console.log(err);
							}
							console.log(resultado);
							db.close();
						});
					}
				});	
			}, tiempo);
		}
	});	
}
//Función que valida la especie, el estado de carácter y el carácter para guardar la relación estado de carácter-especie
function ValidarEspecieEstadoCaracter(nombreEspecie, nombreEstadoCaracter, nombreCaracter, tiempo) {
	MongoClient.connect(MongoConnectionString, function(err, db) {	
		if(err) {
			console.log(err);
		} else { 
			var CaracterCollection = db.collection('Caracteres'); 
			//Se valida que el carácter existe
			CaracterCollection.findOne({Nombre: nombreCaracter}, function(err, caracter) {
				if (caracter == null) {
					console.log('El caracter ' + nombreCaracter + ' no se encuentra.');
					db.close();
				} else {
					//console.log ('El caracter ' + nombreCaracter + ' existe.');
					var EstadoCaracterCollection = db.collection('EstadoCaracter');
					//Se valida que el estado de caracter exista
					EstadoCaracterCollection.findOne({Nombre: nombreEstadoCaracter, IdCaracter: new ObjectId(caracter._id)}, function(err, estadoCaracter) {
						if (estadoCaracter == null) {
							console.log('El estado de caracter ' + nombreEstadoCaracter + ' no existe.');
						} else {
							//console.log('El estado de caracter ' + nombreEstadoCaracter + ' existe.');
							var EspecieCollection = db.collection('Especies');
							//Se verifica que la especie exista
							EspecieCollection.findOne({Nombre: nombreEspecie}, function(err, especie) {
								if (especie == null) {
									console.log('El elemento ' + nombreEspecie + ' no existe.');
									db.close();
								} else {
									var Especie_EstadoCaracterCollection = db.collection('Especie_EstadoCaracter');
									var nuevoEspecie_EstadoCaracter = {
										IdEspecie: new ObjectId(especie._id),
										IdEstadoCaracter: new ObjectId(estadoCaracter._id)
									}
									console.log(nuevoEspecie_EstadoCaracter);
									setTimeout(function(){ 
										Especie_EstadoCaracterCollection.findOne(nuevoEspecie_EstadoCaracter, function(err, relacion) {
											if(relacion == null) {
												console.log ('Especie: ' + especie.Nombre + '\t Estado de caracter: ' + estadoCaracter.Nombre + '\t Caracter: ' + caracter.Nombre);
												//Se guarda la nueva relación
												Especie_EstadoCaracterCollection.insert(nuevoEspecie_EstadoCaracter, {w: 1}, function(err, filas){
													console.log(filas);
													console.log('La relación entre ' + nombreEspecie + ' y ' + nombreEstadoCaracter + ' fue guardada correctamente.');
													db.close();
												});
											}
										});	
									}, tiempo);
								}
							});
						}
					});
				}
			});
		}
	});	
}

//Método para leer un excel y convertirlo en un árbol estructurado para d3 (test)
function readSheet(SheetObject){
	var arbol = {
		name : "Escoja Estado de Carácter",
		column: null,
		isDerivated: "true",
		isColumn: "true",
		children: null
	} ;
	arbol.children = new Array();
	
	var listaColumnas = new Array();	
	for(var attribute in SheetObject) {
		var row = attribute.replace(/[^\d]/gm,'');		
		var column = attribute.replace(row,'');		
		
		if(row=='1') {
			//console.log ('column: ' + column);
			var col = {
				name: SheetObject[attribute].w,
				position: column,
				isDerivated: "false",
				isColumn: "true",
				children: null
			};
			col.children = new Array();			
			//console.log(attribute +": " + SheetObject[attribute].w);
			if(SheetObject[attribute].w.indexOf(':') >= 0 ){
				var colArray = SheetObject[attribute].w.split(':');
				col.name = colArray[0];
				col.isDerivated = "true";
				col.position = "null";
				col.isColumn = "false";
				//console.log(colArray);
				//console.log(col);
				var colExists = nodeExists(arbol, col);
				if (colExists === undefined){
					colExists = false;
				}
				//console.log('colExists: ' + colExists);
				if(colExists == false) {					
					//console.log('node to insert: ' + col.name);
					insertNode(arbol, arbol, col);
				}
				
				//console.log('next node to check: ' + colArray[1]);
				
				var col2 = {
					name: colArray[1],
					position: column,
					isDerivated: "false",
					isColumn: "true",
					children: new Array()
				}
				//console.log(col2); 				
				colExists = nodeExists(arbol,col2);
				
				if(colExists === undefined) {
					colExists = false;
				}
				//console.log('second col exists: ' + colExists);
				if (!colExists) {
					insertNode(arbol,col,col2);
				}
				listaColumnas.push(col2);
			} else {
				var colExists = nodeExists(arbol, col);	
				if (colExists === undefined){
					colExists = false;
				}
				if (!colExists) {
					insertNode(arbol,arbol,col);
				}
				listaColumnas.push(col);
			}
		} else if (SheetObject[attribute].w !== undefined) {			
			
			var col = {
				name: SheetObject[attribute].w,
				position: column,
				isDerivated: "false",
				isColumn: "false"
			};
			var parentNode = getColumn(listaColumnas,column);			
			//console.log ('parent Name: ' + parentNode.name);
			var colExists = nodeExists(arbol,col);			
			if(colExists === undefined) {
				colExists = false;
			}			
				//console.log ('node Exists: ' + colExists);
			if (!colExists) {
				//console.log('row: ' + row + ", col " + column);
				//console.log('node to insert: ' + col.name);
				insertNode(arbol,parentNode,col);
			}
		}
	}
	//console.log('arbol final');
	//console.log(JSON.stringify(arbol));
	fs.writeFile('./jsondata/flare.json', JSON.stringify(arbol), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to flare.json");
    }
}); 
}

//Método que recupera el nombre de la columna según la posición (letra de columna del Excel) (test)
function getColumn(columnas, col) {	
	//console.log(columnas);
	for(var x = 0; x < columnas.length; x++) {
		if (columnas[x].position == col) {
			return columnas[x];
		}
	}
}
//Método que verifica si en el arbol existe la celda especificada, para insertarla (test)
function nodeExists(treenodes, cell) {	
	//console.log(treenodes);
	var existColumn = ((cell.name == treenodes.name) && (cell.position == treenodes.position))
	//console.log('checking node: ' + cell.name);
	//console.log('current node: ' + treenodes.name);
	//console.log('existsColumn: ' + existColumn);
	if (existColumn == true) {				
		return true;
	} else {
		//console.log('treenode children:' + treenodes.children.length);
		if (treenodes.children !== undefined) {
			for (var x = 0; x < treenodes.children.length; x++) {
				//console.log('node');						
				//console.log(treenodes.children[x]);
				//console.log ('checking children...' + treenodes.children[x].name);
				var result = nodeExists(treenodes.children[x], cell);
				if (result === undefined){
					result = false;
				}
				//console.log('result: ' + result);
				//console.log('end checking children...' + treenodes.children[x].name )
				if (result == true){				
					return true;
				}
			}	
		}
	}
}

//Método que inserta un nodo en la estructura de árbol (test)
function insertNode(treeNode, parentCell, newCell) {
	//console.log('insert node begin');	
	var existNode = ((parentCell.name == treeNode.name) && (parentCell.position == treeNode.position));	
	if (existNode == true) {		
		var children;
		if (treeNode.children !== undefined) {
			if(treeNode.children.length == 0) {
				children = new Array();
			} else {
				children = treeNode.children;
			}		
			children.push(newCell);		
			treeNode.children = children;	
			//console.log ('children length: ' + treeNode.children.length);
		}
	} else {
		if (treeNode.children !== undefined) {
			for(var x = 0; x < treeNode.children.length; x++) {	
				//console.log('children node begin');
				insertNode(treeNode.children[x], parentCell, newCell);
				//console.log('children node end');
			}
		}		
	}
	//console.log('insert node end');
}
//Método de prueba para conectarse a mongodb (test)
function connectMongodb(){ 	
	MongoClient.connect(MongoConnectionString, function(err, db) {
	  if(!err) {
		console.log("Database connected");
		//console.log(db);
		var CaracteresCollection = db.collection('Caracteres');
		//console.log(CaracteresCollection);
		CaracteresCollection.find({_id: new ObjectId('5473ecab81e68e3819fa46e9')}).toArray(function(err, items) {
			if (items.length == 0) {
				console.log ('Name not found');
			} else if (items.length == 1) {
				items.forEach(function(item) {
					console.log(item);
					console.log(item._id);
				});
				//console.log(items);				
			}
			
		});		
		var EspeciesCollection = db.collection('Especies');		
		//console.log(EspeciesCollection);
		var EstadosCaracterCollection = db.collection('EstadoCaracter');
		//console.log(EstadosCaracterCollection);
		var Especie_EstadoCaracterCollection = db.collection('Especie_EstadoCaracter');
		//console.log(Especie_EstadoCaracterCollection);
	  } else {
		console.dir(err);
	  }
	});
}

//Método para recuperar un "mini árbol" con el carácter como nodo raíz y los estados de carácter como sus nodos descendientes desde BD
function ObtenerNodo(Nivel, res) {

	MongoClient.connect(MongoConnectionString, function(err, db) {	
		if(!err) { 
			var CaracteresCollection = db.collection('Caracteres');
			//Se obtiene el carácter especificado en el nivel			
			CaracteresCollection.findOne({Orden: parseInt(Nivel)}, function(err, caracter) {
				//console.log(caracter);
				var EstadosCaracterCollection = db.collection('EstadoCaracter');				
				//Se obtiene el conjunto de estados de carácter relacionados
				if (caracter == null) {
					if (Nivel == 1) {
						var raiz = {
							codigo: 'raiz',
							name : "No se encontraron caracteres.",
							orden: 0,
							esCaracter: "true",
							seleccionado: "false",
							children: new Array()
						} ;
						res.send({ data: JSON.stringify(raiz) });
					} else {
						res.send({ data: null });
					}
					
				}else {
					EstadosCaracterCollection.find({IdCaracter: new ObjectId(caracter._id)}, {sort:"Orden"}).toArray(function(err, ResultadoEstadosCaracter) {
					
						if (err == null) {						
							var raizPrimerNivel = {
									codigo: caracter._id,
									name : caracter.Nombre,
									orden: caracter.Orden,								
									esCaracter: "true",
									seleccionado: "false",
									children: new Array()
							} ;								
							//Si es el primer nivel, se le agrega el nodo raíz del árbol
							if(Nivel == 1) {							
								var raiz = {
									codigo: 'raiz',
									name : "Escoja Estado de Carácter",
									orden: 0,
									esCaracter: "true",
									seleccionado: "false",
									children: new Array()
								} ;
								AsignarEstadosCaracterRaiz(raizPrimerNivel, ResultadoEstadosCaracter);
								raiz.children.push(raizPrimerNivel);
								//console.log(raiz);							
								res.send({ data: JSON.stringify(raiz) });
							} else {
								//De no ser el nodo raíz se recupera el nodo del carácter especificado y se retorna como un JSON.
								AsignarEstadosCaracterRaiz(raizPrimerNivel, ResultadoEstadosCaracter);
								//console.log(raizPrimerNivel);
								res.send({ data: JSON.stringify(raizPrimerNivel) });
							}						
						}
					});
				}
			});			
		} else {
			console.dir(err);
		}
	});
}
//Método que reestructura los atributos de los estados de carácter para asociarlos con la raíz
function AsignarEstadosCaracterRaiz(raizCaracter, estadosCaracter) {
	estadosCaracter.forEach(function(item) {
		var NodoEstadoCaracter = {
			codigo: item._id,
			name : item.Nombre,
			orden: item.Orden,
			esCaracter: "false",
			seleccionado: "false",			
			children: null
		};
		console.log('Orden: ' + item.Orden);
		console.log('Estado de Carácter: ' + item.Nombre);
		raizCaracter.children.push(NodoEstadoCaracter);
	});
}