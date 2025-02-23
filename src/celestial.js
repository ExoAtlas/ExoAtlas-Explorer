import * as THREE from "three";
import { calculateStateVector } from './exoastro.js';
import { calculateOrbitalPeriod} from "./exoastro.js";
import { ΔJ2000 } from './j2000calc.js';

export function createPlanet(params) {
    const { name, radius, texture, position, rotationalspeed, scene, loader } = params;
    const planetgeometry = new THREE.SphereGeometry(radius, 64, 360);
    // Use a plain white material initially
    const planetmaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff
    });
    const planetMesh = new THREE.Mesh(planetgeometry, planetmaterial);
    planetMesh.position.set(...position);
    planetMesh.layers.set(0);
    planetMesh.name = name;
    planetMesh.userData.rotationalspeed = rotationalspeed || 0;
    // Store the texture URL and a flag to check if it’s been applied
    planetMesh.userData.textureUrl = texture;
    planetMesh.userData.textureApplied = false;
    scene.add(planetMesh);
    return planetMesh;
}

export function createOrbitPath(planetData, trailPercentage, scene) {
    const { a, e, i, Ω, ω, M0, t0 } = planetData.keplerianElements;
    

    // Use the current simulation time
    const currentTime = new Date();
    const currentTimeSec = currentTime.getTime() / 1000;
    
    // Calculate the orbital period and determine the trail duration
    const orbitalPeriod = calculateOrbitalPeriod(a); // in seconds
    const trailDuration = trailPercentage * orbitalPeriod;
    
    // Set a fixed number of segments and determine the time interval between points
    const segments = 1000; // Adjust as needed
    const dt = trailDuration / segments;
    
    const points = [];
    
    // Sample points along the orbit, going backwards in time
    for (let j = 0; j < segments; j++) {
      const sampleTimeSec = currentTimeSec - (j * dt);
      const sampleTime = new Date(sampleTimeSec * 1000);
      const samplePosition = calculateStateVector(a, e, i, Ω, ω, M0, t0, sampleTime).position;
      points.push({ position: samplePosition, time: sampleTimeSec });
    }
    
    // Reverse the points so the trail goes from tail (older) to head (current)
    points.reverse();
    
    // Build arrays for positions and alpha values for gradient effect
    const positions = [];
    const alphas = [];
    for (let j = 0; j < points.length; j++) {
      const pos = points[j].position;
      positions.push(pos.x, pos.y, pos.z);
      // Linearly interpolate alpha from 0.2 (tail) to 1.0 (head)
      const alphaValue = 0.2 + 0.8 * (j / (points.length - 1));
      alphas.push(alphaValue);
    }
    
    // Create a BufferGeometry and set its attributes
    const orbitgeometry = new THREE.BufferGeometry();
    orbitgeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    orbitgeometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));
    
    // Vertex and fragment shaders to apply the gradient effect
    const vertexShader = `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      varying float vAlpha;
      uniform vec3 lineColor;
      void main() {
        gl_FragColor = vec4(lineColor, vAlpha);
      }
    `;
    
    // Create a ShaderMaterial using the above shaders
    const orbitmaterial = new THREE.ShaderMaterial({
      uniforms: {
        lineColor: { value: new THREE.Color(0xffffff) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,  // Allow alpha blending
      depthTest: true,
      depthWrite: false
    });
    
    // Create the orbit line and disable frustum culling to ensure it always renders
    const orbitline = new THREE.Line(orbitgeometry, orbitmaterial);
    orbitline.frustumCulled = false;
    scene.add(orbitline);
    return { orbitline, points };
  }