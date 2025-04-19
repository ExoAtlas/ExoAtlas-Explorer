import * as THREE from "three";
import { CatmullRomCurve3 } from 'three'; //improve orbit trail performance & interpolation
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.2/index.js"; //cinematic zooms
import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'jsm/postprocessing/UnrealBloomPass.js';
import { createPlanet, createOrbitPath } from "./src/celestial.js";
import { calculateStateVector } from './src/exoastro.js';
import { calculateOrbitalPeriod } from "./src/exoastro.js";
import { createOrbitTrailSegment } from './src/orbittrailsegment.js';
import { ΔJ2000 } from './src/j2000calc.js';
import { CSS2DRenderer, CSS2DObject } from "jsm/renderers/CSS2DRenderer.js";
import { planetsData } from "./src/planetdata.js";
import { cometData } from "./src/cometData.js";
import { moonData } from "./src/moonData.js";
import { exoplanetData } from "./src/exoplanetData.js";

//Constants
const GRAVITATIONAL_PARAMETER = 1.32712440018e11;

function toDegrees(rad) {
  return rad * 180 / Math.PI;
}


function gregorianToJulian(date) {
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1;
  const D = date.getUTCDate();
  const H = date.getUTCHours();
  const Min = date.getUTCMinutes();
  const S = date.getUTCSeconds();

  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5 +
         (H + Min / 60 + S / 3600) / 24;
}

function buildTableDataFromSources(jd) {
  let index = 1;
  const mapObject = (obj, category) => {
    return {
      objnum: obj.ID || index++,
      planetname: obj.name,
      category: category,
      viewobject: '',
      vieworbit: ''
    };
  };

  return [
    ...planetsData.map(obj => mapObject(obj, "Planet")),
    ...cometData.map(obj => mapObject(obj, "Comet")),
        ...moonData.map(obj => mapObject(obj, "Moon")),
    ...exoplanetData.map(obj => mapObject(obj, "Exoplanet"))
  ];
}

$(document).ready(function () {
  const tableData = buildTableDataFromSources(gregorianToJulian(new Date()));

  const table = $('#satelliteTable').DataTable({
    data: tableData,
    columns: [
      { data: "objnum", width: "15%"},
      { data: "planetname", width: "55%"},
      {
        data: "viewobject",
        title: "View Object",
        render: () => '<input type="checkbox" class="view-object-toggle" />',
        orderDataType: 'checkbox-order',
        orderable: true,
        width: "15%",
        className: "text-center",
      }
    ],
    autoWidth: false,
    paging: true,
    lengthChange: true, 
    info: true,
    searching: true,
    ordering: true,
    responsive: true,

    initComplete: function () {
      // Ensure all controls are moved to correct wrappers
      const $wrapper = $('#satelliteTable').closest('.dataTables_wrapper');
      const $length = $wrapper.find('.dataTables_length');
      const $filter = $wrapper.find('.dataTables_filter');

      // Move them to the right divs
      $length.appendTo('.datatable-header');
      $filter.appendTo('.datatable-header');

      //Create a row container for inline alignment
      const $controls = $('<div class="datatable-controls-row"></div>');
      $controls.append($length).append($filter);
      $('.datatable-header').append($controls);
    
      // Optional: style polish
      $filter.find('input[type="search"]').attr('placeholder', 'Search objects...');
    }
  });

  // Category filter by tab
  $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
    const selected = $('.tab-button.active').data('filter');
    const category = tableData[dataIndex].category;
    return selected === "All" || category === selected;
  });

  //Checkbox filtering
  $.fn.dataTable.ext.order['checkbox-order'] = function(settings, col) {
    return this.api().column(col, {order: 'index'}).nodes().map(function(td) {
      return $('input[type="checkbox"]', td).prop('checked') ? 1 : 0;
    });
  };

  $('.tab-button').on('click', function () {
    $('.tab-button').removeClass('active');
    $(this).addClass('active');
    table.draw();
  });
  
  Object.keys(planetMeshes).forEach(name => {
    planetMeshes[name].visible = true;
    planetLabels[name].visible = true;
    if (orbitLines[name]) orbitLines[name].visible = true;
  });
});



















// Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 17951744.484);
camera.position.y = 696.340 * 200;
camera.position.z = 696.340 * 500;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
renderer.setClearColor(0x000000, 0.0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 7.000;
controls.maxDistance = 17951744.484;
const loader = new THREE.TextureLoader();
let trackedPlanetData = null;
let trackedPlanetLastPosition = null;


// CSS3DRenderer for labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // Ensure it doesn't block mouse events
labelRenderer.domElement.style.zIndex = '0';
document.body.appendChild(labelRenderer.domElement);



//bloom renderer
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 2; //intensity of glow
bloomPass.radius = 0;
const bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.renderToScreen = true;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);




//Sun
const suncolor = new THREE.Color("#FDB813");
const SunGeometry = new THREE.IcosahedronGeometry(696.340, 15);
const SunMaterial = new THREE.MeshBasicMaterial({ color: suncolor });
const sun = new THREE.Mesh(SunGeometry, SunMaterial);
sun.position.set(0, 0, 0);
sun.layers.set(1);
scene.add(sun);


// Starry Background
const starGeometry = new THREE.SphereGeometry(17951744484, 720, 360);
const starMaterial = new THREE.MeshBasicMaterial({
    map: loader.load("./textures/deepstar/starmap_16k.jpg"),
    side: THREE.BackSide,
    transparent: true,
    color: 0x444444, 
});
const starMesh = new THREE.Mesh(starGeometry, starMaterial);
starMesh.layers.set(1);
scene.add(starMesh);




// Create Planets and Orbits
const planetMeshes = {}; //store planet meshes for raycasting
const planetLabels = {};

const objectMeshes = {};      // key = name, value = mesh
const objectLabels = {};      // key = name, value = label
// Store planet labels
const orbitLines = {};  // key = name, value = THREE.Line
const planetTrailPoints = []; // Array for planets
const cometTrailPoints = {}; // key = name, value = trail points array
const trailPercentage = 0.3; // ⬅ increased to 30% on-demand

planetsData.forEach((planetData, index) => {
  // Create the planet mesh.
  const planet = createPlanet({ ...planetData, scene, loader });
  planetMeshes[planetData.name] = planet;

  // Create a label element.
  const labelDiv = document.createElement('div');
  labelDiv.className = 'label';
  labelDiv.textContent = planetData.name;
  labelDiv.style.marginTop = '-1.5em';
  labelDiv.style.font = 'Bold 40px Arial';
  labelDiv.style.fontSize = '20px';
  labelDiv.style.padding = '3px';
  labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  labelDiv.style.color = 'white';
  labelDiv.style.display = 'block';

  // Create the CSS2DObject for the label.
  const label = new CSS2DObject(labelDiv);
  planet.add(label);
  label.position.set(0, planetData.radius * 1.01, 0);
  planetLabels[planetData.name] = label;

  // Create the orbit path.
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });
  const orbitLine = new THREE.Line(geometry, material);
  scene.add(orbitLine);
  orbitLines[planetData.name] = orbitLine;

  //Initialize trail buffer
  planetTrailPoints.push([]);
  orbitLine.visible = true;

  //Generate 30% orbit trail and render it
  const currentTime = new Date();
  generateInitialOrbitTrail(planetData, planetTrailPoints[index], currentTime);
  updateOrbitPath(orbitLine, planetTrailPoints[index], planet.position, planetData, currentTime);
});


// Removed duplicate planet creation block);


