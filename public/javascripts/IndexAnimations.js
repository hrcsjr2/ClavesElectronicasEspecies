/************************************************************************************************************************
Código elaborado por: Herman Camacho Sánchez.
Descripción: Métodos para el manejo de formularios y la carga del documento Excel
************************************************************************************************************************/
$(document).ready(function() {
	//Efecto para mostrar/ocultar menú
	$('#toggle-menu').click(function(){ 
		if($('#wrapmenu').is(':hidden')) {
			$('#wrapmenu').find('div').slideDown('slow');
			
			$('#wrapmenu').slideDown('slow');
			
			$(this).animate({ "top": "+=97px", "opacity": "+=0.5" }, "slow" );
			$('#maincontent').animate({"margin-top": "+=97px"}, "slow");
		} else {			
			$('#wrapmenu').find('div').slideUp('slow');
			$('#wrapmenu').slideUp('slow');			
			
			$(this).animate({ "top": "-=97px", "opacity": "-=0.5" }, "slow" );
			$('#maincontent').animate({"margin-top": "-=97px"}, "slow");
		}
		ValidateSession();
	});	
	
	$('#resultsTable').hide();	
		
	
	$("#minimizeTable").on("mousedown mouseup", function(e){		
		$(this).toggleClass("active", e.type === "mousedown");
	});

	$("#minimizeTable").click(function() {
		$(this).parent().fadeOut('fast');
		var pos = $(this).parent().position() ;	
		//console.log('pos right: ' + pos.right);
		//$('#miniresultsTable').css({'top' : (pos.top * 2) + 'px', 'left' : (pos.left + 100) + 'px'});
		$('#miniresultsTable').fadeIn();
	});
	
	$('#resultsTable').draggable({
    stop: function(event, ui) {
        $( event.toElement ).one('click', function(e){ e.stopImmediatePropagation(); } );
    }
	});
	
	$('#miniresultsTable').click(function() {		
		$('#miniresultsTable').fadeOut();
		var pos = $(this).position();
		if ($(this).css('right') == '0px') {
			//$(this).css({'right' : '200px'});
			//$(this).animate({ "right": "+=200px"}, "slow" );
			pos.left = pos.left - 250;
		}
		$('#resultsTable').css({'top' : (pos.top / 2) + 'px', 'left' : (pos.left - 100) + 'px'});
		$('#resultsTable').fadeIn();					
	});

	
	
	ValidateSession();
	
	
	
	var offset = 220;
	var duration = 500;
	$(window).scroll(function() {
		if ($(this).scrollTop() > offset) {
			$('.back-to-top').fadeIn(duration);
		} else {
			$('.back-to-top').fadeOut(duration);
		}
	});
	
	$('.back-to-top').click(function(event) {
		event.preventDefault();
		$('html, body').animate({scrollTop: 0}, duration);
		return false;
	})
	var hecho = '072 101 114 109 097 110 032 067 097 109 097 099 104 111 032 083 195 161 110 099 104 101 122 032';
	var dialogValidaciones = $('#error-message').dialog({
	  autoOpen: false,
	  stack: true,
	  title: 'Error',
	  height: 200,
	  width: 400,
	  modal: true,
	  resizable: false,	  
	  show: {
        effect: "fade",
        duration: 500
      },
      hide: {
        effect: "fade",
        duration: 500
      },	  
	  buttons: {
		"Ok": function(){			
		  $(this).dialog('close');
		}
	  }
	})
	dialogValidaciones.prev(".ui-dialog-titlebar").css("background","#C72200");
	
	var dialogMensaje = $('#messageBox').dialog({
	  autoOpen: false,
	  stack: true,
	  title: 'Mensaje',
	  height: 200,
	  width: 400,
	  modal: true,
	  resizable: false,	  
	  show: {
        effect: "fade",
        duration: 500
      },
      hide: {
        effect: "fade",
        duration: 500
      },	  
	  buttons: {
		"Ok": function(){			
		  $(this).dialog('close');
		}
	  },
	  close: function() {
		$('#messageBox').find('#messageText').text('');
	  }
	})
	dialogMensaje.prev(".ui-dialog-titlebar").css("background","#61c419");
	
	var dialogfrmArchivo = $('#frmCargaArchivo').dialog({
	  closeOnEscape: false,
	  autoOpen: false,
	  stack: true,
	  title: 'Cargar Archivo',
	  height: 410,
	  width: 500,
	  modal: true,
	  resizable: true,	  
	  show: {
        effect: "fade",
        duration: 500
      },
      hide: {
        effect: "fade",
        duration: 500
      },
	  buttons: {
		"Salir": function(){
			$(this).dialog('close');
		}
	  },
	  open: function(event, ui) {
		  $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
	  },
	  close: function() { 
		$('#hoja').val('');
		$('#frmSubirArchivo').find('ul').find('li').remove();
		$('#frmSubirArchivo').find('ul').hide();
	  }
	})
	dialogfrmArchivo.prev(".ui-dialog-titlebar").css("background","#61c419");
	
	var dialogConfirmacion = $('#confirmationBox').dialog({
	  autoOpen: false,
	  stack: true,
	  title: 'Confirmación',
	  height: 200,
	  width: 400,
	  modal: true,
	  resizable: false,	  
	  show: {
        effect: "fade",
        duration: 500
      },
      hide: {
        effect: "fade",
        duration: 500
      },	  
	  buttons: {
		"Sí": function(){			
			$(this).dialog('close');
			$('#cerrarSesion').parent().fadeOut('slow');
			$('#cargarClaveExcel').parent().fadeOut('slow');
			localStorage['logged'] = false;
			$('#inicioSesion').parent().fadeIn('slow');
			var ul = $('#resultsDataTable').find('ul');
			ul.find('li').fadeOut().remove();
			$('<li class="seleccioneEstado"><p>Escoja un estado de carácter para ver los resultados.</p></li>').hide().appendTo(ul).fadeIn();
			$('#resultsHeader').text('Resultados encontrados');
			loadTree(1);
		},
		"No": function(){
			$(this).dialog('close');
		},
		"Cancelar": function(){
			$(this).dialog('close');
		}
	  },
	  close: function() {
		$('#messageBox').find('#messageText').text('');
	  }
	})
	dialogConfirmacion.prev(".ui-dialog-titlebar").css("background","#61c419");
	
	var dialogInicioSesion = $( "#dialog-login" ).dialog({
	  autoOpen: false,
	  title: 'Iniciar Sesión',
	  height: 320,
	  width: 400,
	  modal: true,
	  resizable: false,	  
	  show: {
        effect: "fade",		
        duration: 500
      },
      hide: {
        effect: "fade",
        duration: 500
      },
	  buttons: {
		"Iniciar Sesión": function(){
			 var valido = true;
			 var username = $('#user');
			 var password = $('#password');
			 $(this).find('input').removeClass("ui-state-error");
			 valido = valido && validarTamano(username, "Usuario", 3, 16);
			 valido = valido && validarTamano(password, "Contraseña", 5, 16);			 
			 valido = valido && validarRegexp(password, /^([0-9a-zA-Z])+$/, "El campo de Contraseña solamente soporta: a-z 0-9");
			 if (!valido){			 
				dialogValidaciones.dialog('open');
			 } else{
				console.log(valido);
				$.ajax({
				  cache: false,
				  async: false,
				  type: "POST",
				  url: "/checkLogin",
				  dataType: 'html',
				  data: { username: username.val(), password: password.val()},
				  success:function(data){
					var frmExists = false;
					if(data!==undefined){						
						$('#frmCargaArchivo').html(data);
						frmExists=true;						
						CargarArchivo();
					}
					if (frmExists == true){
						$('#messageBox').find('#messageText').text('Bienvenido');
						dialogMensaje.dialog('open');						
						dialogInicioSesion.dialog('close');
						$('#cerrarSesion').parent().fadeIn('slow');
						$('#cargarClaveExcel').parent().fadeIn('slow');						
						localStorage['logged']=true;
						localStorage['uploadFile']=data;
						$('#inicioSesion').parent().fadeOut('slow');
					}
				  },
				  error: function(xhr, ajaxOptions, thrownError) {
					console.log(xhr);
					console.log(ajaxOptions);
					console.log(thrownError);
				  }
				});
			 }		  
		},
		"Salir": function() {
		  $(this).dialog( "close" );
		}
	  },
	  close: function(){
		$(this).find('input').removeClass("ui-state-error");
		$('#confirmationBox').find('#confirmationMessageText').text("");
		$('#user').val('');
		$('#password').val('');
	  }
	  
	});
	
	$('#inicioSesion').click(function(){		
		dialogInicioSesion.dialog('open');
	});
	$('#cerrarSesion').click(function(){
		$('#confirmationBox').find('#confirmationMessageText').text("¿Desea Salir?");
		dialogConfirmacion.dialog('open');
	});
	
	$('#cargarClaveExcel').click(function(){
		if ($('#frmCargaArchivo').find('form').length > 0){
			dialogfrmArchivo.dialog('open');
			window.dialogfrmArchivo = dialogfrmArchivo;
		}
	});
	window.dialogValidaciones = dialogValidaciones;
	CargarArchivo();
	
	$(window).resize(function() {
		if ($('#resultsTable').is(":visible")){
			$('#resultsTable').css({'top' : ($(window).height() / 2) - 100 , 'left' : ($(window).width() - 400)});
		}
		$('#electronickeycontainer').css({'width': $('#electronickeycontainer').parent().width()});
		$(document).find('#tree-svg').css({'width': '100%'})
	});
	$('#electronickeycontainer').css({'width': $('#electronickeycontainer').parent().width(), 'position': 'fixed', 'z-index': 0});
	$(document).find('#tree-svg').css({'width': '100%'})
});
//Método que valida las cajas de texto que aparecen en los formularios de inicio de sesión y de carga de archivos.
function validarTamano( o, n, min, max ) {
  if ( o.val().length > max || o.val().length < min ) {
	o.addClass( "ui-state-error" );
	$('#error-message').find('#message').text("El tamaño de " + n + " debe estar entre " + min + " y " + max + " caracteres.");	
	return false;
  } else {
	return true;
  }
}
//Método que valida valores contra expresiones regulares
function validarRegexp( o, regexp, n ) {
  if ( !( regexp.test( o.val() ) ) ) {
	o.addClass( "ui-state-error" );	
	$('#error-message').find('#message').text(n);
	return false;
  } else {
	return true;
  }
} 
 //Función que se encarga de cargar el documento para sus validaciones y de ser válido, insertar los catálogos y relaciones necesarias para las claves electrónicas
