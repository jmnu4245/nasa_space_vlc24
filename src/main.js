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
    TIME_SCALE = parseFloat(savedSpeed) / (60*60); // Convertir días por minuto a días por segundo teniendo en cuenta la frecuencia del animate
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
const velocidadRotacion = tiempoTotalOrbita.map(dias => (2 * Math.PI) / (dias / TIME_SCALE)); // con esta velocidad de rotación no da vueltas

const celestialbodies = [
    new CelestialBody('0', 'Sol', 0, 0, 0, 0, 0, 0, 0, 0, 0, 24),
    new CelestialBody('1', 'Mercurio', 0.2056, 0.387, 0.3075, 7.0, 48.3, 77, 252.25, 0, 4.15, 58.6),
    new CelestialBody('2', 'Venus', 0.0068, 0.723, 0.718, 3.4, 76.7, 131.6, 181.98, 0, 1.62, -243), //rotación retrógrada
    new CelestialBody('3', 'Tierra', 0.0167, 1.000, 0.983, 0.0, 0.0, 102.9, 100.46, 0, 0.99, 1),
    new CelestialBody('4', 'Marte', 0.0934, 1.524, 1.381, 1.9, 49.6, -23.96, -4.55, 0, 0.53, 1.03 ),
    new CelestialBody('5', 'Júpiter', 0.0484, 5.203, 4.951, 1.3, 100.5, 14.73, 34.40, 0, 0.08, 0.41),
    new CelestialBody('6', 'Saturno', 0.0542, 9.537, 9.020, 2.5, 113.7, 92.6, 49.95, 0, 0.03, 0.45),
    new CelestialBody('7', 'Urano', 0.0472, 19.191, 18.286, 0.8, 74.0, 170.95, 313.24, 0, 0.01, -0.72), //rotación retrógrada
    new CelestialBody('8', 'Neptuno', 0.0086, 30.069, 29.819, 1.8, 131.8, 44.96, -55.12, 0, 0.006, 0.67)
];
const color = [
  0xffe59e, // Sol (amarillo suave)
  0xc2c2c2, // Mercurio (gris suave)
  0xffd5a0, // Venus (naranja muy suave)
  0xa3c1e0, // Tierra (azul suave)
  0xffb3b3, // Marte (rojo suave)
  0xffd5a0, // Júpiter (naranja muy suave)
  0xffe59e, // Saturno (amarillo suave)
  0xb3e0e0, // Urano (cyan suave)
  0xa3c1e0  // Neptuno (azul suave)
];



// asteroides y cometas


let planetas = Array(9).fill(0);
let sphere = Array(9).fill(0);
let numPuntosOrbita = 10000; 
let orbitas = Array(8).fill(0); // Solo 8 órbitas, una por planeta (excluyendo el Sol)



for (let i = 0; i < 9; i++) {
    let planeta = new Planeta(size[i], posIni[i], texturas[i], velocidadRotacion[i]);
    planetas[i] = planeta;
    sphere[i] = planetas[i].setPlaneta();
    
    let T = celestialbodies[i].calcular_T();
    orbitas[i-1] = crearOrbita(celestialbodies[i], numPuntosOrbita, SCALE_DISTANCE, T, color[i]);
    scene.add(orbitas[i-1]);
    
    scene.add(sphere[i]);
}

// Crear los anillos de Saturno y añadirlos como hijos de Saturno
let anillosSaturno = new Anillos(sphere[6], '../texturas/anillo_saturno.jpg', size[6]);

// Crear luces

// Luz ambiental suave

const ambientLight = new THREE.AmbientLight(0x404040); 
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


// Movement of camera

// Selecction of planet from localStorage
let n_planetasel = localStorage.getItem('n_planetasel') ? parseInt(localStorage.getItem('n_planetasel')) : 0; // Carga el valor del localStorage o establece 0 si no existe
console.log(n_planetasel);
// Camera parameters
let selectedplanet = planetas[n_planetasel];
let radius = selectedplanet.tamaño;
let posSelPlanet = selectedplanet.posicion;
let center =new THREE.Vector3(posSelPlanet[0],posSelPlanet[1],posSelPlanet[2]); // Center of the followed planet
let theta = 0; //XY-plane initial angle
let phi = Math.PI/2; // Z-plane initial angle


// Animation loop
let tiempo = calcularDiaJulianoActual();
animate();


function animate() {
    requestAnimationFrame(animate);
    //planets spin
    for (let i = 0; i < planetas.length; i++) {
        actualizarPosicionPlanetas(celestialbodies, sphere, tiempo);
        sphere[i].rotation.y += celestialbodies[i].calcular_n_rot()*TIME_SCALE;
       
    }
    let fecha = julianToDate(tiempo);
    document.getElementById('dia').innerHTML = tiempo.toFixed(2);
    document.getElementById('fecha').innerHTML = fecha;
    tiempo += TIME_SCALE;
    

    posSelPlanet = selectedplanet.posicion;
    center =sphere[n_planetasel].position;
    
    updateCameraPosition(camera,center,radius,phi,theta);
    renderer.render(scene, camera);
}

