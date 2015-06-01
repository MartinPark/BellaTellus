//// SVG AND D3 STUFF

var margin = {top: 200, right: 0, bottom: 0, left: 200};

var width = 1200,
    height = 1200;

var svg = d3.select("#chart").append("svg")
  .attr("width", width)
  .attr("height", height)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var projection = d3.geo.mercator()
  .center([128.0, 35.9])
  .rotate([0, 1])
//  .parallels([40, 40])
  .scale(50000)
  .translate([250, 250]);

var path = d3.geo.path()
  .projection(projection);

// var colourScale = d3.scale.linear()
//   .domain([-30, -20, -16, -10, 0, 10, 12, 16, 18, 22, 28, 36])
//   .range(['#FFFFFF', '#828282', '#5D1879', '#00197C', '#00FFFF', '#00C44E', '#00FA57', '#FFFA56', '#F1E98D', '#E5AB58', '#FF0000', '#810000']);

var lines = [];

////ANIMATED FUNCTIONS
function lineAnimate(selection) {
  selection
  .attr({
    x2: function(d) {return d.x0},
    y2: function(d) {return d.y0}
  })
  .style('opacity', 0)
  .transition()
    .ease('linear')
    .duration(function(d) {return d.duration;})
    .delay(function(d) {return d.delay;})
    .attr({
      x2: function(d) {return d.x1},
      y2: function(d) {return d.y1}
    })
    .style('opacity', 0.8)
  .transition()
    .duration(1000)
    .style('opacity', 0.1)
  .each('end', function() {d3.select(this).call(lineAnimate)});
}


//// MATH FUNCTIONS
function toRad(deg) {return deg * Math.PI / 180;}

function toDeg(rad) {return rad * 180 / Math.PI;}

function lonLatFromLonLatDistanceAndBearing(lonLat, d, brng) {
  // Formulae from http://www.movable-type.co.uk/scripts/latlong.html
  // brg in radians, d in km
  var R = 6371; // Earth's radius in km
  var lon1 = toRad(lonLat[0]), lat1 = toRad(lonLat[1]);
  var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng) );
  var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1), Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));
  return [toDeg(lon2), toDeg(lat2)];
}


//// INITIALISATION
var cardinalToBearing = {};

function init() {
//  var i, cardinalPoints = ['S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE'];

  // Calculate cardinal point to bearing mapping (wind direction is where the wind is coming *from*!)
//  for(i = 0; i < cardinalPoints.length; i++)
//    cardinalToBearing[cardinalPoints[i]] = i * Math.PI / 8;

  // Prepare line co-ordinates
  var windData = weather.SiteRep.DV.Location;
  for(var i = 0; i < windData.length; i++) {
    var d = windData[i];
    var speed = d.Period.Rep.S;
    var direction = d.Period.Rep.D;
//    var feelsLikeTemperature = d.Period.Rep.F;
    var lonLat0 = [d.lon, d.lat];

    // Scale line length proportionally to speed
    var lonLat1 = lonLatFromLonLatDistanceAndBearing(lonLat0, 5 * speed, direction);

    var x0y0 = projection(lonLat0);
    var x1y1 = projection(lonLat1);
    var line = {
      x0: x0y0[0],
      y0: x0y0[1],
      x1: x1y1[0],
      y1: x1y1[1],
      s: speed,
      // f: feelsLikeTemperature,
      duration: 8000 / speed, /* pre-compute duration */
      delay: Math.random() * 1000 /* pre-compute delay */
    };
    // console.log(line);
    lines.push(line);
  }
}

//// The app
d3.json("data/skorea-provinces-topo.json", function(error, kor) {
  // UK map drawing courtesy of http://bost.ocks.org/mike/map/
  var subunits = topojson.object(kor, kor.objects['skorea-provinces-geo']);
  svg.append("path")
    .datum(subunits)
    .attr("class", "subunits")
    .attr("d", path);
  
/*  svg.selectAll("text")
  .data(subunits.geometries)
  .enter().append("text")
  .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
  .attr("dy", ".35em")
  .text(function(d) { return d.properties.NAME_1; });*/

  // Draw the lines
  svg.selectAll('line')
    .data(lines)
    .enter()
    .append("line")
    .attr({
      x1: function(d) {return d.x0}, 
      y1: function(d) {return d.y0}
    })
    // .style('stroke', function(d) {return colourScale(d.f);})
    .call(lineAnimate);
});

init();
