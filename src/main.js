import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { setupCameraControls } from './cameracontrol.js';
import Planeta from './Planeta.js';
import Anillos from './Anillos.js';
import CelestialBody from '../asteroides/CelestialBody.js';

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 15000);
camera.position.z = 100;

// Fondo
const loader = new THREE.TextureLoader();
loader.load('./../entorno/fondo_8k.jpg', function(texture) {
    const geometry = new THREE.SphereGeometry(7000, 100, 100); // Tamaño grande
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
const TIME_SCALE = 0.01;      // Factor de escala para el tiempo

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
const tiempoTotalOrbita = [
    0,  // Sol (rotación)
    87.97,  // Mercurio (traslación)
    224.70, // Venus (traslación)
    365.25, // Tierra (traslación)
    686.98, // Marte (traslación)
    4332.59, // Júpiter (traslación)
    10759.22, // Saturno (traslación)
    30685.49, // Urano (traslación)
    60190.03  // Neptuno (traslación)
];
         // Sol lo pongo para poder iterar bien
    
const celestialbodies = [
    new CelestialBody('0', 'Sol', 0, 0, 0, 0, 0, 0, 0, 0, 0),
    new CelestialBody('1', 'Mercurio', 0.2056, 0.387, 0.3075, 7.0, 48.3, 29.1, 174.8, 0, 4.15),
    new CelestialBody('2', 'Venus', 0.0068, 0.723, 0.718, 3.4, 76.7, 54.9, 50.1, 0, 1.62),
    new CelestialBody('3', 'Tierra', 0.0167, 1.000, 0.983, 0.0, 0.0, 102.9, 357.5, 0, 0.99),
    new CelestialBody('4', 'Marte', 0.0934, 1.524, 1.381, 1.9, 49.6, 286.5, 19.4, 0, 0.53),
    new CelestialBody('5', 'Júpiter', 0.0484, 5.203, 4.951, 1.3, 100.5, 273.9, 20.0, 0, 0.08),
    new CelestialBody('6', 'Saturno', 0.0542, 9.537, 9.020, 2.5, 113.7, 339.4, 317.0, 0, 0.03),
    new CelestialBody('7', 'Urano', 0.0472, 19.191, 18.286, 0.8, 74.0, 96.9, 142.2, 0, 0.01),
    new CelestialBody('8', 'Neptuno', 0.0086, 30.069, 29.819, 1.8, 131.8, 273.2, 256.2, 0, 0.006)
];

let planetas = Array(9).fill(0);
let sphere = Array(9).fill(0);
let numPuntosOrbita = 10000;
let orbitas = Array(8).fill(0); // Solo 8 órbitas, una por planeta (excluyendo el Sol)

for (let i = 0; i < 9; i++) {
    let planeta = new Planeta(size[i], posIni[i], texturas[i], velocidadRotacion[i]);
    planetas[i] = planeta;
    sphere[i] = planetas[i].setPlaneta();
    if (i !== 0) {
        if (i ==8) {
            numPuntosOrbita *= 100;
        }
        orbitas[i-1] = crearOrbita(celestialbodies[i], numPuntosOrbita, SCALE_DISTANCE, tiempoTotalOrbita[i]);
        scene.add(orbitas[i-1]);
    }
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




// main.js
let n_planetasel = 0; // Variable para almacenar el índice del planeta seleccionado (inicialmente -1)
console.log(n_planetasel);
// Movimiento Camara planeta
let selectedplanet=planetas[n_planetasel];
let rSelPlanet=selectedplanet.tamaño;
let posSelPlanet=selectedplanet.posicion;


setupCameraControls(camera, renderer, scene, rSelPlanet,posSelPlanet);

// Evento de clic
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Animation loop
let tiempo = 0;
function animate() {
    requestAnimationFrame(animate);

    for (let i = 0; i < planetas.length; i++) {
        sphere[i].rotation.y += planetas[i].velocidadRotacion;
        actualizarPosicionPlanetas(celestialbodies, sphere, tiempo);
    }
    
    tiempo += TIME_SCALE;
    // Renderizar la escena
    renderer.render(scene, camera);
}
animate();

function crearOrbita(cuerpoCeleste, numPuntos, escala, tiempoTotal) {
    const puntos = []; 

    for (let i = 0; i <= numPuntos; i++) {
        let t = (i / numPuntos) * tiempoTotal;
        let [x, y, z] = cuerpoCeleste.xyz_orbita_plano_ecliptica(t);
        puntos.push(new THREE.Vector3(x * escala, y * escala, z * escala));
    }

    const geometria = new THREE.BufferGeometry().setFromPoints(puntos);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const orbita = new THREE.Line(geometria, material);

    return orbita;
}

function actualizarPosicionPlanetas(cuerposCelestes, esferas, tiempo) {
    for (let i = 1; i < cuerposCelestes.length; i++) { // Empezar desde 1 para omitir el Sol
        const [x, y, z] = cuerposCelestes[i].xyz_orbita_plano_ecliptica(tiempo);
        esferas[i].position.set(x * SCALE_DISTANCE, y * SCALE_DISTANCE, z * SCALE_DISTANCE);
    }
}