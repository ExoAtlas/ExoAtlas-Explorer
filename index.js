import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getStarfield from "./src/getStarfield.js";
import { getFresnelMat } from "./src/getFresnelMat.js";

//Three.js Scene Setup
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

//Earth Geometry
const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
earthGroup.position.set(0,0,0)
scene.add(earthGroup);
new OrbitControls(camera, renderer.domElement);
const loader = new THREE.TextureLoader();
const geometry = new THREE.SphereGeometry(1, 720, 360);
const material = new THREE.MeshStandardMaterial({
  map: loader.load("./textures/earth/earth_texture_5k.jpg"),
  specularMap: loader.load("./textures/earth/earth_spec_1k.jpg"),
});
const EarthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(EarthMesh);


//LIGHT MESH
const lightsMat = new THREE.MeshBasicMaterial({
  map: loader.load("./textures/earth/earth_lights_10k.jpg"),
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

//CLOUD MESH
const cloudsMat = new THREE.MeshStandardMaterial({
  map: loader.load("./textures/earth/earth_clouds_8k.jpg"),
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);


//Earth Horizon Glow
const fresnelMat = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, fresnelMat);
glowMesh.scale.setScalar(1.01);
earthGroup.add(glowMesh); 

//Starry Background
const stars = getStarfield({numStars: 2000});
scene.add(stars);


//Sunlight Source
const sunLight = new THREE.DirectionalLight(0xffffff);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

function animate() {
  requestAnimationFrame(animate);

  EarthMesh.rotation.y += 0.0002;
  lightsMesh.rotation.y += 0.0002;
  cloudsMesh.rotation.y += 0.0004;
  glowMesh.rotation.y += 0.0002;
  renderer.render(scene, camera);
}

animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);
