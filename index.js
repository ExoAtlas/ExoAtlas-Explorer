import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'jsm/postprocessing/UnrealBloomPass.js';
import { createPlanet, createOrbitPath } from "./src/celestial.js";
import { planetsData } from "./src/planetdata.js";
import { calculateStateVector } from './src/exoastro.js';
import { calculateOrbitalPeriod } from "./src/exoastro.js";
import { ΔJ2000 } from './src/j2000calc.js';
import { CSS2DRenderer, CSS2DObject } from "jsm/renderers/CSS2DRenderer.js";

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
controls.minDistance = 7000.000;
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
const planetMeshes = []; //store planet meshes for raycasting
const planetLabels = []; // Store planet labels
const orbitLines = []; // Store orbit lines for each planet
const trailPoints = []; // Store points arrays for each planet's trail
const trailPercentage = 0.75; // Set your desired trail percentage

planetsData.forEach(planetData => {
  // Create the planet mesh.
  const planet = createPlanet({ ...planetData, scene, loader });
  planetMeshes.push(planet);

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

  // Attach the label to the planet mesh so it automatically follows its position.
  planet.add(label);

  // Set the label’s position relative to the planet.
  // For example, placing it above the planet (adjust the multiplier as needed).
  label.position.set(0, planetData.radius * 1.01, 0);

  // Keep a reference in case you want to toggle visibility later.
  planetLabels.push(label);

  // Create the orbit path as before.
  const { orbitline, points } = createOrbitPath(planetData, trailPercentage, scene);
  orbitLines.push(orbitline);
  trailPoints.push(points);
});


const labelCheckbox = document.getElementById("labelsCheckbox");
if (labelCheckbox) {
  labelCheckbox.addEventListener('change', togglePlanetLabels);
  // Initialize labels based on the checkbox's default state
  togglePlanetLabels();
}

function togglePlanetLabels() {
  const showLabels = labelCheckbox.checked;
  planetLabels.forEach(label => {
    label.visible = showLabels;
  });
}


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
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = `${timeParams.currentDate} ${timeParams.currentTime} UTC`;
  }
}
  

function resetToLive() {
  setToLiveTime();
  timeParams.timeStep = 1;

  // Reset the slider to 1x speed (assuming index 0 corresponds to 1x)
  slider.value = 0;
  output.textContent = steps[slider.value];
  
  // Reset camera and controls
  controls.reset();
  camera.position.set(696.340 * 200, 696.340 * 200, 696.340 * 400);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  controls.minDistance = 7000.000;
  trackedPlanetData = null;
  trackedPlanetLastPosition = null;


  // Reset trails for each planet
  const currentTime = new Date();
  const currentTimeSec = currentTime.getTime() / 1000;
  planetsData.forEach((planetData, index) => {
    const orbitline = orbitLines[index];
    const points = trailPoints[index];
  
    // Compute the initial position for the planet at the current time
    const initialPosition = calculateStateVector(
      planetData.keplerianElements.a,
      planetData.keplerianElements.e,
      planetData.keplerianElements.i,
      planetData.keplerianElements.Ω,
      planetData.keplerianElements.ω,
      planetData.keplerianElements.M0,
      planetData.keplerianElements.t0,
      currentTime
    ).position;
  
    // Clear the existing trail points and repopulate with the initial position
    points.length = 0; // Clear the trail array
    const defaultSegments = 10; // Or choose a number that fits your visual preference
    for (let j = 0; j < defaultSegments; j++) {
      points.push({ position: initialPosition.clone(), time: currentTimeSec });
    }
    // Update the orbitline geometry with the reset points
    const positions = points.map(pt => pt.position);
    orbitline.geometry.setFromPoints(positions);
    orbitline.geometry.attributes.position.needsUpdate = true;
  });

}

let previousTime = ΔJ2000()*86400;


//Initialize to current UTC time
let lastUpdateTime = new Date(); //Initialize to current UTC time
console.log("Current UTC Time", lastUpdateTime); //Log to console for debugging



function updateOrbitPath(orbitline, trailPoints, newPosition, planetData, currentTime) {
  const { a } = planetData.keplerianElements;
  const orbitalPeriod = calculateOrbitalPeriod(a);
  const trailDuration = trailPercentage * orbitalPeriod;
  const currentTimeSec = currentTime.getTime() / 1000;

  // Ensure only the latest positions are stored
  trailPoints.push({ position: newPosition.clone(), time: currentTimeSec });

  // Remove old points that exceed the trail duration
  while (trailPoints.length > 0 && (currentTimeSec - trailPoints[0].time) > trailDuration) {
      trailPoints.shift();
  }

  // Update existing geometry, not recreate it
  const positions = [];
  const alphas = [];
  for (let i = 0; i < trailPoints.length; i++) {
      positions.push(trailPoints[i].position.x, trailPoints[i].position.y, trailPoints[i].position.z);
      alphas.push(0.2 + 0.8 * (i / (trailPoints.length - 1))); // Gradient effect
  }

  orbitline.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  orbitline.geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));
  orbitline.geometry.attributes.position.needsUpdate = true;
  orbitline.geometry.attributes.alpha.needsUpdate = true;
}


