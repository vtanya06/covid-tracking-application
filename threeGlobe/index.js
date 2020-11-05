function _convertLatLonToVec3(lat, lon) {
  lat = lat * Math.PI / 180.0;
  lon = -lon * Math.PI / 180.0;
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.sin(lon));
}

function InfoBox(city, radius, domElement) {
  this._screenVector = new THREE.Vector3(0, 0, 0);

  this.position = _convertLatLonToVec3(city.lat, city.lng).multiplyScalar(radius);

  // create html overlay box
  this.box = document.createElement('div');
  this.box.innerHTML = city.name;
  this.box.className = "hudLabel";

  this.domElement = domElement;
  this.domElement.appendChild(this.box);

}

InfoBox.prototype.update = function() {
  this._screenVector.copy(this.position);
  this._screenVector.project(camera);

  var posx = Math.round((this._screenVector.x + 1) * this.domElement.offsetWidth / 2);
  var posy = Math.round((1 - this._screenVector.y) * this.domElement.offsetHeight / 2);

  var boundingRect = this.box.getBoundingClientRect();

  // update the box overlays position
  this.box.style.left = (posx - boundingRect.width) + 'px';
  this.box.style.top = posy + 'px';
};

//--------------------------------
function Marker() {
  THREE.Object3D.call(this);

  var radius = 0.005;
  var sphereRadius = 0.02;
  var height = 0.05;

  var material = new THREE.MeshPhongMaterial({
    color: 0xDC143C
  });

  var cone = new THREE.Mesh(new THREE.ConeBufferGeometry(radius, height, 8, 1, true), material);
  cone.position.y = height * 0.5;
  cone.rotation.x = Math.PI;

  var sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(sphereRadius, 16, 8), material);
  sphere.position.y = height * 0.95 + sphereRadius;


  this.add(cone, sphere);
}

Marker.prototype = Object.create(THREE.Object3D.prototype);

// ------ Earth object -------------------------------------------------

function Earth(radius, texture) {
  THREE.Object3D.call(this);
  THREE.ImageUtils.crossOrigin = '';
   var texture = THREE.ImageUtils.loadTexture('https://threejsfundamentals.org/threejs/resources/data/world/country-index-texture.png')
  this.userData.radius = radius;
  var earth = new THREE.Mesh(
    new THREE.SphereBufferGeometry(radius, 64.0, 48.0),
    new THREE.MeshPhongMaterial({
      map: texture
    })
  );

  this.add(earth);
}
var markerarry= [];
Earth.prototype = Object.create(THREE.Object3D.prototype);

Earth.prototype.createMarker = function(lat, lon) {
  var marker = new Marker();

  var latRad = lat * (Math.PI / 180);
  var lonRad = -lon * (Math.PI / 180);
  var r = this.userData.radius;

  marker.position.set(Math.cos(latRad) * Math.cos(lonRad) * r, Math.sin(latRad) * r, Math.cos(latRad) * Math.sin(lonRad) * r);
  marker.rotation.set(0.0, -lonRad, latRad - Math.PI * 0.5);

  this.add(marker);
};

// ------ Three.js code ------------------------------------------------

