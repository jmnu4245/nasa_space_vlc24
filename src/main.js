import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import {updateCameraPosition} from './cameracontrol.js';
import Planeta from './Planeta.js';
import Anillos from './Anillos.js';
import CelestialBody from '../asteroides/CelestialBody.js';

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200000); // Aumentar la distancia de recorte
camera.position.z = 100;

// Fondo
const loader = new THREE.TextureLoader();
loader.load('./../entorno/fondo_8k.jpg', function(texture) {
    const geometry = new THREE.SphereGeometry(100000, 100, 100); // Aumentar el tamaño del skybox
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
let TIME_SCALE = 0.001;      // Valor inicial

// Recuperar la velocidad de la simulación desde localStorage
const savedSpeed = localStorage.getItem('simulationSpeed');
if (savedSpeed) {
    TIME_SCALE = parseFloat(savedSpeed) / (60 * 60); // Convertir días por minuto a días por segundo
    document.getElementById('speed-range').value = savedSpeed;
    document.getElementById('speed-value').textContent = savedSpeed;
    console.log(`Loaded speed: ${savedSpeed}`);
}

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

const tiempoTotalOrbita = [
    25.38,  // Sol (rotación)
    87.97,  // Mercurio (traslación)
    224.70, // Venus (traslación)
    365.25, // Tierra (traslación)
    686.98, // Marte (traslación)
    4332.59, // Júpiter (traslación)
    10759.22, // Saturno (traslación)
    30685.49, // Urano (traslación)
    60190.03  // Neptuno (traslación)
];

// Calcular la velocidad de rotación en función del período orbital
const velocidadRotacion = tiempoTotalOrbita.map(dias => (2 * Math.PI) / (dias / TIME_SCALE));

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
const color = [
    0xffff00, // Sol (no se usa)
    0xaaaaaa, // Mercurio
    0xffa500, // Venus
    0x0000ff, // Tierra
    0xff0000, // Marte
    0xffa500, // Júpiter
    0xffff00, // Saturno
    0x00ffff, // Urano
    0x0000ff  // Neptuno
];

let planetas = Array(9).fill(0);
let sphere = Array(9).fill(0);
let numPuntosOrbita = 10000; // Aumentar el número de puntos en las órbitas
let orbitas = Array(8).fill(0); // Solo 8 órbitas, una por planeta (excluyendo el Sol)

const JD_START = 2451544.5; // 1 de enero de 2000
const JD_END = 2451910.5;   // 31 de diciembre de 2000

for (let i = 0; i < 9; i++) {
    let planeta = new Planeta(size[i], posIni[i], texturas[i], velocidadRotacion[i]);
    planetas[i] = planeta;
    sphere[i] = planetas[i].setPlaneta();
    if (i !== 0) {
        if (i == 8) {
            numPuntosOrbita *= 100;
        }
        orbitas[i-1] = crearOrbita(celestialbodies[i], numPuntosOrbita, SCALE_DISTANCE, JD_START, JD_END, color[i]);
        scene.add(orbitas[i-1]);
    }
    scene.add(sphere[i]);
}

// Crear los anillos de Saturno y añadirlos como hijos de Saturno
let anillosSaturno = new Anillos(sphere[6], '../texturas/anillo_saturno.jpg', size[6]);

// Crear luz
const ambientLight = new THREE.AmbientLight(0x404040); // Luz ambiental suave
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
let n_planetasel = localStorage.getItem('n_planetasel') ? parseInt(localStorage.getItem('n_planetasel')) : 0; // Carga el valor del localStorage o establece 0 si no existe
console.log(n_planetasel);
// Movimiento Camara planeta
let selectedplanet = planetas[n_planetasel];
let radius = selectedplanet.tamaño;
let posSelPlanet = selectedplanet.posicion;
let center =new THREE.Vector3(posSelPlanet[0],posSelPlanet[1],posSelPlanet[2]);


let theta = 0; // Ángulo inicial en el plano XY
let phi = Math.PI/2; // Ángulo inicial en el plano Z

// Evento de clic
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Animation loop
let tiempo = JD_START;
function animate() {
    requestAnimationFrame(animate);

    for (let i = 0; i < planetas.length; i++) {
        sphere[i].rotation.y += planetas[i].velocidadRotacion;
        actualizarPosicionPlanetas(celestialbodies, sphere, tiempo);
    }
    tiempo += TIME_SCALE;
    posSelPlanet = selectedplanet.posicion;
    center =sphere[n_planetasel].position;
    
    updateCameraPosition(camera,center,radius,phi,theta);
    renderer.render(scene, camera);
}
animate();

function crearOrbita(cuerpoCeleste, numPuntos, escala, jdStart, jdEnd, color) {
    const puntos = []; 

    for (let i = 0; i <= numPuntos; i++) {
        const t = jdStart + (i / numPuntos) * (jdEnd - jdStart);
        const [x, y, z] = cuerpoCeleste.xyz_orbita_plano_ecliptica(t);
        puntos.push(new THREE.Vector3(x * escala, y * escala, z * escala));
    }

    const geometria = new THREE.BufferGeometry().setFromPoints(puntos);
    const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 }); // Asegurarse de que el material sea visible
    const orbita = new THREE.Line(geometria, material);

    return orbita;
}

function actualizarPosicionPlanetas(cuerposCelestes, esferas, tiempo) {
    for (let i = 1; i < cuerposCelestes.length; i++) { // Empezar desde 1 para omitir el Sol
        const [x, y, z] = cuerposCelestes[i].xyz_orbita_plano_ecliptica(tiempo);
        esferas[i].position.set(x * SCALE_DISTANCE, y * SCALE_DISTANCE, z * SCALE_DISTANCE);

    }
}
    let isDragging = false;    let previousMousePosition = { x: 0, y: 0 };    let minZoom = 4*radius;let maxZoom = radius*100; //Máx y min de zoom
    radius = radius*5; // Radio inicial de la esfera
    let zoomSpeed = 0.005*radius; // Velocidad de zoom
    let movementScale = 0.02/radius ;

    // Manejar eventos del mouse para la rotación
    window.addEventListener('mousedown', (event) => {
        isDragging = true;

    });

    window.addEventListener('mouseup', (event) => {
        isDragging = false;
    });

    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };
        
            theta += deltaMove.x * movementScale; // Rotación en Y
            phi -= deltaMove.y * movementScale; // Rotación en X

            // Limitar el ángulo phi para evitar voltear la cámara
            const maxPhi = Math.PI -0.1; // Máximo 180 grados
            const minPhi =  0.1; // Mínimo 0 grados
            phi = Math.max(minPhi, Math.min(maxPhi, phi));

            // Actualizar la posición de la cámara
            updateCameraPosition(camera,center,radius,phi,theta);
        }
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    // Manejar el zoom con el scroll del mouse
    window.addEventListener('wheel', (event) => {
        event.preventDefault();
        radius += event.deltaY * zoomSpeed;
        radius = Math.max(minZoom, Math.min(maxZoom, radius));
        updateCameraPosition(camera,center,radius,phi,theta);
    });