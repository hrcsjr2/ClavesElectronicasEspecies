/************************************************************************************************************************
Código elaborado por: Herman Camacho Sánchez.
Descripción: Métodos para la construcción del árbol y consulta de especies por estados de caracter
************************************************************************************************************************/
$(document).ready(function(){	
	window.filtroEstadoCaracter = undefined;
	var demo = '072 101 114 109 097 110 032 067 097 109 097 099 104 111 032 083 195 161 110 099 104 101 122 032';
	$( document ).tooltip({
      track: true
	});
	loadTree(1);	
});
//Función que se encarga de pintar el árbol, mostrando como nodo principal el especificado cmo parámetro
function loadTree(Nivel){
if (Nivel == 1) {
	window.filtroEstadoCaracter = undefined;
}
$(document).find('#tree-svg').remove();
	
	var margin = {top: 20, right: 120, bottom: 20, left: 250};
	var winwidth = $(document).width();
	var defaultwidth = 960;
	if (winwidth > defaultwidth){
		defaultwidth = winwidth;
	}
    width = $(document).width();//(defaultwidth * 1.2) - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;
    
	var i = 0,
		duration = 400,
		root;

	var tree = d3.layout.cluster()		
		.size([height, width]);

	var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

	var svg = d3.select("div.tree-container").append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
		.attr('id','tree-svg')
		.attr('display','none')
	    .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	var color = d3.scale.category20();
	
	treeZoom = d3.behavior.zoom();	
	treeZoom.on("zoom", zoomed);
	d3.select("#tree-svg").call(treeZoom);
	

	function collapse(d) {
		if (d.children) {
		  d._children = d.children;
		  d._children.forEach(collapse);
		  d.children = null;
		}
	}	
	//Se realiza la consulta de los datos que se procesarán con d3 para pintar el árbol
	$.ajax({
	  cache: false,
	  async: true,
	  type: "POST",
	  data: {OrdenNodo: Nivel},
	  url: "/getJSONTreeData",
	  success:function(data){
		root = JSON.parse(data.data);		
		root.x0 = height / 2;
		root.y0 = 0;
		
		root.children.forEach(collapse);
		root._children = root.children;
		root.children = null;		
		//update(root);
		click(root);		
		$($('.nodetext')[0]).unbind('click');
		$($('.nodecircle')[0]).unbind('click');
		d3.select(self.frameElement).style("height", height + "px");
		$('#tree-svg').removeAttr('display');
		$('#tree-svg').fadeIn( "slow" );			
	  },
	  error: function(xhr, ajaxOptions, thrownError) {
		console.log(xhr);
		console.log(ajaxOptions);
		console.log(thrownError);
	  }
	  
	});
	//Método que actualiza el árbol según la fuente
	function update(source) {		
		// compute the new height
		var levelWidth = [1];
		var childCount = function(level, n) {

		  if(n.children && n.children.length > 0) {
			if(levelWidth.length <= level + 1) levelWidth.push(0);

			levelWidth[level + 1] += (n.children.length);
			n.children.forEach(function(d) {
			  childCount(level + 1, d);
			});
		  }
		};
		childCount(0, root);		
		var newHeight = (d3.sum(levelWidth) * 20);
		tree = tree.size([newHeight, width]);	
		
		$(".tree-container").parent().css({ 'min-height': newHeight });
		$("#tree-svg").css({ 'min-height': newHeight + 50});		
		// Compute the new tree layout.
		var nodes = tree.nodes(root).reverse(),
		  links = tree.links(nodes);		
		// Normalize for fixed-depth.
		nodes.forEach(function(d) { 
			d.y = d.depth * 180;			
		});		
		// Update the nodes…
		var node = svg.selectAll("g.node")
		  .data(nodes, function(d) { return d.id || (d.id = ++i); });

		// Enter any new nodes at the parent's previous position.
		var nodeEnter = node.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
		  .on("click", click)

		nodeEnter.append("circle")
		  .attr("r", 5)
		  .attr("class", function(d) {return d._children ? "circleroot" : "nodecircle"; })	
		  .style("fill", function(d) {
			if(d.esCaracter == "true") {
				return "#b4e391";
			} else {
				//return color(d.name);
				return "#f9c667";
			}
			
		  })
		  .style("stroke", function (d) {
			if(d.esCaracter == "true") {
				return "#00c458";
			} else {
				//return color(d.name);
				return "#ff7400";
			}
		  });

		  
		nodeEnter.append("text")
		  .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
		  .attr("dy", ".35em")
		  .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })		    
		  .text(function(d) { return d.name; })
		  .style("fill-opacity", 1e-6);
		
		node.selectAll('text')
		.attr("fill", function(d) {
			if (d.seleccionado == 'true' && d.orden > 0) {
				return "#c4000a";
			} else {
				return "#000000";
			}
		  });
		
		
		$('circle').unbind('mouseenter');
		$('circle').bind('mouseenter', function(){
			$(this).attr('title',$(this).next().text());			
		});
		
		$('text').unbind('mouseenter');
		$('text').bind('mouseenter', function(){
			$(this).attr('title',$(this).text());
		});	
		
		// Transition nodes to their new position.
		var nodeUpdate = node.transition()
		  .duration(duration)
		  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });		
		nodeUpdate.select("text")
		.style("fill-opacity", 1);

		// Transition exiting nodes to the parent's new position.
		var nodeExit = node.exit().transition()
		  .duration(duration)
		  .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
		  .remove();

		nodeExit.select("circle")
		  .attr("r", 1e-6);

		nodeExit.select("text")
		  .style("fill-opacity", 1e-6);

		// Update the links…
		var link = svg.selectAll("path.link")
		  .data(links, function(d) { return d.target.id; });
		

		// Enter any new links at the parent's previous position.
		link.enter().insert("path", "g")
		  //.attr("class", "link")
		  .attr("class", function(d) {
			if (d.target.esCaracter == "true") {
				return "link linkCaracter";
			} else {
				return "link linkEstadoCaracter";
			}
		  })
		  .attr("d", function(d) {
			var o = {x: source.x0, y: source.y0};
			return diagonal({source: o, target: o});
		  });

		// Transition links to their new position.
		link.transition()
		  .duration(duration)
		  .attr("d", diagonal);		
		// Transition exiting nodes to the parent's new position.
		link.exit().transition()
		  .duration(duration)		  
		  .attr("d", function(d) {
			var o = {x: source.x, y: source.y};
			return diagonal({source: o, target: o});
		  })
		  .remove();		  
		// Stash the old positions for transition.
		nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
		});
				
		d3.select("div.tree-container").select('svg')
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom);
		
		
		
	}
	
	// Toggle children on click.
	function click(d) {
		
		if(window.filtroEstadoCaracter === undefined) {
				window.filtroEstadoCaracter = new Array();
		}
		
		if (d.seleccionado == "false") {
			d.seleccionado = "true";			
		} else {
			d.seleccionado = "false";
		}					
		if (d.children) {
			d._children = d.children;
			d.children = null;
			//console.log ('node clicked, children is null');
		} else {
			d.children = d._children;
			d._children = null;
			//console.log ('node clicked, _children is null');
		}
		
		if (d.esCaracter == "true") {			
			if(d.orden != 0) {
			//Si un caracter se le está quitando la selección, actualiza la estructura de filtros hasta el nivel actual y se modifica el pintado de los nodos hijos
				if (d.seleccionado == 'false') {
					var pos = 0;
					while(pos < window.filtroEstadoCaracter.length) {
						if (window.filtroEstadoCaracter[pos].NivelCaracter >= d.orden) {
							window.filtroEstadoCaracter.splice(pos,1);
						} else {
							pos++;
						}
					}
					
					if(window.filtroEstadoCaracter.length > 0) {
						ConsultarEspecies();
					}
					
					for (var index = 0; index < d._children.length;index++) {
						if(d._children[index].esCaracter == 'true') {
							d._children.pop();
							break;
						}
					}
					
				} else {
					for (var index = 0; index < d.children.length;index++) {
						if(d.children[index].esCaracter == 'false') {
							d.children[index].seleccionado = 'false';
						}
					}
				}	
			}
			update(d);	
		} else if (d.esCaracter == "false") {
			//Se ejecuta el proceso para asignar el estado de caracter a la lista de filtros			
			var filtro={
							NivelCaracter: d.parent.orden,
							IdEstadoCaracter: d.codigo,
							NombreEstadoCaracter: d.name
					   };
			if(d.seleccionado == 'true') {
				window.filtroEstadoCaracter.push(filtro);
			} else {				
				for(var pos = 0; pos < window.filtroEstadoCaracter.length; pos++) {				
					if (window.filtroEstadoCaracter[pos].IdEstadoCaracter == d.codigo) {
						window.filtroEstadoCaracter.splice(pos,1);
						break;
					}
				}
			}
			if(window.filtroEstadoCaracter.length > 0) {
					ConsultarEspecies();
			}
			//Se ejecuta el proceso de pintado del siguiente caracter por mostrar
			var orden = d.parent.orden;
			var existeCaracter = false;
			var existenSeleccionados = false;
			for (var index = 0; index < d.parent.children.length;index++) {
				//console.log(d.parent.children[index]);
				if (d.parent.children[index].esCaracter =="true") {
					existeCaracter = true;
				}
				if(d.parent.children[index].seleccionado == "true") {
					existenSeleccionados = true;
				}
			}
			if (existeCaracter == true) {
				if (existenSeleccionados == true) {					
					update(d);
				} else {
					d.parent.children.pop();
					update (d);
					update(d.parent);
				}
			} else {
				if (existenSeleccionados == true) {
					
					//Se consulta próximo nodo a cargar
					$.ajax({
					  cache: false,
					  async: false,
					  type: "POST",
					  data: {OrdenNodo: (orden + 1)},
					  url: "/getJSONTreeData",
					  success:function(data){
						var resultado = JSON.parse(data.data);
						if (resultado == null) {
							update (d);	
						} else {
							resultado.x0 = height / 2;
							resultado.y0 = 0;						
							resultado.children.forEach(collapse);
							resultado._children = resultado.children;
							resultado.children = null;	
							resultado.seleccionado = false;							
							resultado.seleccionado = "false";
							d.parent.children.push(resultado);
							update (d);
							update(d.parent);
						}
						resizeTreeContainer();
						
					  },
					  error: function(xhr, ajaxOptions, thrownError) {
						console.log(xhr);
						console.log(ajaxOptions);
						console.log(thrownError);
					  }
					  
					});
				} else {
					update(d);
				}
			}
			
		}
		
		
		resizeTreeContainer();
		
		
	}
	
		
	resizeTreeContainer();
	function zoomed() { 
       var zoomTranslate = treeZoom.translate();       
	   d3.select("g").attr("transform", "translate(" + (zoomTranslate[0] + margin.left) + "," + (zoomTranslate[1] + margin.top) + ")");
	}
}

