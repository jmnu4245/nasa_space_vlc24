import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import Planeta from './src/Planeta.js';
// cameraControls.js
export function setupCameraControls(camera, renderer,planet) {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const movementSpeed = 0.1; // Velocidad de movimiento
    const zoomSpeed = 0.5; // Velocidad de zoom
    const minZoom = 1; // Distancia mínima de zoom
    const maxZoom = 100; // Distancia máxima de zoom
    const keyboard = {};
    let sphereRadius =planet.tamaño
    let sphereCenter =planet.posicion

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
    
            const movementScale = 0.005; // Controla la velocidad de rotación
    
            theta += deltaMove.x * movementScale; // Rotación en Y
            phi -= deltaMove.y * movementScale; // Rotación en X
    
            // Limitar el ángulo phi para evitar voltear la cámara
            const maxPhi = Math.PI / 2 - 0.1; // Máximo 90 grados
            const minPhi = -Math.PI / 2 + 0.1; // Mínimo -90 grados
            phi = Math.max(minPhi, Math.min(maxPhi, phi));
    
            // Actualizar la posición de la cámara
            updateCameraPosition();
        }
    
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    // Función para actualizar la posición de la cámara
    //*function updateCameraPosition() {
        // Convertir coordenadas esféricas a cartesianas
       // camera.position.x = sphereCenter.x + sphereRadius * Math.sin(phi) * Math.cos(theta);
       // camera.position.y = sphereCenter.y + sphereRadius * Math.cos(phi);
       // camera.position.z = sphereCenter.z + sphereRadius * Math.sin(phi) * Math.sin(theta);
        
        // Hacer que la cámara mire hacia el centro de la esfera
       // camera.lookAt(sphereCenter);
    }
    function updateCameraPosition() {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi);
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        
        // Para verificar las posiciones
        console.log('Posición de la cámara:', camera.position);
        
        camera.lookAt(center); // Asegúrate de que la cámara siempre mire hacia el centro
    }

    // Manejar el movimiento con teclas
    window.addEventListener('keydown', (event) => {
        keyboard[event.key] = true; // Marca la tecla como presionada
    });

    window.addEventListener('keyup', (event) => {
        keyboard[event.key] = false; // Marca la tecla como no presionada
    });

    // Manejar el zoom con el scroll del mouse
    //window.addEventListener('wheel', (event) => {
        // Evitar el comportamiento predeterminado del scroll
      //  event.preventDefault();
    
        // Calcular la dirección en la que la cámara está mirando
        //const direction = new THREE.Vector3();
       // camera.getWorldDirection(direction);
    
        // Ajustar el zoom
        //let zoomDelta = event.deltaY * zoomSpeed; // Zoom basado en el desplazamiento del mouse
    
        // Actualizar la posición de la cámara en la dirección del zoom
        //const newCameraPosition = camera.position.clone().addScaledVector(direction, zoomDelta);
        
        // Calcular la nueva distancia desde el centro
        //const distance = newCameraPosition.distanceTo(sphereCenter);
    
        // Limitar el zoom entre los valores mínimo y máximo
        //if (distance > minZoom && distance < maxZoom) {
          //  camera.position.copy(newCameraPosition);
        //} else if (distance <= minZoom) {
          //  camera.position.copy(direction.normalize().multiplyScalar(minZoom).add(sphereCenter));
       // } else if (distance >= maxZoom) {
         //   camera.position.copy(direction.normalize().multiplyScalar(maxZoom).add(sphereCenter));
       // }
    
        // Asegurarse de que la cámara siempre mire hacia el centro de la esfera
        //camera.lookAt(sphereCenter);
    //});

    // Función para actualizar la posición de la cámara
    

    // Función de animación
    function animate() {
        requestAnimationFrame(animate);
    }

    // Iniciar la animación
    animate();