// DataTable Checkbox Hook - View Object
$(document).on("change", ".view-object-toggle", function () {
  const row = $(this).closest("tr");
  const rowData = $('#satelliteTable').DataTable().row(row).data();
  const name = rowData.planetname;
  const checked = $(this).is(":checked");

  if (planetMeshes[name]) {
    planetMeshes[name].visible = checked;
    if (planetLabels[name]) planetLabels[name].visible = checked;
  }

  if (objectMeshes[name]) {
    objectMeshes[name].visible = checked;
    if (objectLabels[name]) objectLabels[name].visible = checked;
  }

  if (planetLabels[name]) {
    planetLabels[name].visible = checked;
  }

  const isComet = cometData.some(obj => obj.name === name);

  // Avoid double-initializing orbits
  if (checked && isComet && !objectMeshes[name]) {
    const obj = cometData.find(o => o.name === name);
    if (!obj || !obj.keplerianElements) return;

    const currentDate = new Date();
    const initialState = calculateStateVector(
      obj.keplerianElements.a, obj.keplerianElements.e, obj.keplerianElements.i,
      obj.keplerianElements.Ω, obj.keplerianElements.ω, obj.keplerianElements.M0,
      obj.keplerianElements.t0, currentDate
    );

    const mesh = createPlanet({
      name: obj.name,
      radius: obj.radius,
      texture: obj.texture || './textures/default.jpg',
      position: [initialState.position.x, initialState.position.y, initialState.position.z],
      scene, loader
    });
    mesh.visible = checked;
    objectMeshes[obj.name] = mesh;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = obj.name;
    labelDiv.style.marginTop = '-1.5em';
    labelDiv.style.font = 'Bold 20px Arial';
    labelDiv.style.padding = '3px';
    labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    labelDiv.style.color = 'white';
    const label = new CSS2DObject(labelDiv);
    mesh.add(label);
    label.position.set(0, obj.radius * 1.05, 0);
    label.visible = checked;
    objectLabels[obj.name] = label;

    // Create orbit line if not already created
    if (!orbitLines[obj.name]) {
      const orbitLine = createOrbitTrailSegment(obj.keplerianElements, trailPercentage, new Date(), scene);
      orbitLines[obj.name] = orbitLine;
      orbitLine.visible = checked;
    }
  }

  if (orbitLines[name]) {
    orbitLines[name].visible = checked;
  }
});

$('#satelliteTable').on('draw.dt', function () {
  const table = $('#satelliteTable').DataTable();
  table.rows().every(function () {
    const data = this.data();
    if (planetMeshes[data.planetname]) {
      const row = $(this.node());
      row.find(".view-object-toggle").prop("checked", true).trigger("change");
      row.find(".view-orbit-toggle").prop("checked", true).trigger("change");
    }
  });
});




// Remove or reduce the intensity of the current point light if needed.
// (Optionally, you could keep a weaker point light at the sun for near-field effects.)
 const pointLight = new THREE.PointLight(0xfdfbd3, 100000000000 * 0.3, 17951744484);
 pointLight.castShadow = true;
 pointLight.shadowBias = 0.00001;
 pointLight.shadowMapWidth = 2048;
 pointLight.shadowMapHeight = 2048;
 pointLight.position.set(0, 0, 0);
 scene.add(pointLight);

// Add a directional light to simulate sunlight that doesn't decay over distance.
const directionalLight = new THREE.DirectionalLight(0xfdfbd3, 1.0);
// Position the directional light at the sun's location.
directionalLight.position.set(0, 0, 0);
// Point the light toward the scene center (or adjust as needed to highlight the terminator effect).
directionalLight.target.position.set(100, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

// Add a HemisphereLight for soft ambient fill.
// The sky color (first argument) and ground color (second argument) can be adjusted
// to create a natural gradient that helps blend the day/night regions.
const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x444422, 0.1);
hemiLight.position.set(0, 1, 0);
scene.add(hemiLight);





//DATE AND TIME FOR GUI
const timeParams = {
  currentDate: new Date().toISOString().slice(0, 10),
  currentTime: new Date().toISOString().slice(11, 19),
  live: true,
  timeStep: 1
};

function setToLiveTime() {
  const now = new Date();
  timeParams.currentDate = now.toISOString().slice(0, 10);
  timeParams.currentTime = now.toISOString().slice(11, 19);
  lastUpdateTime = now;
}

function updateTimeFromGUI() {
  const newDateTime = new Date(`${timeParams.currentDate} ${timeParams.currentTime}`);
  lastUpdateTime = newDateTime;
}
  
function updateTimerDisplay() {
  const spaces = '\u00A0\u00A0\u00A0';
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = `${timeParams.currentDate}${spaces}${timeParams.currentTime} UTC`;
  }
}
  

function resetToLive() {
  setToLiveTime();
  timeParams.timeStep = 1;
  slider.value = 0;
  output.textContent = steps[slider.value];

  const solarSystemZoomOut = new THREE.Vector3(0, 0, 696.340 * 3000); // zoomed out position
  const liveCameraPos = new THREE.Vector3(696.340 * 200, 696.340 * 200, 696.340 * 400);
  const liveTarget = new THREE.Vector3(0, 0, 0);

  gsap.to(camera.position, {
    duration: 2,
    x: liveCameraPos.x,
    y: liveCameraPos.y,
    z: liveCameraPos.z,
    ease: "power2.out",
    onUpdate: () => camera.updateProjectionMatrix()
  });

  gsap.to(controls.target, {
    duration: 2,
    x: liveTarget.x,
    y: liveTarget.y,
    z: liveTarget.z,
    ease: "power2.out",
    onUpdate: () => controls.update()
  });

  controls.minDistance = 7000.0;
  trackedPlanetData = null;
  trackedPlanetLastPosition = null;

  const currentTime = new Date();
  planetsData.forEach((planetData, index) => {
    const orbitLine = orbitLines[planetData.name];
    const trailPoints = planetTrailPoints[index];

    //Repopulate 30% of orbit trail
    generateInitialOrbitTrail(planetData, trailPoints, currentTime);
    updateOrbitPath(orbitLine, trailPoints, planetMeshes[planetData.name].position, planetData, currentTime);
  });
}


