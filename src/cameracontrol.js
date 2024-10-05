import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// cameraControls.js
export function setupCameraControls(camera, renderer,scene) {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const zoomSpeed = 0.5; // Velocidad de zoom
    const minZoom = 10; // Distancia mínima de zoom
    const maxZoom = 100; // Distancia máxima de zoom
    const movementScale = 0.005; // Controla la velocidad de rotación
    let radius = 60; // Radio inicial de la esfera
    let theta = 0; // Ángulo inicial en el plano XY
    let phi = 0; // Ángulo inicial en el plano Z

    // Función para actualizar la posición de la cámara
    function updateCameraPosition() {
        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(new THREE.Vector3(0, 0, 0)); // Siempre mirar al centro
    }

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
            const maxPhi = Math.PI / 2 - 0.1; // Máximo 90 grados
            const minPhi = -Math.PI / 2 + 0.1; // Mínimo -90 grados
            phi = Math.max(minPhi, Math.min(maxPhi, phi));

            // Actualizar la posición de la cámara
            updateCameraPosition();
        }

        previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    // Manejar el zoom con el scroll del mouse
    window.addEventListener('wheel', (event) => {
        event.preventDefault();
        radius += event.deltaY * zoomSpeed;
        radius = Math.max(minZoom, Math.min(maxZoom, radius));
        updateCameraPosition();
    });

    // Inicializar la posición de la cámara
    updateCameraPosition();

    // Función de animación
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    // Iniciar la animación
    animate();
}