var scene, camera, renderer, label;
var controls;

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 100);
  camera.position.set(0.0, 1.5, 3.0);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = -1.0;
  controls.enablePan = false;

  var ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  var direcitonal = new THREE.DirectionalLight(0xffffff, 0.5);
  direcitonal.position.set(5.0, 2.0, 5.0).normalize();
  scene.add(direcitonal);

  // just some code for the loading
  //var manager = THREE.LoadingManager();

  //var texLoader = new THREE.TextureLoader(manager).setCrossOrigin(true);

  //var texture = texLoader.load('https://s3-eu-west-2.amazonaws.com/bckld/lab/textures/earth_latlon.jpg');
  //texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  var earth = new Earth(1.0/*, texture*/);

  // earth.createMarker(48.856700, 2.350800); // Paris
  // earth.createMarker(51.507222, -0.1275); // London
  // earth.createMarker(34.050000, -118.250000); // LA
  // earth.createMarker(41.836944, -87.684722); // Chicago
  // earth.createMarker(35.683333, 139.683333); // Tokyo
  // earth.createMarker(33.333333, 44.383333); // Baghdad
  // earth.createMarker(40.712700, -74.005900); // New York

  // earth.createMarker(55.750000, 37.616667); // Moscow
  // earth.createMarker(35.117500, -89.971111); // Memphis
  // earth.createMarker(-33.925278, 18.423889); // Cape Town
  // earth.createMarker(32.775833, -96.796667); // Dallas
  // earth.createMarker(52.366667, 4.900000); // Amsterdam
  // earth.createMarker(42.358056, -71.063611); // Boston
  // earth.createMarker(52.507222, 13.145833); // Berlin

  // earth.createMarker(37.783333, -122.416667); // San Francisco

  scene.add(earth);

  //-------------
  // globe

  var radius1 = 1;

  //----------------
window.onpointerdown = function( event ) 
{
  // the following line would stop any other event handler from firing
  // (such as the mouse's TrackballControls)
  // event.preventDefault();
  
  const rect = renderer.domElement.getBoundingClientRect();
  const left = event.clientX - rect.left;
  const top = event.clientY - rect.top;

  const x = (left / rect.width) * 2 - 1;
  const y = - (top / rect.height) * 2 + 1;
  
  const raycaster = new THREE.Raycaster();
  raycaster.ray.origin.setFromMatrixPosition(camera.matrixWorld);
  raycaster.ray.direction.set(x, y, 0.5).unproject(camera).sub(raycaster.ray.origin).normalize();
  
  const intersects = raycaster.intersectObjects(markerarry, true);
  console.log(intersects);
  document.getElementById("countryInfo").innerHTML = "Country: " + intersects[0].object.parent.userData.countryname
  document.getElementById("confirmed").innerHTML = "Confirmed: " + intersects[0].object.parent.userData.confirmed
  document.getElementById("death").innerHTML = "Death: " + intersects[0].object.parent.userData.death
  document.getElementById("recovered").innerHTML = "Recovered: " + intersects[0].object.parent.userData.recovered
  document.getElementById("updatedAt").innerHTML = "Updated At: " + intersects[0].object.parent.userData.updated

}
  //-----------------------

  window.addEventListener('resize', onResize);
  onResize();

  document.body.appendChild(renderer.domElement);

animate();

}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  //  label.update();

  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}


var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      populateCountries(JSON.parse(xhr.responseText));
    }
};
xhr.open('GET', 'https://corona-api.com/countries', true);
xhr.send(null);


function populateCountries(data) {
  for (let country of data.data) {
    var aCountry = {
      name: country.name,
      lat: country.coordinates.latitude,
      lng: country.coordinates.longitude,
    };
  
    var label = new InfoBox(aCountry, 1, document.body);
    var material1 = new THREE.MeshPhongMaterial({
      color: 0xDC143C
    });
//    let marker = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), material1);
var marker = new Marker();
marker.userData = {
  countryname: country.name,
  confirmed: country.latest_data.confirmed,
  death: country.latest_data.deaths,
  recovered: country.latest_data.recovered,
  updated: country.updated_at
};


    marker.position.copy(label.position);
    scene.add(marker);
    markerarry.push(marker)
  }
}

let textureLoader = new THREE.TextureLoader();

let galaxyGeometry = new THREE.SphereGeometry(100, 32, 32);
let galaxyMaterial = new THREE.MeshBasicMaterial({
  side: THREE.BackSide
});
let galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);

// Load Galaxy Textures
textureLoader.crossOrigin = true;
textureLoader.load(
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/starfield.png',
  function(texture) {
    galaxyMaterial.map = texture;
    scene.add(galaxy);
  }
);

