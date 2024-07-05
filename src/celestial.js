import * as THREE from "three";

export function createPlanet(params) {
    const { name, radius, texture, position, scene, loader } = params;
    const planetgeometry = new THREE.SphereGeometry(radius, 720, 360);
    const planetmaterial = new THREE.MeshStandardMaterial({
        map: loader.load(texture),
    });
    const planetMesh = new THREE.Mesh(planetgeometry, planetmaterial);
    planetMesh.position.set(...position);
    planetMesh.layers.set(0);
    planetMesh.name = name;
    scene.add(planetMesh);
    return planetMesh;
}

export function createOrbitPath(radius, segments, scene) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0, z));
    }
    const orbitgeometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbitmaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const orbitlineloop = new THREE.LineLoop(orbitgeometry, orbitmaterial);
    scene.add(orbitlineloop);
    return orbitlineloop;
}