function CargarArchivo(){
	var ul = $('#frmSubirArchivo ul');	
		ul.hide();
	$('#SubirArchivo').click(function(){
        $(this).parent().find('input[type="file"]').trigger('click');		
    });	

	
    $('#frmSubirArchivo').fileupload({
        dropZone: $('#SubirArchivo'),
		dataType: 'json',
		formData: $('#frmSubirArchivo').serializeArray(),		
        // This function is called when a file is added to the queue;
        // either via the browse button, or via drag/drop:
        add: function (e, data) {
			var hoja = $('#hoja');
			var resultado = validarTamano(hoja, "Nombre de la Hoja", 1, 20);
			if (!resultado){
				window.dialogValidaciones.dialog('open');
				return false;
			}			
			ul.show();
            var tpl = $('<li class="working"><input type="text" value="0" data-width="48" data-height="48"'+
                ' data-fgColor="#0788a5" data-readOnly="1" data-bgColor="#3e4043" /><p></p><span></span></li>');
				
            tpl.find('p').text(data.files[0].name)
                         .append('<i>' + formatFileSize(data.files[0].size) + '</i>');
            // Add the HTML to the UL element
            data.context = tpl.appendTo(ul);

            // Initialize the knob plugin
            tpl.find('input').knob({									
									fgColor: '#9dd53a'
								   })
							 .attr('data-readOnly',true)
							 .attr('data-width',150)
							 .attr('data-thickness',.3);
								   

            // Listen for clicks on the cancel icon
            tpl.find('span').click(function(){

                if(tpl.hasClass('working')){
                    jqXHR.abort();
                }

                tpl.fadeOut(function(){
                    tpl.remove();
					if (ul.find('li').length == 0){
						ul.hide();
					}
                });
            });

            // Automatically upload the file once it is added to the queue
            var jqXHR = data.submit();
			
        },

        progress: function(e, data){

            // Calculate the completion percentage of the upload
            var progress = parseInt(data.loaded / data.total * 100, 10);

            // Update the hidden input field and trigger a change
            // so that the jQuery knob plugin knows to update the dial
            data.context.find('input').val(progress).change();

            if(progress == 100){
                data.context.removeClass('working');
            }
        },

        fail:function(e, data){
            // Something has gone wrong!
            data.context.addClass('error');
			data.context.attr('title','No se pudo cargar el archivo. Intente de nuevo.');
        },
		done: function (e, data) {
			var result = JSON.parse(data.result.data);
			data.context.attr('title',result.message)
			if (result.status == 'error'){
				data.context.addClass('error');
			} else {
				//Cuando la carga del archivo se realizó de manera exitosa, se procesan los datos del documento
				$.ajax({
				  cache: false,
				  async: false,
				  type: "POST",
				  url: "/readFile",				 
				  dataType: "json",
				  data: {Hoja: $('#hoja').val()},
				  success:function(resultData){
					var result = JSON.parse(resultData.data);
					console.log(result);
					if (result.status =="error"){
						data.context.addClass('error');
						data.context.attr('title',result.message)
					}else {
						console.log('Datos encontrados');
						$.blockUI({ message: '<h2><img src="../images/loading.gif" style="width: 30px; height: 30px;"/>Cargando...</h2>'}); 
						setTimeout(function() { 
							//Se deja un tiempo de espera mientras el servidor concluye el proceso de carga para refrescar el árbol
							window.dialogfrmArchivo.delay(100000).dialog('close');
							loadTree(1);
							$.unblockUI();
						}, 29000);
					}
				  },
				  error: function(xhr, ajaxOptions, thrownError) {
					console.log(xhr);
					console.log(ajaxOptions);
					console.log(thrownError);
				  }
				  
				});
			}
			            
        }

    });
	//Función que evita el arrastrar y soltar documentos sobre la página completa
	$(document).on('drop dragover', function (e) {
        e.preventDefault();
    });

}

//Función que calcula en bytes, el progreso de la carga del documento
function formatFileSize(bytes) {
	if (typeof bytes !== 'number') {
		return '';
	}

	if (bytes >= 1000000000) {
		return (bytes / 1000000000).toFixed(2) + ' GB';
	}

	if (bytes >= 1000000) {
		return (bytes / 1000000).toFixed(2) + ' MB';
	}

	return (bytes / 1000).toFixed(2) + ' KB';
}
//Método que valida el uso de sesiones en el prototipo
function ValidateSession() {
	if(localStorage['logged'] ==undefined){	
		
		$('#cerrarSesion').parent().hide();
		$('#cargarClaveExcel').parent().hide();
		$('#inicioSesion').parent().show();			
				
	} else if (localStorage['logged']=="false") {
		$('#cerrarSesion').parent().hide();
		$('#cargarClaveExcel').parent().hide();
		$('#inicioSesion').parent().show();
	} else {
		$('#cerrarSesion').parent().show();
		$('#cargarClaveExcel').parent().show();
		$('#inicioSesion').parent().hide();
		$('#frmCargaArchivo').html(localStorage['uploadFile']);
	}
}