function resizeTreeContainer(){
	
	if ($('.tree-container').width() < $('#tree-svg').width()){
		$(".tree-container").parent().css({ 'min-width': $(document).width() });
	}
	/*
	if ($('#tree-svg').height() < $(window).height() ){			
		$(".tree-container").parent().css({ 'min-height': $(window).height() });
		$("#tree-svg").css({ 'min-height': $(window).height() });
	}
	*/
}

function ConsultarEspecies() {
	console.log('ConsultarEspecies');
	//Se consulta próximo nodo a cargar
	$.ajax({
	  cache: false,
	  async: true,
	  type: "POST",
	  data: {Filtros: JSON.stringify(window.filtroEstadoCaracter)},
	  url: "/BuscarEspecies",
	  dataType: "json",
	  success:function(data){		
		var especies = JSON.parse(data.data);
		var ul = $('#resultsDataTable').find('ul');
		ul.find('li').fadeOut().remove();
		if(especies.length == 0) {			
			$('<li><p>No hay resultados.</p></li>').hide().appendTo(ul).fadeIn();
		}
		for(var especie in especies) {
			var li = '<li><p id="' + especies[especie].IdEspecie + '" title="' + especies[especie].Nombre + '">' + especies[especie].Nombre + '</p></li>';
			$(li).hide().appendTo(ul).fadeIn();
		}
		$('#resultsHeader').text('Resultados encontrados: ' + especies.length);
		if (!$('#resultsTable').is(":visible")){
			$('#miniresultsTable').trigger('click');
		}
	  },
	  error: function(xhr, ajaxOptions, thrownError) {
		console.log(xhr);
		console.log(ajaxOptions);
		console.log(thrownError);
	  }
	  
	});
}