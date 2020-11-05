/** 3D Globe With Country Hover */

// Wait for 3000 miliseconds before auto-rotating
var rotDelayTime = 3000
// Globe scale
var globeScaleFactor = 0.9
// Autorotation speed of globe per second
var degreePerSecond = 6
// Starting position of angle
var angles = { x: -20, y: 40, z: 0}
// Globe colors of different parts
var WaterColor = '#7CBAF5'
var landColor = '#0F540B'
var graticuleColor = '#ccc'
var countryColor = '#696969'

var infoArr = ["", "", "","",""];

// Functionality for data representation of Globe
function enter(country) {
  // Get country hovered by user
  var country = countryList.find(function(c) {
    var text = countryMap.get(country.id);
    // Handle info text
    if(text && text.includes("_")){
      // Get the hovered country information from map
      infoArr = countryMap.get(country.id).split("_");
      console.log("hii"+infoArr.length)
    } else {
      infoArr = ["", "", "","",""];
    }
    if(infoArr.length == 5){
      // Bind country information text
      countryInfo.text(infoArr[0]);
      confirmed.text(infoArr[1]);
      death.text(infoArr[2]);
      recovered.text(infoArr[3]);
      updatedAt.text(infoArr[4]);
    }
    return c.id === country.id
  })
  currentCountryName.text(country && country.name || '')
}

function leaveGlobe(country) {
  currentCountryName.text('');
  countryInfo.text('');
  confirmed.text('');
  death.text('');
  recovered.text('');
  updatedAt.text('');
}

// Use select method from D3 library to get HTML element
var currentCountryName = d3.select('#currentCountryName')
var countryInfo = d3.select('#countryInfo')
var confirmed = d3.select('#confirmed').style("color", "blue")
//var population = d3.select('#population')
var death = d3.select('#death')
var recovered = d3.select('#recovered')
var updatedAt = d3.select('#updatedAt')
var canvas = d3.select('#globe')

// Use graphic related methods from D3 library
var context = canvas.node().getContext('2d')
var waterOnGlobe = {type: 'Sphere'}
var globeProjection = d3.geoOrthographic().precision(0.1)
var graticuleOnGlobe = d3.geoGraticule10()
var globalPath = d3.geoPath(globeProjection).context(context)
var p0 // Starting mouse position in Cartesian coordinates before dragging.
var r0 // Start of projection rotation as Euler angles.
var q0 // Starting projection rotation as versor.
var endOfTime = d3.now()
var degreePerMillisecond = degreePerSecond / 1000
var width, height
var land, countries
var countryList
var autorotate, now, diff, roation
var currentCountry

// Handling globe functionality 
// setting angle of globe
function setAngles() {
  var rotation = globeProjection.rotate()
  rotation[0] = angles.y
  rotation[1] = angles.x
  rotation[2] = angles.z
  globeProjection.rotate(rotation)
}
// Scalling globe
function scale() {
  width = document.documentElement.clientWidth
  height = document.documentElement.clientHeight
  canvas.attr('width', width).attr('height', height)
  globeProjection
    .scale((globeScaleFactor * Math.min(width, height)) / 2)
    .translate([width / 2, height / 2])
  render()
}

// Start globe rotation
function startRotation(delay) {
  autorotate.restart(rotate, delay || 0)
}

// Stop globe rotation
function stopRotation() {
  autorotate.stop()
}

// Start dragging globe
function dragstarted() {
  p0 = versor.cartesian(globeProjection.invert(d3.mouse(this)))
  r0 = globeProjection.rotate()
  q0 = versor(r0)
  stopRotation()
}

// Dragging of globe
function dragged() {
  var v1 = versor.cartesian(globeProjection.rotate(r0).invert(d3.mouse(this)))
  var q1 = versor.multiply(q0, versor.delta(p0, v1))
  var r1 = versor.rotation(q1)
  globeProjection.rotate(r1)
  render()
}

function dragended() {
  startRotation(rotDelayTime)
}

// Globe rendering
function render() {
  context.clearRect(0, 0, width, height)
  fill(waterOnGlobe, WaterColor)
  stroke(graticuleOnGlobe, graticuleColor)
  fill(land, landColor)
  if (currentCountry) {
    fill(currentCountry, countryColor)
  }
}

// Globe filling with colors
function fill(obj, color) {
  context.beginPath()
  globalPath(obj)
  context.fillStyle = color
  context.fill()
}

//Pointing out location on globe
function stroke(obj, color) {
  context.beginPath()
  globalPath(obj)
  context.strokeStyle = color
  context.stroke()
}
// Rotation of globe
function rotate(elapsed) {
  now = d3.now()
  diff = now - endOfTime
  if (diff < elapsed) {
    rotation = globeProjection.rotate()
    rotation[0] += diff * degreePerMillisecond
    globeProjection.rotate(rotation)
    render()
  }
  endOfTime = now
}

// Loading all data of counties in the world on globe
function loadData(cb) {
  // Loded Json file with location co ordinates of country areas with respective country code
  d3.json('https://unpkg.com/world-atlas@1/world/110m.json', function(error, world) {
    if (error) throw error
    // Loded .tsv file which contations all countries with respective to country their codes
    d3.tsv('https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/world-country-names.tsv', function(error, countries) {
      if (error) throw error
      cb(world, countries)
    })
  })
}

// Handling polygones
function polygonContains(polygon, point) {
  var n = polygon.length
  var p = polygon[n - 1]
  var x = point[0], y = point[1]
  var x0 = p[0], y0 = p[1]
  var x1, y1
  var inside = false
  for (var i = 0; i < n; ++i) {
    p = polygon[i], x1 = p[0], y1 = p[1]
    if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) inside = !inside
    x0 = x1, y0 = y1
  }
  return inside
}

// Mouse movement on globe
function mousemove() {
  var c = getCountry(this)
  if (!c) {
    if (currentCountry) {
      leaveGlobe(currentCountry)
      currentCountry = undefined
      render()
    }
    return
  }
  if (c === currentCountry) {
    return
  }
  currentCountry = c
  render()
  enter(c)
}

// Country reflection by mouse event on globe
function getCountry(event) {
  var pos = globeProjection.invert(d3.mouse(event))
  return countries.features.find(function(f) {
    return f.geometry.coordinates.find(function(c1) {
      return polygonContains(c1, pos) || c1.find(function(c2) {
        return polygonContains(c2, pos)
      })
    })
  })
}

setAngles()
canvas
  .call(d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended)
   )
  .on('mousemove', mousemove)
  
// Loading country data on globe
loadData(function(world, cList) {
  land = topojson.feature(world, world.objects.land)
  countries = topojson.feature(world, world.objects.countries)
  countryList = cList
  
  window.addEventListener('resize', scale)
  scale()
  autorotate = d3.timer(rotate)
})