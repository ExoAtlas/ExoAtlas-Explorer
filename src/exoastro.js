import * as THREE from 'three';
import { ΔJ2000 } from './j2000calc.js';

export function keplerEquationSolver(M, e, tol = 1e-6) {
    let E = M;  // Initial guess
    while (true) {
        const E_new = E + (M + e * Math.sin(E) - E) / (1 - e * Math.cos(E));
        if (Math.abs(E_new - E) < tol) {
            break;
        }
        E = E_new;
    }
    return E;
}


export function calculateOrbitalPeriod(a) {
    const μ = 132712440018;  // Heliocentric gravitational parameter, km^3/s
    const period = 2 * Math.PI * Math.sqrt(Math.pow(a* 149597870.7, 3) / μ); // Period in seconds
    return period;
}

export function calculateStateVector(a, e, i, Ω, ω, M0, t0, t) {
    a = a * 149597870.7;  // AU to km
    i = THREE.MathUtils.degToRad(i);
    Ω = THREE.MathUtils.degToRad(Ω);
    ω = THREE.MathUtils.degToRad(ω);
    M0 = THREE.MathUtils.degToRad(M0);
    const μ = 132712440018;  // Heliocentric gravitational parameter, km^3/s
    const n = Math.sqrt(μ / Math.pow(a, 3));  // Mean motion, rad/s
    
    // Use ΔJ2000 to get time difference in days
    const Δt = ΔJ2000(t) - ΔJ2000(t0);
    const M = M0 + n * Δt * 86400;  // Mean anomaly at time t, using Δt in seconds

    // Solve Kepler's equation
    const E = keplerEquationSolver(M, e);
    
    // True anomaly
    const ν = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    
    // Distance
    const r = a * (1 - e * Math.cos(E));
    
    // Position in orbital plane
    const x_prime = r * Math.cos(ν);
    const y_prime = r * Math.sin(ν);
    
    // Rotation matrices
    const cos_Omega = Math.cos(Ω);
    const sin_Omega = Math.sin(Ω);
    const cos_omega = Math.cos(ω);
    const sin_omega = Math.sin(ω);
    const cos_i = Math.cos(i);
    const sin_i = Math.sin(i);
    
    // Position in inertial coordinates
    const x = ((cos_Omega * cos_omega - sin_Omega * sin_omega * cos_i) * x_prime + (-cos_Omega * sin_omega - sin_Omega * cos_omega * cos_i) * y_prime)/1000;
    const y = ((sin_Omega * cos_omega + cos_Omega * sin_omega * cos_i) * x_prime + (-sin_Omega * sin_omega + cos_Omega * cos_omega * cos_i) * y_prime)/1000;
    const z = ((sin_omega * sin_i) * x_prime + (cos_omega * sin_i) * y_prime)/1000;
    
    // Velocity in orbital plane
    const v_x_prime = -Math.sqrt(μ / a) * Math.sin(E) / (1 - e * Math.cos(E));
    const v_y_prime = Math.sqrt(μ / a) * Math.sqrt(1 - e * e) * Math.cos(E) / (1 - e * Math.cos(E));
    
    // Velocity in inertial coordinates
    const v_x = (cos_Omega * cos_omega - sin_Omega * sin_omega * cos_i) * v_x_prime + (-cos_Omega * sin_omega - sin_Omega * cos_omega * cos_i) * v_y_prime;
    const v_y = (sin_Omega * cos_omega + cos_Omega * sin_omega * cos_i) * v_x_prime + (-sin_Omega * sin_omega + cos_Omega * cos_omega * cos_i) * v_y_prime;
    const v_z = (sin_omega * sin_i) * v_x_prime + (cos_omega * sin_i) * v_y_prime;
    
    return {
        position: new THREE.Vector3(y, z, x),
        // position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(v_y, v_z, v_x)
    };
}

function updateOrbitingObject(a, e, i, Ω, ω, M0, t0, currentTime, object) {
    const { position, velocity } = calculateStateVector(a, e, i, Ω, ω, M0, t0, currentTime);
    object.position.copy(position);

    // For velocity, you might need to update the object's motion properties if you have a physics engine
    object.userData.velocity = velocity;
}