import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { GUI } from 'jsm/libs/lil-gui.module.min.js';
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
controls.minDistance = 700.000;
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
    
    
    
    //OLD SPRITES
    //const label = createLabel(planetData.name);
    //label.position.set(planetData.position[0], planetData.position[1] + 1000, planetData.position[2]); // Adjust the position as needed
    //label.visible = false; // Initially hide the label
    //planetLabels.push(label);
    //scene.add(label);

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
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);




// Add PointLight at the center of the scene
const pointLight = new THREE.PointLight(0xffffff, 100000000000, 17951744484);
pointLight.castShadow = true;
pointLight.shadowCameraVisible = true;
pointLight.shadowBias = 0.00001;
pointLight.shadowDarkness = 0.2;
pointLight.shadowMapWidth = 2048;
pointLight.shadowMapHeight = 2048;
pointLight.position.set(0, 0, 0);
scene.add(pointLight);


//--------------------------Error here somehwere
//Create Label Function
//const createLabel = (text) => {
    //const canvas = document.createElement('canvas');
    //const context = canvas.getContext('2d');
    //context.font = '24px Arial';
    //const textWidth = context.measureText(text).width;
    //canvas.width = textWidth;
    //canvas.height = 30; // Adjust as needed
    //context.font = '24px Arial';
    //context.fillStyle = 'white';
    //context.fillText(text, 0, 24);
    //const texture = new THREE.CanvasTexture(canvas);
    //const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    //const sprite = new THREE.Sprite(spriteMaterial);
    //sprite.scale.set(canvas.width / 10, canvas.height / 10, 1);
    //return sprite;
//};


//function createLabel(name) {
    //const canvas = document.createElement('canvas');
    //const context = canvas.getContext('2d');
    //context.font = 'Bold 40px Arial';
    //context.fillStyle = 'rgba(255, 255, 255, 1.0)';
    //context.fillText(name, 0, 40);
    //const texture = new THREE.CanvasTexture(canvas);
    //const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    //const sprite = new THREE.Sprite(material);
    //sprite.scale.set(canvas.width * 50, canvas.height * 50, 1); // Adjust scale based on your needs
    //return sprite;
//}






//RAYCASTING
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector3();
window.addEventListener('mousemove', onMouseMove, false);
function onMouseMove(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}


// GUI Setup
const gui = new GUI();
const timeParams = {
    currentDate: new Date().toISOString().slice(0, 10),
    currentTime: new Date().toISOString().slice(11, 19),
    live: true, // Default to live time
    timeStep: 1 // Default to 1x speed
};

const timeStepOptions = { '1x': 1, '2x': 2, '4x': 4, '10x': 10, '100x': 100, '1000x': 1000, '10000x': 10000 };

gui.add(timeParams, 'currentDate').name('Current Date').listen().onChange(updateTimeFromGUI);
gui.add(timeParams, 'currentTime').name('Current Time (UTC)').listen().onChange(updateTimeFromGUI);
gui.add(timeParams, 'live').name('Live Update').onChange(value => {
    if (value) {
        setToLiveTime();
    }
});
gui.add(timeParams, 'timeStep', timeStepOptions).name('Time Step').onChange(updateTimeFromGUI);


// Layers GUI
function setToLiveTime() {
    const now = new Date();
    timeParams.currentDate = now.toISOString().slice(0, 10);
    timeParams.currentTime = now.toISOString().slice(11, 19);
    lastUpdateTime = now;
}

function updateCurrentTime() {
    const now = new Date();
    timeParams.currentDate = now.toISOString().slice(0, 10);
    timeParams.currentTime = now.toISOString().slice(11, 19);
}

function updateTimeFromGUI() {
    const newDateTime = new Date(`${timeParams.currentDate}T${timeParams.currentTime}Z`);
    lastUpdateTime = newDateTime;
}

let previousTime = performance.now();
let lastUpdateTime = new Date();



//-------------------------ANIMATION LOOP-------------------------//
const animate = () => {
    requestAnimationFrame(animate);
    const currentTime = performance.now();
    const deltaTime = (currentTime - previousTime) / 1000; // Convert to seconds
    previousTime = currentTime;
    const adjustedDeltaTime = deltaTime * timeParams.timeStep;

    if (timeParams.live) {
        const newUpdateTime = new Date(lastUpdateTime.getTime() + adjustedDeltaTime * 1000);
        timeParams.currentDate = newUpdateTime.toISOString().slice(0, 10);
        timeParams.currentTime = newUpdateTime.toISOString().slice(11, 19);
        lastUpdateTime = newUpdateTime;
    }
    
    // Update raycaster with camera and mouse positions
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetMeshes);
    
    // Hide all orbits and labels initially
    orbitMeshes.forEach(orbitarray => orbitarray.visible = false);
    planetLabels.forEach(label => label.element.style.display = 'none');
    
    if (intersects.length > 0) {
        // Get the first intersected object
        const intersectedObject = intersects[0].object;
    
        // Find the corresponding orbit and make it visible
        const index = planetMeshes.indexOf(intersectedObject);
        if (index !== -1) {
            orbitMeshes[index].visible = true;
            planetLabels[index].element.style.display = 'block';
        }
        }
    


    // Manage label visibility
    planetLabels.forEach((label, index) => {
        if (intersects.length > 0 && intersects[0].object === planetMeshes[index]) {
            scene.add(label); // Add label only if it's intersected and not already added
            orbitMeshes[index].visible = true;
        } else {
            if (scene.children.includes(label)) {
                scene.remove(label); // Remove label if it's not intersected
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
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloomComposer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
},
false
);
