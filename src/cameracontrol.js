import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// cameraControls.js
export function setupCameraControls(camera, renderer) {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const zoomSpeed = 0.5; // Velocidad de zoom
    const minZoom = 1; // Distancia mínima de zoom
    const maxZoom = 100; // Distancia máxima de zoom
    const keyboard = {};
    radius=60;
    let theta=0;
    let phi=0;
    updateCameraPosition();
    // Manejar eventos del mouse para la rotación
    window.addEventListener('mousedown', (event) => {
        isDragging = true;
    });

    window.addEventListener('mouseup', (event) => {
        isDragging = false;
    });

    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaMove = {x: event.clientX - previousMousePosition.x,y: event.clientY - previousMousePosition.y};
    
            const movementScale = 0.005; // Controla la velocidad de rotación
            theta += deltaMove.x * movementScale; // Rotación en Y
            phi+= deltaMove.y * movementScale; // Rotación en X
        }
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    // Manejar el zoom con el scroll del mouse
    window.addEventListener('wheel', (event) => {
        // Evitar el comportamiento predeterminado del scroll
        event.preventDefault();
        // Calcular la dirección en la que la cámara está mirando
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        // Ajustar el zoom
        let zoomDelta = event.deltaY * zoomSpeed * 0.01;
        
        // Actualizamos la posición de la cámara en la dirección del zoom
        camera.position.addScaledVector(direction, zoomDelta);
        
        // Limitar el zoom entre los valores mínimo y máximo
        const distance = camera.position.length(); // Obtener la distancia desde el origen
        if (distance < minZoom) {
            camera.position.setLength(minZoom); // Limitar al zoom mínimo
        } else if (distance > maxZoom) {
            camera.position.setLength(maxZoom); // Limitar al zoom máximo
        }
    });

    // Función para actualizar la posición de la cámara
    function updateCameraPosition() {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi);
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        
        // Para verificar las posiciones
        console.log('Posición de la cámara:', camera.position);
        
        camera.lookAt(center); // Asegúrate de que la cámara siempre mire hacia el centro
    }

    // Función de animación
    function animate() {
        requestAnimationFrame(animate);
        updateCameraPosition();
    }

    // Iniciar la animación
    animate();
}