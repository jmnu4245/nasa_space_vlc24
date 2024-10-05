import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// cameraControls.js
export function setupCameraControls(camera, renderer) {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const movementSpeed = 0.1; // Velocidad de movimiento
    const zoomSpeed = 0.5; // Velocidad de zoom
    const minZoom = 1; // Distancia mínima de zoom
    const maxZoom = 100; // Distancia máxima de zoom
    const keyboard = {};

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
    
            camera.rotation.y += deltaMove.x * movementScale; // Rotación en Y
            camera.rotation.x += deltaMove.y * movementScale; // Rotación en X
    
            // Limitar la rotación en el eje X (evitar voltear la cámara)
            const maxRotationX = Math.PI / 2; // Máximo 90 grados
            const minRotationX = -Math.PI / 2; // Mínimo -90 grados
            camera.rotation.x = Math.max(minRotationX, Math.min(maxRotationX, camera.rotation.x));
        }
    
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    

    // Manejar el movimiento con teclas
    window.addEventListener('keydown', (event) => {
        keyboard[event.key] = true; // Marca la tecla como presionada
    });

    window.addEventListener('keyup', (event) => {
        keyboard[event.key] = false; // Marca la tecla como no presionada
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
        if (keyboard['w']) {
            camera.position.z -= movementSpeed * Math.cos(camera.rotation.y); // Avanzar hacia adelante
            camera.position.x -= movementSpeed * Math.sin(camera.rotation.y);
        }
        if (keyboard['s']) {
            camera.position.z += movementSpeed * Math.cos(camera.rotation.y); // Retroceder
            camera.position.x += movementSpeed * Math.sin(camera.rotation.y);
        }
        if (keyboard['a']) {
            camera.position.x -= movementSpeed * Math.cos(camera.rotation.y); // Mover a la izquierda
            camera.position.z += movementSpeed * Math.sin(camera.rotation.y);
        }
        if (keyboard['d']) {
            camera.position.x += movementSpeed * Math.cos(camera.rotation.y); // Mover a la derecha
            camera.position.z -= movementSpeed * Math.sin(camera.rotation.y);
        }
    }

    // Función de animación
    function animate() {
        requestAnimationFrame(animate);
        updateCameraPosition();
    }

    // Iniciar la animación
    animate();
}
