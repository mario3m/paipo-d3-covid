// Vinculamos al elemento del HTML
var container = d3.select("#areaChart")

// Definimos las dimensiones
var margin = {top: 10, right: 80, bottom: 0, left: 80};
var width = +container.attr("width") - margin.left - margin.right;
var height = +container.attr("height") - margin.top - margin.bottom;

// Creamos el SVG (responsivo)
var svg = container
.append("svg")
.attr("preserveAspectRatio", "xMinYMin meet")
.attr("viewBox", "0 0 960 470")
.append("g")
.attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");

// Cogemos los datos del CSV
var data = [];
d3.csv("spain_vaccinations.csv", function(d) {

  for(var i=0; i<d.length; i++){
    data[i] = {};
    if(!d[i].people_vaccinated_per_hundred && !d[i].people_fully_vaccinated_per_hundred && i!=0){
      data[i].people_vaccinated_per_hundred = data[i-1].people_vaccinated_per_hundred
      data[i].people_fully_vaccinated_per_hundred = data[i-1].people_fully_vaccinated_per_hundred
    }
    else{
      data[i].people_vaccinated_per_hundred = d[i].people_vaccinated_per_hundred
      data[i].people_fully_vaccinated_per_hundred = d[i].people_fully_vaccinated_per_hundred 
    }
    data[i].date = new Date(d[i].date)
  }

// Lista de grupos que seran areas
var keys = ["people_fully_vaccinated_per_hundred", "people_vaccinated_per_hundred"]

// Paleta de colores
var color = d3.scaleOrdinal()
.domain(keys)
.range(d3.schemeSet2);

// Stackeamos los datos para poder usar el area chart
var stackedData = d3.stack()
.keys(keys)
(data)


// Definimos los ejes
var x = d3.scaleLinear()
.domain(d3.extent(data, function(d) { return d.date; }))
.range([ 0, width ]);
var xAxis = svg.append("g")
.attr("transform", "translate(0," + height + ")")
.call(d3.axisBottom(x).ticks(5).tickFormat(function(d) {return getDateString(d); }))

svg.append("text")             
.attr("transform",
  "translate(" + (width/2) + " ," + 
  (height + margin.top +margin.bottom - 10) + ")")
.style("text-anchor", "middle")
.text("Fecha").style("fill", "#606060");   

svg.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 0 - margin.left)
.attr("x",0 - (height / 2))
.attr("dy", "1em")
.style("text-anchor", "middle")
.text("Porcentaje de personas").style("fill", "#606060");   

var y = d3.scaleLinear()
.domain([0, 100])
.range([ height, 0 ]);
svg.append("g")
.call(d3.axisLeft(y).ticks(5));


// Función para transformar Dates a String yyyy-mm-dd
function getDateString(date) {
  var d = new Date(date),
  month = '' + (d.getMonth() + 1),
  day = '' + d.getDate(),
  year = d.getFullYear();

  if (month.length < 2) 
    month = '0' + month;
  if (day.length < 2) 
    day = '0' + day;

  return [year, month, day].join('-');
}

// Definimos el are de dibujo
var clip = svg.append("defs").append("svg:clipPath")
.attr("id", "clip")
.append("svg:rect")
.attr("width", width )
.attr("height", height )
.attr("x", 0)
.attr("y", 0);


// Definimos las función de arrastre
var brush = d3.brushX()
.extent( [ [0,0], [width,height] ] ) 
.on("end", updateChart)

var areaChart = svg.append('g')
.attr("clip-path", "url(#clip)")

// Pintamos
var area = d3.area()
.x(function(d) { return x(d.data.date); })
.y0(function(d) { return y(d[0]); })
.y1(function(d) { return y(d[1]); })

areaChart
.selectAll("mylayers")
.data(stackedData)
.enter()
.append("path")
.attr("class", function(d) { return "myArea " + d.key })
.style("fill", function(d) { return color(d.key); })
.attr("d", area)

areaChart
.append("g")
.attr("class", "brush")
.call(brush);

var idleTimeout
function idled() { idleTimeout = null; }

  // Actualizamos el grafico
  function updateChart() {

    extent = d3.event.selection

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if(!extent){
      if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
      x.domain(d3.extent(data, function(d) { return d.date; }))
    }else{
      x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
      areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and area position
    xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5).tickFormat(function(d) {return getDateString(d); }))
    areaChart
    .selectAll("path")
    .transition().duration(1000)
    .attr("d", area)
  }


    // Definimos lo que ocurre cuando se pasa el raton por una leyenda
    var highlight = function(d){
      d3.selectAll(".myArea").style("opacity", .1)
      d3.select("."+d).style("opacity", 1)
    }

    var noHighlight = function(d){
      d3.selectAll(".myArea").style("opacity", 1)
    }


// Definimos las leyendas
var size = 20
svg.selectAll("myrect")
.data(keys)
.enter()
.append("rect")
.attr("x", 400)
.attr("y", function(d,i){ return 10 + i*(size+5)})
.attr("width", size)
.attr("height", size)
.style("fill", function(d){ return color(d)})
.on("mouseover", highlight)
.on("mouseleave", noHighlight)


var keysText = {people_fully_vaccinated_per_hundred: "Personas totalmente inmunizadas",
people_vaccinated_per_hundred: "Personas que han recibido al menos una dosis"};

svg.selectAll("mylabels")
.data(keys)
.enter()
.append("text")
.attr("x", 20 + size*1.2)
.attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) 
.style("fill", function(d){ return color(d)})
.text(function(d){ return keysText[d]})
.attr("text-anchor", "left")
.style("alignment-baseline", "middle")
.on("mouseover", highlight)
.on("mouseleave", noHighlight)

})
