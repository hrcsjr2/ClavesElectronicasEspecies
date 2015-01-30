var express = require('express');
//llamamos al modelo data.js para utilizar toda su funcionalidad
var dataModel = require('../models/data');
var router = express.Router();

//aquí tenemos el objeto app que hemos traído de app.js
module.exports = function(app)
{
    //si abrimos http://localhost:3000/ y miramos la terminal
    //veremos el mensaje que contiene msg en el modelo data
    app.get("/", function(req, res)
    {
        console.log(dataModel.msg);
        res.end();
    });
 
     //si abrimos http://localhost:3000/parametros/juan y miramos la terminal
     //veremos Hola juan, esta es la forma de recoger parámetros via get
     //con el objeto params del objeto req
    app.get("/parametros/:nombre", function(req, res)
    {
        dataModel.parametros(req.params.nombre);
        res.end();
    });
 
    //si accedemos a http://localhost/3000 y miramos la terminal veremos 
    //Israel tiene 32 años y una web que se llama http://uno-de-piera.com
    app.get("/objeto", function(req,res)
    {
        var objeto = dataModel.objeto;
        console.log(objeto.nombre + " tiene " + objeto.edad + " años y una web que se llama " + objeto.web);
        res.end();
    });
 
    //si abrimos http://localhost:3000/mvc veremos lo que contiene msg en pantalla
    app.get("/mvc", function(req, res)
    {
        res.render('index', { 
            title: 'MVC con node y express',
            msg: dataModel.msg
        });
    });
}

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
