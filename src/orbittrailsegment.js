// Computes the trailing segment of an object's orbit trail
import * as THREE from "three";
import { CatmullRomCurve3 } from 'three';
import { calculateOrbitalPeriod } from "./exoastro.js";
import { calculateStateVector } from './exoastro.js';


/**
 * Create a 3D trail along the last X% of the orbital period.
 * @param {Object} keplerianElements - Orbital elements
 * @param {number} trailPercent - How much of the orbit to show (0.3 = 30%)
 * @param {Date} currentTime - Current simulation time
 * @param {THREE.Scene} scene - Three.js scene
 * @returns {THREE.Line} - The orbit trail line
 */
export function createOrbitTrailSegment(keplerianElements, trailPercent, currentTime, scene) {
  const { a, e, i, Ω, ω, M0, t0 } = keplerianElements;

  const trailSegments = 100;
  const orbitalPeriod = calculateOrbitalPeriod(a); // in seconds
  const trailDuration = orbitalPeriod * trailPercent;
  const currentTimeSec = currentTime.getTime() / 1000;

  const trailPoints = [];

  for (let j = 0; j <= trailSegments; j++) {
    const t = currentTimeSec - (trailDuration * (j / trailSegments));
    const date = new Date(t * 1000);
    const state = calculateStateVector(a, e, i, Ω, ω, M0, t0, date);
    trailPoints.unshift(state.position); // unshift to build forward-facing trail
  }

  const curve = new CatmullRomCurve3(trailPoints);
  const smoothPoints = curve.getPoints(trailSegments);

  const geometry = new THREE.BufferGeometry().setFromPoints(smoothPoints);
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });

  const orbitLine = new THREE.Line(geometry, material);
  orbitLine.visible = false;
  scene.add(orbitLine);

  return orbitLine;
}