function updatePlanetPositions(currentJ2000Time) {
  planetsData.forEach((planetData, index) => {
      const { a, e, i, Ω, ω, M0, t0 } = planetData.keplerianElements;
      const planetMesh = planetMeshes[index];
      const orbitline = orbitLines[index];
      const points = trailPoints[index];

      // Use the simulation's current time
      const currentDate = new Date(currentJ2000Time);
      const stateVector = calculateStateVector(a, e, i, Ω, ω, M0, t0, currentDate);
      planetMesh.position.copy(stateVector.position);

      // Update the trail using the current simulation time.
      updateOrbitPath(orbitline, points, planetMesh.position, planetData, currentDate);
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


var dropdown = document.getElementsByClassName("dropdown-btn");
var i;

for (i = 0; i < dropdown.length; i++) {
  dropdown[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var dropdownContent = this.nextElementSibling;
    if (dropdownContent.style.display === "block") {
      dropdownContent.style.display = "none";
    } else {
      dropdownContent.style.display = "block";
    }
  });
}


//SLIDER STEPS
const slider = document.getElementById("mySlider");
const output = document.getElementById("sliderValue");
const steps = [1, 10, 100, 1000, 10000, 100000, 1000000]; // Define your custom steps here

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



// Function to center the camera on a planet and update orbit controls target
function centerCameraOnPlanet(planetData) {
  const { a, e, i, Ω, ω, M0, t0 } = planetData.keplerianElements;
  // Use the planet's radius from planetData (not from keplerianElements)
  const { radius } = planetData;
  
  const currentTime = new Date();
  const stateVector = calculateStateVector(a, e, i, Ω, ω, M0, t0, currentTime);
  const position = stateVector.position;
  const velocity = stateVector.velocity;
  
  // Lazy-load the texture if needed.
  const planetMesh = planetMeshes.find(mesh => mesh.name === planetData.name);
  if (planetMesh && !planetMesh.userData.textureApplied) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(planetMesh.userData.textureUrl, (texture) => {
      planetMesh.material.map = texture;
      planetMesh.material.needsUpdate = true;
      planetMesh.userData.textureApplied = true;
    });
  }
  
  // Compute the base direction: from the planet to the sun (sun is at origin)
  const directionToSun = position.clone().negate().normalize();
  // Add a small upward offset for an isometric view.
  const upwardAdjustment = new THREE.Vector3(0, 0.5, 0);
  // Add a forward adjustment using the planet's velocity.
  const forwardAdjustmentFactor = 1.5;
  const forwardAdjustment = velocity.clone().normalize().multiplyScalar(forwardAdjustmentFactor);
  
  // Combine adjustments and normalize.
  const desiredDirection = directionToSun
    .clone()
    .add(upwardAdjustment)
    .add(forwardAdjustment)
    .normalize();
  
  // Set the camera at the desired offset from the planet.
  const offsetDistance = radius * 10; // Adjust as needed.
  const newCameraPosition = position.clone().add(desiredDirection.multiplyScalar(offsetDistance));
  
  // Set camera and OrbitControls target.
  camera.position.copy(newCameraPosition);
  camera.lookAt(position);
  controls.target.copy(position);
  controls.update();
  
  // Return the planet's current position for tracking.
  return position.clone();
}



// Function to populate dropdown with planet names
function populateDropdown() {
  const planetDropdownBtn = Array.from(document.getElementsByClassName('dropdown-btn'))
      .find(button => button.textContent.trim() === 'PLANETS');
  
  if (planetDropdownBtn) {
      const planetDropdownContainer = planetDropdownBtn.nextElementSibling;
      planetsData.forEach((planetData) => {
          const planetLink = document.createElement('a');
          planetLink.href = "#";
          planetLink.textContent = planetData.name;
          planetLink.addEventListener('click', () => {
              // Begin tracking this planet.
              trackedPlanetData = planetData;
              // Center the camera using the initial offset, and store the planet's current position.
              trackedPlanetLastPosition = centerCameraOnPlanet(planetData);
              // Optionally adjust OrbitControls minDistance, etc.
              controls.minDistance = planetData.radius * 3;
          });
          planetDropdownContainer.appendChild(planetLink);
      });
  }
}

// Call the function to populate the dropdown
populateDropdown();



