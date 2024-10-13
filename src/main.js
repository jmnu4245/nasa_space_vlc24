import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { calcularDiaJulianoActual , julianToDate} from './julianthings.js';
import {updateCameraPosition} from './cameracontrol.js';
import Anillos from './Anillos.js';
import CelestialBody from './CelestialBody.js';
import { setupLighting } from './lights.js';

//Inicializar escena
const scene = new THREE.Scene();
  // Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200000); // Aumentar la distancia de recorte
  // Fondo
const loader = new THREE.TextureLoader();
loader.load('../texturas/fondo_8k.jpg', function(texture) {
    const geometry = new THREE.SphereGeometry(100000, 100, 100); // Aumentar el tamaño del skybox
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }); // Invierte las normales
    const skybox = new THREE.Mesh(geometry, material);
    scene.add(skybox);
});

  // Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
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
//creamos los planetaso, objetos que nos darán los métodos para calcular lás orbitas
const planetaso = [
    new CelestialBody('0',0, 'Sol', 0, 0, 0, 0, 0, 0, 0, 0, 0, 24),
    new CelestialBody('1',1 ,'Mercurio', 0.2056, 0.387, 0.3075, 7.0, 48.3, 77, 252.25, 0, 4.15, 58.6),
    new CelestialBody('2', 2,'Venus', 0.0068, 0.723, 0.718, 3.4, 76.7, 131.6, 181.98, 0, 1.62, -243), //rotación retrógrada
    new CelestialBody('3', 3,'Tierra', 0.0167, 1.000, 0.983, 0.0, 0.0, 102.9, 100.46, 0, 0.99, 1),
    new CelestialBody('4',4 ,'Marte', 0.0934, 1.524, 1.381, 1.9, 49.6, -23.96, -4.55, 0, 0.53, 1.03 ),
    new CelestialBody('5',5 ,'Júpiter', 0.0484, 5.203, 4.951, 1.3, 100.5, 14.73, 34.40, 0, 0.08, 0.41),
    new CelestialBody('6',6 ,'Saturno', 0.0542, 9.537, 9.020, 2.5, 113.7, 92.6, 49.95, 0, 0.03, 0.45),
    new CelestialBody('7',7 ,'Urano', 0.0472, 19.191, 18.286, 0.8, 74.0, 170.95, 313.24, 0, 0.01, -0.72), //rotación retrógrada
    new CelestialBody('8',8 ,'Neptuno', 0.0086, 30.069, 29.819, 1.8, 131.8, 44.96, -55.12, 0, 0.006, 0.67)
];
let sphere = Array(9).fill(0);
let orbitas = Array(8).fill(0); // Solo 8 órbitas, una por planeta (excluyendo el Sol)
for (let i = 0; i < 9; i++) {
    sphere[i] = planetaso[i].getPlaneta();
    scene.add(sphere[i]);
    //Para cada planeta, calculamos su Periodo
    let T = planetaso[i].calcular_T();
    //Para cada órbita, calculamos su órbita
    orbitas[i-1] = planetaso[i].crearOrbita(T, i);
    scene.add(orbitas[i-1]);
}
// Crear los anillos de Saturno y añadirlos como hijos de Saturno
let anillosSaturno = new Anillos(sphere[6], '../texturas/anillo_saturno.jpg', 58232 * 0.00001436);
anillosSaturno.setAnillos();
// Crear luces
setupLighting(scene, {
  ambientColor: 0x404040, // Color de luz ambiental
  radiusSun: 696340 * 0.00001436*1.5,          // Radio del sol
  spotLightOptions: {
      intensity: 1,           // Intensidad del spotlight
      distance: 1000,         // Distancia del spotlight
      penumbra: 0.4           // Penumbra del spotlight
  }
});
// Selecction of planet from localStorage
let n_planetasel = localStorage.getItem('n_planetasel') ? parseInt(localStorage.getItem('n_planetasel')) : 0; // Carga el valor del localStorage o establece 0 si no existe
console.log(n_planetasel);
// Camera parameters
let selectedplanet = planetaso[n_planetasel];
let radius = selectedplanet.tamaño;
let posSelPlanet = selectedplanet.posicion;
let cameraData = {
  center: new THREE.Vector3(posSelPlanet[0], posSelPlanet[1], posSelPlanet[2]), // Centro del planeta
  theta: 0, // Ángulo inicial en el plano XY
  phi: Math.PI / 2 // Ángulo inicial en el plano Z
};
// Animation loop
let tiempo = calcularDiaJulianoActual();
animate();
function animate() {
    requestAnimationFrame(animate);
    //planets spin
    for (let i = 0; i < planetaso.length; i++) {
        planetaso[i].actualizarPosicionPlanetas(tiempo) ;
        planetaso[i].actualizarRotacionPlanetas() ;
    }
    let fecha = julianToDate(tiempo);
    document.getElementById('dia').innerHTML = tiempo.toFixed(2);
    document.getElementById('fecha').innerHTML = fecha;
    tiempo += TIME_SCALE;
    
    posSelPlanet = selectedplanet.posicion;
    cameraData.center =sphere[n_planetasel].position;
     
    updateCameraPosition(camera,cameraData,radius);
    renderer.render(scene, camera);
}

//------------------------------------------------------------------------(no tocar)

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
  window.addEventListener('mousedown', (event) => {
    console.log("dragging");
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
  
      cameraData.theta += deltaMove.x * movementScale; // Y-axis rotation
      cameraData.phi -= deltaMove.y * movementScale; // X-axis rotation
  
      // Clamp phi angle to avoid flipping the camera
      const maxPhi = Math.PI - 0.1;
      const minPhi = 0.1;
      cameraData.phi = Math.max(minPhi, Math.min(maxPhi, cameraData.phi));
  
      updateCameraPosition(camera, cameraData, radius);
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  });


// Handle zoom with mouse wheel
window.addEventListener('wheel', (event) => {
  event.preventDefault();
  radius += event.deltaY * zoomSpeed;
  radius = Math.max(minZoom, Math.min(maxZoom, radius));
  updateCameraPosition(camera, camearData, radius);
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

    cameraData.theta += deltaMove.x * movementScale; // Y-axis rotation
    cameraData.phi -= deltaMove.y * movementScale; // X-axis rotation

    // Clamp phi angle to avoid flipping the camera
    const maxPhi = Math.PI - 0.1;
    const minPhi = 0.1;
    cameraData.phi = Math.max(minPhi, Math.min(maxPhi, cameraData.phi));

    updateCameraPosition(camera, cameraData, radius);
    previousTouchPosition = { x: currentTouch.x, y: currentTouch.y };
  } else if (event.touches.length === 2) { // Pinch-to-zoom
    const newPinchDistance = getTouchDistance(event.touches[0], event.touches[1]);
    if (initialPinchDistance !== null) {
      const pinchDelta = newPinchDistance - initialPinchDistance;
      radius -= pinchDelta * zoomSpeed;
      radius = Math.max(minZoom, Math.min(maxZoom, radius));
      updateCameraPosition(camera, cameraData, radius);
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