let previousTime = ΔJ2000()*86400;


//Initialize to current UTC time
let lastUpdateTime = new Date(); //Initialize to current UTC time
console.log("Current UTC Time", lastUpdateTime); //Log to console for debugging


function generateInitialOrbitTrail(planetData, trailPoints, currentTime) {
  const { a, e, i, Ω, ω, M0, t0 } = planetData.keplerianElements;
  const orbitalPeriod = calculateOrbitalPeriod(a);
  const trailDuration = orbitalPeriod * trailPercentage;
  const currentTimeSec = currentTime.getTime() / 1000;
  const sampleInterval = orbitalPeriod / 100;

  trailPoints.length = 0;

  const numSamples = Math.floor(trailDuration / sampleInterval);
  for (let j = 0; j <= numSamples; j++) {
    const t = currentTimeSec - (trailDuration * j / 100);
    const date = new Date(t * 1000);
    const state = calculateStateVector(a, e, i, Ω, ω, M0, t0, date);
    trailPoints.unshift({ position: state.position, time: t });
  }
}

function updateOrbitPath(orbitline, trailPoints, newPosition, planetData, currentTime) {
  if (!trailPoints) return;

  const { a } = planetData.keplerianElements;
  const orbitalPeriod = calculateOrbitalPeriod(a);
  const trailDuration = orbitalPeriod * trailPercentage;
  const currentTimeSec = currentTime.getTime() / 1000;

  //Add new point only if enough sim time has passed
  const sampleInterval = orbitalPeriod / 100;
  if (
    trailPoints.length === 0 ||
    (currentTimeSec - trailPoints[trailPoints.length - 1].time) >= sampleInterval
  ) {
    trailPoints.push({ position: newPosition.clone(), time: currentTimeSec });
  }

  //Trim trail to 30% of orbit period
  while (
    trailPoints.length > 0 &&
    (currentTimeSec - trailPoints[0].time) > trailDuration
  ) {
    trailPoints.shift();
  }

  if (trailPoints.length < 2) return;

  const visiblePoints = trailPoints.map(p => p.position);
  // Ensure trail ends at current rendered position
  if (visiblePoints.length > 0) {
    const lastPoint = visiblePoints[visiblePoints.length - 1];
    if (!lastPoint.equals(newPosition)) {
      visiblePoints.push(newPosition.clone());
    }
  }
  const curve = new THREE.CatmullRomCurve3(visiblePoints);

  const cameraZoomFactor = camera.position.length(); // distance from origin
  const resolution = Math.floor(THREE.MathUtils.clamp(1000 / cameraZoomFactor, 100, 500));
  const smoothPoints = curve.getPoints(resolution);

  orbitline.geometry.setFromPoints(smoothPoints);
  orbitline.geometry.attributes.position.needsUpdate = true;
}


