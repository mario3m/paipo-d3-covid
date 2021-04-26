// Vinculamos al elemento del HTML
var container = d3.select('div#barChart');

// Definimos las dimensiones
var margin = {top: 10, right: 40, bottom: 60, left: 80};
var width = +container.attr("width") - margin.left - margin.right;
var height = +container.attr("height") - margin.top - margin.bottom;


// Creamos el SVG (responsivo)
var chart = container.append('svg')
.attr("preserveAspectRatio", "xMinYMin meet")
.attr("viewBox", "0 0 960 500")
.append('g')
.classed('chart', true)
.classed("svg-content-responsive", true)
.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

chart.append('g')
.classed('x axis', true)
.attr('transform', 'translate(' + '0' + ',' + height + ')');

chart.append('g')
.classed('y axis', true)
.attr('transform', 'translate(0,0)');

var dataSeries = chart.append('g')
.classed('data-series', true);


container.select('svg')
.append("rect")
.classed("drag-and-zoom-area", true)
.attr("width", width)
.attr("height", height)
.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
.style("fill", "none")
.style("cursor", "move")
.style("pointer-events", "all");

// Hacemos que se pueda navegar arrastrando
container.select('.drag-and-zoom-area')
.call(d3.drag()
  .on("start", handleDragStarted)
  .on("drag", handleDragging)
  );

// Hacemos que se pueda utilizar el zoom
container.select('.drag-and-zoom-area')
.on("wheel", handleWheel);


var data = [];
var viewport;

// Declaramos los ejes
var x = d3.scaleBand()
.range([0, width])
.padding(.02);

var xAxis = d3.axisBottom(x);

var y = d3.scaleLinear()
.range([height, 0]).nice();

var yAxis = d3.axisLeft(y)
.tickFormat(d3.format('d'));


// Cogemos los datos del CSV
d3.csv("spain_vaccinations.csv", function(d) {
  for (var i = 1; i < d.length; i++) {
    a = parseFloat(d[i].daily_vaccinations);
    a = a || 0;
    var dayDate = {key: d[i].date, value: a};
    data[i-1] = dayDate;
  }


  viewport = {
    center: data.length / 2,
    size: data.length
  };

  chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Número de vacunas suminsitradas").style("fill", "#606060");      
chart.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height + margin.top +margin.bottom + 25) + ")")
      .style("text-anchor", "middle")
      .text("Fecha").style("fill", "#606060");   

  drawChart({
    viewport: viewport
  });

});


// Función de dibujar la gráfica
function drawChart(params) {

  var begin = Math.max(0, params.viewport.center - params.viewport.size / 2);
  var end = Math.min(data.length, begin + params.viewport.size);
  var slice = data.slice(begin, end);

  x.domain(slice.map(function(d) {
    return d.key;
  }));
  chart.select('.x.axis')
  .call(xAxis)
  .selectAll("text")
  .classed("x-axis-label", true)
  .style("text-anchor", "end")
  .attr("dx", -8)
  .attr("dy", "-.5em")
  .attr("transform", "translate(0,0) rotate(-90)")
  

  y.domain([0, d3.max(slice.map(function(d) {
    return 1e5*Math.ceil(d.value/1e5);
  }))]);

  chart.select('.y.axis').call(yAxis)
  

    // draw data series
    dataSeries.selectAll('.bar')
    .data(slice)
    .enter()
    .append('rect')
    .classed('bar', true);

    dataSeries.selectAll('.bar')
    .attr('x', function(d) {
      return x(d.key);
    })
    .attr('y', function(d) {
      return y(d.value);
    })
    .attr('width', function(d) {
      return x.bandwidth();
    })
    .attr('height', function(d) {
      return height - y(d.value);
    })
    .style('fill', 'steelblue');

    dataSeries.selectAll('.bar')
    .data(slice)
    .exit()
    .remove();
  }


// Manejadora rueda-zoom
function handleWheel() {

  var zoomFactor = 1.25;
  
  if (d3.event.deltaY > 0) {
    viewport.size = Math.min(
      data.length,
      viewport.size * zoomFactor
      );
  } else if (d3.event.deltaY < 0) {
    viewport.size = Math.round(
      Math.max(
        1,
        viewport.size / zoomFactor
        ));
  }

  drawChart({
    viewport: viewport
  });

  d3.event.preventDefault();
}


// Manejadora arrastre-paneo
var lastDragX;
function handleDragStarted() { lastDragX = d3.event.x; }

function handleDragging() {
  var deltaPos = lastDragX - d3.event.x;
  lastDragX = d3.event.x;

  if (deltaPos > 0) {
    viewport.center = Math.min(
      data.length - viewport.size / 2,
      viewport.center + Math.ceil(0.05 * viewport.size)
      );
  } else if (deltaPos < 0) {
    viewport.center = Math.max(
      viewport.size / 2,
      viewport.center - Math.ceil(0.05 * viewport.size)
      );
  }

  drawChart({
    viewport: viewport
  });

}