function julianToDate(diaJuliano) {
  // Constantes del calendario juliano
  let j = diaJuliano + 0.5;
  let z = Math.floor(j);
  let f = j - z;

  let A;
  if (z < 2299161) {
      A = z;
  } else {
      let alpha = Math.floor((z - 1867216.25) / 36524.25);
      A = z + 1 + alpha - Math.floor(alpha / 4);
  }

  let B = A + 1524;
  let C = Math.floor((B - 122.1) / 365.25);
  let D = Math.floor(365.25 * C);
  let E = Math.floor((B - D) / 30.6001);

  // Cálculo del día, mes y año
  let dia = B - D - Math.floor(30.6001 * E) + f;
  let mes = (E < 14) ? E - 1 : E - 13;
  let año = (mes > 2) ? C - 4716 : C - 4715;

  // Nombres abreviados de los meses
  const mesesAbreviados = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  
  // Formatear el resultado en "Día Mes (abreviado) Año"
  return `${Math.floor(dia)} ${mesesAbreviados[mes - 1]} ${año}`;
}


function calcularDiaJulianoActual() {
  const fechaActual = new Date();
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth() + 1; // Los meses comienzan en 0
  const dia = fechaActual.getDate();

  // Algoritmo para calcular el día juliano
  const A = Math.floor((14 - mes) / 12);
  const Y = anio + 4800 - A;
  const M = mes + 12 * A - 3;

  const diaJuliano = dia + Math.floor((153 * M + 2) / 5) + (365 * Y) + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
  return diaJuliano;
}




function crearOrbita(cuerpoCeleste, numPuntos, escala, T, color) {
    const puntos = []; 

    let t = 0;
    for (let i = 0; i <= numPuntos; i++) {
        const t =+ (i / numPuntos) * (T);
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




//------------------------------------------------------------------------

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let minZoom = 4 * radius;
let maxZoom = radius * 100; // Max and min zoom
radius = radius * 5; // Initial radius of the sphere
let zoomSpeed = 0.005 * radius; // Zoom speed
let movementScale = 0.02 / radius;
let previousTouchPosition = { x: 0, y: 0 };
let initialPinchDistance = null; // Used for pinch zoom



// Helper function to get the distance between two touch points
function getTouchDistance(touch1, touch2) {
  const dx = touch1.pageX - touch2.pageX;
  const dy = touch1.pageY - touch2.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}



// Handle mouse events for desktop
window.addEventListener('mousedown', (event) => {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y,
    };

    theta += deltaMove.x * movementScale; // Y-axis rotation
    phi -= deltaMove.y * movementScale; // X-axis rotation

    // Clamp phi angle to avoid flipping the camera
    const maxPhi = Math.PI - 0.1;
    const minPhi = 0.1;
    phi = Math.max(minPhi, Math.min(maxPhi, phi));

    updateCameraPosition(camera, center, radius, phi, theta);
    previousMousePosition = { x: event.clientX, y: event.clientY };
  }
});

// Handle zoom with mouse wheel
window.addEventListener('wheel', (event) => {
  event.preventDefault();
  radius += event.deltaY * zoomSpeed;
  radius = Math.max(minZoom, Math.min(maxZoom, radius));
  updateCameraPosition(camera, center, radius, phi, theta);
});

// Handle touch events for mobile

// Start touch (similar to mousedown)
window.addEventListener('touchstart', (event) => {
  if (event.touches.length === 1) { // Single finger for dragging
    isDragging = true;
    previousTouchPosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  } else if (event.touches.length === 2) { // Two fingers for pinch zoom
    isDragging = false; // Disable dragging while pinching
    initialPinchDistance = getTouchDistance(event.touches[0], event.touches[1]);
  }
});

// Touch move (similar to mousemove)
window.addEventListener('touchmove', (event) => {
  event.preventDefault();
  if (isDragging && event.touches.length === 1) {
    const currentTouch = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };

    const deltaMove = {
      x: currentTouch.x - previousTouchPosition.x,
      y: currentTouch.y - previousTouchPosition.y,
    };

    theta += deltaMove.x * movementScale; // Y-axis rotation
    phi -= deltaMove.y * movementScale; // X-axis rotation

    // Clamp phi angle to avoid flipping the camera
    const maxPhi = Math.PI - 0.1;
    const minPhi = 0.1;
    phi = Math.max(minPhi, Math.min(maxPhi, phi));

    updateCameraPosition(camera, center, radius, phi, theta);
    previousTouchPosition = { x: currentTouch.x, y: currentTouch.y };
  } else if (event.touches.length === 2) { // Pinch-to-zoom
    const newPinchDistance = getTouchDistance(event.touches[0], event.touches[1]);
    if (initialPinchDistance !== null) {
      const pinchDelta = newPinchDistance - initialPinchDistance;
      radius -= pinchDelta * zoomSpeed;
      radius = Math.max(minZoom, Math.min(maxZoom, radius));
      updateCameraPosition(camera, center, radius, phi, theta);
    }
    initialPinchDistance = newPinchDistance; // Update for next move
  }
});

// End touch (similar to mouseup)
window.addEventListener('touchend', (event) => {
  if (event.touches.length === 0) {
    isDragging = false;
    initialPinchDistance = null;
  }
});
const mouse = new THREE.Vector2();

const raycaster = new THREE.Raycaster();
window.addEventListener('click', (event) => {
  // Calcular las coordenadas del mouse en espacio NDC (-1 a 1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Proyectar un rayo desde la cámara hacia la escena, basado en la posición del mouse
  raycaster.setFromCamera(mouse, camera);

  // Calcular los objetos intersectados por el rayo
  const intersects = raycaster.intersectObjects(scene.children);

  // Si hay intersecciones
  if (intersects.length > 0) {
      // Cambiar el color del primer objeto intersectado (en este caso, el planeta)
      if(intersects[0].object instanceof Planeta){
          sidebar.classList.add('open');
      }
      console.log(intersects[0].object);
  }
});