function updatePlanetPositions(currentJ2000Time) {
  planetsData.forEach((planetData, index) => {
    const { a, e, i, Ω, ω, M0, t0 } = planetData.keplerianElements;
    const planetMesh = planetMeshes[planetData.name];
    const orbitLine = orbitLines[planetData.name];

    const currentDate = new Date(currentJ2000Time);
    const stateVector = calculateStateVector(a, e, i, Ω, ω, M0, t0, currentDate);
    planetMesh.position.copy(stateVector.position);

    // ✅ DO NOT reinitialize trailPoints each frame!
    const trailPoints = planetTrailPoints[index];
    updateOrbitPath(orbitLine, trailPoints, stateVector.position, planetData, currentDate);
    orbitLine.visible = true;
  });

  // === Update dynamically created comets ===
  cometData.forEach(obj => {
    if (!objectMeshes[obj.name] || !obj.keplerianElements) return;
    const { a, e, i, Ω, ω, M0, t0 } = obj.keplerianElements;
    const currentDate = new Date(currentJ2000Time);
    const stateVector = calculateStateVector(a, e, i, Ω, ω, M0, t0, currentDate);
    objectMeshes[obj.name].position.copy(stateVector.position);

    if (!cometTrailPoints[obj.name]) {
      cometTrailPoints[obj.name] = [];
    }

    const points = cometTrailPoints[obj.name];
    const orbitalPeriod = calculateOrbitalPeriod(a);
    const trailDuration = trailPercentage * orbitalPeriod;
    const currentTimeSec = currentDate.getTime() / 1000;

    points.push({ position: stateVector.position.clone(), time: currentTimeSec });

    while (points.length > 0 && (currentTimeSec - points[0].time) > trailDuration) {
      points.shift();
    }

    if (orbitLines[obj.name]) {
      const positions = points.map(pt => pt.position);
      orbitLines[obj.name].geometry.setFromPoints(positions);
      orbitLines[obj.name].geometry.attributes.position.needsUpdate = true;
    }
  });
}








//----------------------------------------------------------ANIMATION LOOP----------------------------------------------------------//
//----------------------------------------------------------ANIMATION LOOP----------------------------------------------------------//
//----------------------------------------------------------ANIMATION LOOP----------------------------------------------------------//
const animate = () => {
  requestAnimationFrame(animate);

  // (Time update code remains the same)
  const currentTime = ΔJ2000(); // days since J2000
  const currentTimeInSeconds = currentTime * 86400; // convert days to seconds
  const deltaTime = currentTimeInSeconds - previousTime;
  const adjustedDeltaTime = deltaTime * timeParams.timeStep;
  
  const newUpdateTime = new Date(lastUpdateTime.getTime() + adjustedDeltaTime * 1000);
  previousTime = currentTimeInSeconds;
  if (timeParams.live) {
      timeParams.currentDate = newUpdateTime.toISOString().slice(0, 10);
      timeParams.currentTime = newUpdateTime.toISOString().slice(11, 19);
      lastUpdateTime = newUpdateTime;
  }
  
  // Update positions of all planets.
  updatePlanetPositions(newUpdateTime);
  updateTimerDisplay();
  
  // If a planet is being tracked, update camera translation.
  if (trackedPlanetData && trackedPlanetLastPosition) {
      const { a, e, i, Ω, ω, M0, t0 } = trackedPlanetData.keplerianElements;
      const stateVector = calculateStateVector(a, e, i, Ω, ω, M0, t0, newUpdateTime);
      const currentPlanetPosition = stateVector.position;
      
      // Compute the translation delta.
      const delta = currentPlanetPosition.clone().sub(trackedPlanetLastPosition);
      
      // Apply the same delta to camera position and OrbitControls target.
      camera.position.add(delta);
      controls.target.add(delta);
      
      // Update the last known planet position.
      trackedPlanetLastPosition.copy(currentPlanetPosition);

      // Update the directional light's target to the planet's current position
      directionalLight.target.position.copy(trackedPlanetLastPosition);
      directionalLight.target.updateMatrixWorld();
  }
  
  // Render scene.
  camera.layers.set(1);
  bloomComposer.render();
  renderer.clearDepth();
  camera.layers.set(0);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
};

animate();


// Handle window resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloomComposer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
};






//EVENT LISTENERS FOR TIMER FUNCTIONALITY

// Function to reset all buttons and set the play button as active
function resetButtons() {
  const buttons = document.querySelectorAll("#playmenu button");
  // Remove active class from all buttons
  buttons.forEach(button => button.classList.remove("active"));
  // Add active class to the play button
  document.getElementById("play").classList.add("active");
}

// Add event listener to the reset button
document.getElementById("resetbutton").addEventListener("click", resetButtons);
document.getElementById('resetbutton').addEventListener('click', () => {
  resetToLive();
});


// Function to handle button click and ensure only one button is active at a time
function handleButtonClick(event) {
  const buttons = document.querySelectorAll("#playmenu button");
  // Remove active class from all buttons
  buttons.forEach(button => button.classList.remove("active"));
  // Add active class to the clicked button
  event.target.classList.add("active");
}

