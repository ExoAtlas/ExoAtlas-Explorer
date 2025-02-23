import * as THREE from "three";
import { calculateStateVector } from './exoastro.js';
import { calculateOrbitalPeriod} from "./exoastro.js";
import { ΔJ2000 } from './j2000calc.js';

export function createPlanet(params) {
    const { name, radius, texture, position, rotationalspeed, scene, loader } = params;
    const planetgeometry = new THREE.SphereGeometry(radius, 720, 360);
    const planetmaterial = new THREE.MeshStandardMaterial({
        map: loader.load(texture),
    });
    const planetMesh = new THREE.Mesh(planetgeometry, planetmaterial);
    planetMesh.position.set(...position);
    planetMesh.layers.set(0);
    planetMesh.name = name;
    planetMesh.userData.rotationalspeed = rotationalspeed || 0;
    scene.add(planetMesh);
    return planetMesh;
}

export function createOrbitPath(planetData, trailPercentage, scene) {
    const { a, e, i, Ω, ω, M0, t0 } = planetData.keplerianElements;
    
    // Calculate the time in seconds since J2000
    const timeInSecondsSinceJ2000 = (ΔJ2000() - ΔJ2000(t0)) * 86400;  // ΔJ2000 returns days, convert to seconds
    
    // Calculate the planet's initial position at t = 0 (J2000 epoch)
    const initialPosition = calculateStateVector(a, e, i, Ω, ω, M0, t0, 0).position; // Use t = 0 here

    const period = calculateOrbitalPeriod(a); // Calculate the orbital period
    const segments = Math.round(trailPercentage * period); // Determine segments based on percentage

    console.log("Semi-major axis (a):", a);
    console.log("Orbital Period (period):", period);
    console.log("Trail Percentage (trailPercentage):", trailPercentage);




    const maxSegments = 10;
    const adjustedSegments = Math.min(segments, maxSegments);
    console.log("Number of Segments (segments):", adjustedSegments);


    const points = new Array(adjustedSegments).fill(initialPosition.clone());

    const orbitgeometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbitmaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const orbitline = new THREE.Line(orbitgeometry, orbitmaterial);
    orbitline.geometry.setFromPoints(points);
    orbitline.geometry.attributes.position.needsUpdate = true; // This line is crucial
    scene.add(orbitline);
    return { orbitline, points };
}