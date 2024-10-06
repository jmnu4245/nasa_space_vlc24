import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { setupCameraControls } from './cameracontrol.js';
import Planeta from './Planeta.js';
import Anillos from './Anillos.js';

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 100;

// Fondo
const loader = new THREE.TextureLoader();
loader.load('./../entorno/fondo.jpg', function(texture) {
    const geometry = new THREE.SphereGeometry(500, 1000, 1000); // Tamaño grande
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }); // Invierte las normales
    const skybox = new THREE.Mesh(geometry, material);
    scene.add(skybox);
});

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
    [9.58 * SCALE_DISTANCE, 0, 0],         // Saturno 9.58
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


const VEL_SCALE = 0.000184; // Factor de escala para las velocidades,0.000184 1 vuelta por minuto
const velocidadRotacion = [
    0.0394 * VEL_SCALE, 
    0.0171 * VEL_SCALE, 
    -0.0041 * VEL_SCALE, 
    1.0 * VEL_SCALE, 
    0.9756 * VEL_SCALE, 
    2.4242 * VEL_SCALE, 
    2.2429 * VEL_SCALE, 
    -1.3953 * VEL_SCALE, 
    1.4907 * VEL_SCALE
];
let planetas = Array(9).fill(0);
let sphere = Array(9).fill(0);



for (let i = 0; i < 9; i++) {
    let planeta = new Planeta(size[i], posIni[i], texturas[i], velocidadRotacion[i]);
    planetas[i] = planeta;
    sphere[i] = planetas[i].setPlaneta();
    scene.add(sphere[i]);
}

// Crear los anillos de Saturno y añadirlos como hijos de Saturno
let anillosSaturno = new Anillos(sphere[6], '../texturas/anillo_saturno.jpg', size[6]);



// Crear luz
let intensity1=1;
const sunLight = new THREE.DirectionalLight(0xffffff, intensity1); // Luz blanca con intensidad 1
sunLight.position.set(0, 0, 0); // La luz en la misma posición que el sol
scene.add(sunLight);
// Crear una fuente de luz puntual en la misma posición que el sol

// Opcional: Añadir una luz ambiental suave para no tener sombras demasiado oscuras
const ambientLight = new THREE.AmbientLight(0x404040);  // Luz ambiental suave
scene.add(ambientLight);

//iluminaciónsol
const radiussol = 20; // Radio del sol, ajustable dinámicamente

const intensity = 1;
const distance = 1000;
const penumbra = 0.4;

// Función para crear y agregar un Spotlight a la escena
function createSpotLight(position) {
    const spotLight = new THREE.SpotLight(0xffffff, intensity);
    spotLight.position.set(position.x, position.y, position.z); // Posición
    spotLight.target.position.set(0, 0, 0); // Apuntar al centro del sol
    spotLight.penumbra = penumbra; // Difuminado en los bordes
    spotLight.distance = distance; // Distancia a la que afecta la luz
    scene.add(spotLight);
    scene.add(spotLight.target);
}

createSpotLight({ x: 0, y: radiussol * 2, z: 0 });
// Desde abajo
createSpotLight({ x: 0, y: -radiussol * 2, z: 0 });
// Desde la izquierda
createSpotLight({ x: -radiussol * 2, y: 0, z: 0 });
// Desde la derecha
createSpotLight({ x: radiussol * 2, y: 0, z: 0 });
// Desde el frente
createSpotLight({ x: 0, y: 0, z: radiussol * 2 });
// Desde atrás
createSpotLight({ x: 0, y: 0, z: -radiussol * 2 });



// Movimiento Camara planeta
let selectedplanet=planetas[3];
;
let rSelPlanet=selectedplanet.tamaño;
let posSelPlanet=selectedplanet.posicion;


setupCameraControls(camera, renderer, scene, rSelPlanet,posSelPlanet);

// Evento de clic
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    sol.rotation.y+=velocidadRotacion[0];
    for (let i = 0; i < planetas.length; i++) {
        sphere[i].rotation.y += planetas[i].velocidadRotacion;
    }

    // Renderizar la escena
    renderer.render(scene, camera);
}
animate();
