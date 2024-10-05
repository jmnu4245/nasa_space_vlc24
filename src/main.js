import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { setupCameraControls } from './cameracontrol.js';
import Planeta from './Planeta.js';

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;
camera.position.x = 2;
camera.position.y = 2;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a planet array
const texturas = [
    '../texturas/textura_sol.jpg',
    '../texturas/textura_mercurio.png',
    '../texturas/textura_venus.jpg',
    '../texturas/textura_tierra.jpg',
    '../texturas/textura_marte.jpg',
    '../texturas/textura_jupiter.jpg',
    '../texturas/textura_saturno.jpg',
    '../texturas/textura_urano.jpg',
    '../texturas/textura_neptuno.jpg'
];

const SCALE_SIZE = 0.00001436; // Factor de escala para los tamaños
const SCALE_DISTANCE = 50;    // Factor de escala para las distancias

const posIni = [
    [0, 0, 0],            // Sol
    [0.39 * SCALE_DISTANCE, 0, 0],         // Mercurio
    [0.72 * SCALE_DISTANCE, 0, 0],         // Venus
    [1.00 * SCALE_DISTANCE, 0, 0],         // Tierra
    [1.52 * SCALE_DISTANCE, 0, 0],         // Marte
    [5.20 * SCALE_DISTANCE, 0, 0],         // Júpiter
    [9.58 * SCALE_DISTANCE, 0, 0],         // Saturno
    [19.22 * SCALE_DISTANCE, 0, 0],        // Urano
    [30.05 * SCALE_DISTANCE, 0, 0]         // Neptuno
];

const size = [
    696340 * SCALE_SIZE,  // Sol
    2439.7 * SCALE_SIZE,  // Mercurio
    6051.8 * SCALE_SIZE,  // Venus
    6371.0 * SCALE_SIZE,  // Tierra
    3389.5 * SCALE_SIZE,  // Marte
    69911 * SCALE_SIZE,   // Júpiter
    58232 * SCALE_SIZE,   // Saturno
    25362 * SCALE_SIZE,   // Urano
    24622 * SCALE_SIZE    // Neptuno
];

const velocidadRotacion = [0.0394, 0.0171, -0.0041, 1.0, 0.9756, 2.4242, 2.2429, -1.3953, 1.4907];
let planetas = Array(9).fill(0);

for (let i = 0; i < 9; i++) {
    let planeta = new Planeta(size[i], posIni[i], texturas[i], velocidadRotacion[i]);
    planetas[i] = planeta;
    scene.add(planetas[i].setPlaneta());
}

// Create light
const ambientLight = new THREE.AmbientLight(0x404040); // Luz ambiental suave
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Camara
setupCameraControls(camera, renderer);

// Animación
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
