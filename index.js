import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'jsm/postprocessing/UnrealBloomPass.js';
import { createPlanet, createOrbitPath } from "./src/celestial.js";
import { planetsData } from "./src/planetdata.js";
import { CSS2DRenderer, CSS2DObject } from "jsm/renderers/CSS2DRenderer.js";

// Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 17951744.484);
camera.position.y = 696.340 * 200;
camera.position.z = 696.340 * 400;
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
const orbitMeshes = []; //stores orbit meshes for raycasting
const planetLabels = []; // Store planet labels
planetsData.forEach(planetData => {
    const planet = createPlanet({ ...planetData, scene, loader });
    planetMeshes.push(planet); //add planet mesh to array
    
    
    //CSS3DLABELS
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = planetData.name;
    labelDiv.style.marginTop = '-1.5em';
    labelDiv.style.font = 'Bold 40px Arial'
    labelDiv.style.fontSize = '15px'; // Set font size
    labelDiv.style.padding = '3px'; // Set padding
    labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Set background color
    labelDiv.style.color = 'white'; // Ensure text is visible
    labelDiv.style.display = 'none'; // Initially hide the label
    const label = new CSS2DObject(labelDiv);
    label.position.set(planetData.position[0], planetData.position[1] + 1000, planetData.position[2]); // Adjust the position as needed
    planetLabels.push(label);
    scene.add(label);

    const orbitarray = createOrbitPath(planetData.position[0], 100, scene);
    orbitMeshes.push(orbitarray); //add orbits to array
});




// Add AmbientLight to soften the shadows
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // soft white light
scene.add(ambientLight);




// Add PointLight at the center of the scene
const pointLight = new THREE.PointLight(0xfdfbd3, 100000000000*.5, 17951744484);
pointLight.castShadow = true;
pointLight.shadowCameraVisible = true;
pointLight.shadowBias = 0.00001;
pointLight.shadowDarkness = 0.2;
pointLight.shadowMapWidth = 2048;
pointLight.shadowMapHeight = 2048;
pointLight.position.set(0, 0, 0);
scene.add(pointLight);


//RAYCASTING
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector3();
window.addEventListener('mousemove', onMouseMove, false);
function onMouseMove(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}


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
    controls.reset();
    camera.position.set(696.340 * 200, 696.340 * 200, 696.340 * 400);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls.minDistance = 7000.000;
    updateActiveButton('speed-1x');
  }



  let previousTime = performance.now();
  let lastUpdateTime = new Date();



//-------------------------ANIMATION LOOP-------------------------//
const animate = () => {
    requestAnimationFrame(animate);
    const currentTime = performance.now();
    const deltaTime = (currentTime - previousTime) / 1000;
    previousTime = currentTime;
    const adjustedDeltaTime = deltaTime * timeParams.timeStep;
  
    if (timeParams.live) {
      const newUpdateTime = new Date(lastUpdateTime.getTime() + adjustedDeltaTime * 1000);
      timeParams.currentDate = newUpdateTime.toISOString().slice(0, 10);
      timeParams.currentTime = newUpdateTime.toISOString().slice(11, 19);
      lastUpdateTime = newUpdateTime;
    }
  
    updateTimerDisplay();
  
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetMeshes);
  
    orbitMeshes.forEach(orbitarray => orbitarray.visible = true);
    planetLabels.forEach(label => label.element.style.display = 'none'); //use 'none' to hide at start
  
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const index = planetMeshes.indexOf(intersectedObject);
      if (index !== -1) {
        orbitMeshes[index].visible = true;
        planetLabels[index].element.style.display = 'block';
      }
    }
  
    planetLabels.forEach((label, index) => {
      if (intersects.length > 0 && intersects[0].object === planetMeshes[index]) {
        scene.add(label);
        orbitMeshes[index].visible = true;
      } else {
        if (scene.children.includes(label)) {
          scene.remove(label);
        }
      }
    });


    camera.layers.set(1);
    bloomComposer.render();
    renderer.clearDepth();
    camera.layers.set(0);
    renderer.render(scene, camera);
    if (intersects.length > 0) {
        labelRenderer.render(scene, camera); // Render labels only if there's an intersection
    }
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
const steps = [1, 10, 100, 1000, 10000]; // Define your custom steps here

slider.oninput = function() {
    output.textContent = steps[this.value];
}

// Initialize with the default value
output.textContent = steps[slider.value];



// Function to center the camera on a planet and update orbit controls target
function centerCameraOnPlanet(planetPosition) {
    // Add an offset to the camera position to ensure it's not inside the planet
    const offset = 0;  // Adjust this value as needed
    const targetPosition = new THREE.Vector3(...planetPosition);
    const direction = new THREE.Vector3().subVectors(camera.position, targetPosition);
    const newPosition = targetPosition.add(direction.multiplyScalar(offset));

    camera.position.copy(newPosition);
    camera.lookAt(targetPosition);
    controls.target.copy(targetPosition);  // Update the orbit controls target
    controls.update();
}

// Function to populate dropdown with planet names
function populateDropdown() {
    const planetDropdownBtn = Array.from(document.getElementsByClassName('dropdown-btn'))
        .find(button => button.textContent.trim() === 'PLANETS');
    
    if (planetDropdownBtn) {
        const planetDropdownContainer = planetDropdownBtn.nextElementSibling;
        planetsData.forEach((planetData, index) => {
            const planetLink = document.createElement('a');
            planetLink.href = "#";
            planetLink.textContent = planetData.name;
            planetLink.addEventListener('click', () => {
                centerCameraOnPlanet(planetData.position);
                controls.minDistance = planetData.radius*3;
            });
            planetDropdownContainer.appendChild(planetLink);
        });
    }
}

// Call the function to populate the dropdown
populateDropdown();