// Add event listeners to all buttons
document.getElementById("rewind").addEventListener("click", handleButtonClick);
document.getElementById("reverse").addEventListener("click", handleButtonClick);
document.getElementById("pause").addEventListener("click", handleButtonClick);
document.getElementById("play").addEventListener("click", handleButtonClick);
document.getElementById("fastforward").addEventListener("click", handleButtonClick);



document.getElementById('rewind').addEventListener('click', () => {
  timeParams.timeStep = -1000;
});
document.getElementById('reverse').addEventListener('click', () => {
  timeParams.timeStep = -1;
});
document.getElementById('pause').addEventListener('click', () => {
  timeParams.timeStep = 0;
});
document.getElementById('play').addEventListener('click', () => {
  timeParams.timeStep = 1;
});
document.getElementById('fastforward').addEventListener('click', () => {
  timeParams.timeStep = 1000;
});



//SLIDER STEPS
const slider = document.getElementById("mySlider");
const output = document.getElementById("sliderValue");
const steps = [1, 60, 3600, 86400, 604800, 2678400, 31536000]; // Define your custom steps here

slider.oninput = function() {
    output.textContent = steps[this.value];
}

// Initialize with the default value
output.textContent = steps[slider.value];


//event listener
slider.addEventListener("input", function() {
  // Update the displayed value
  output.textContent = steps[this.value];
  // Example: Update timeParams.timeStep with the new slider value
  timeParams.timeStep = steps[this.value];
});






//Center on Planet Version 2.0
// Hook: Zoom to object when clicking on planet/comet name in the DataTable
$(document).on('click', '#satelliteTable tbody td:nth-child(2)', function () {
  const table = $('#satelliteTable').DataTable();
  const rowData = table.row($(this).closest('tr')).data();
  const name = rowData.planetname;

  let obj = planetsData.find(p => p.name === name) ||
            moonData.find(m => p.name === name) ||
            cometData.find(c => c.name === name) ||
            exoplanetData.find(e => e.name === name);

  if (!obj || !obj.keplerianElements) return;

  if (planetMeshes[name]) {
    planetMeshes[name].visible = true;
    planetLabels[name].visible = true;
  } else if (objectMeshes[name]) {
    objectMeshes[name].visible = true;
    objectLabels[name].visible = true;
  } else {
    $(this).closest('tr').find('.view-object-toggle').prop('checked', true).trigger('change');
  }

  centerCameraOnPlanet(obj);
});

function centerCameraOnPlanet(obj) {
  //reset simulation speed to avoid missing object
  timeParams.timeStep = 1;
  slider.value = 0;
  output.textContent = steps[slider.value];

  const { a, e, i, Ω, ω, M0, t0 } = obj.keplerianElements;
  const radius = obj.radius || 10;
  const texturePath = obj.texture || './textures/default.jpg';
  const currentTime = new Date(timeParams.currentDate + 'T' + timeParams.currentTime + 'Z');
  const stateVector = calculateStateVector(a, e, i, Ω, ω, M0, t0, currentTime);
  const position = stateVector.position;

  const mesh = planetMeshes[obj.name] || objectMeshes[obj.name];
  if (mesh && !mesh.userData.textureApplied) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(texturePath, texture => {
      mesh.material.map = texture;
      mesh.material.needsUpdate = true;
      mesh.userData.textureApplied = true;
    });
  }

  // Camera offset direction for final view
  const offsetDir = new THREE.Vector3(1, 0.4, 0.7).normalize();
  const finalDistance = Math.max(5, radius * 7);
  const finalPosition = position.clone().add(offsetDir.clone().multiplyScalar(finalDistance));

  // Calculate zoom-out midpoint
  const currentPos = camera.position.clone();
  const midpoint = currentPos.clone().lerp(finalPosition, 0.5).add(offsetDir.clone().multiplyScalar(1500));

  // Animate camera path in a smooth arc: current → midpoint → final
  gsap.to(camera.position, {
    duration: 2,
    x: finalPosition.x,
    y: finalPosition.y,
    z: finalPosition.z,
    ease: "power3.inOut",
    onUpdate: () => camera.updateProjectionMatrix()
  });

  gsap.to(controls.target, {
    duration: 2,
    x: position.x,
    y: position.y,
    z: position.z,
    ease: "power3.inOut",
    onUpdate: () => controls.update()
  });

  controls.minDistance = radius * 2;
  trackedPlanetData = obj;
  trackedPlanetLastPosition = position.clone();
}