import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// cameraControls.js
export function setupCameraControls(camera, renderer, scene, rselPlanet, posSelPlanet) {
    console.log(rselPlanet);
    console.log(posSelPlanet);
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let minZoom = 4*rselPlanet;let maxZoom = rselPlanet*100; //Máx y min de zoom
     //velocidad de rotación
    let radius = rselPlanet*5; // Radio inicial de la esfera
    let theta = 0; // Ángulo inicial en el plano XY
    let phi = Math.PI/2; // Ángulo inicial en el plano Z
    let center =new THREE.Vector3(posSelPlanet[0],posSelPlanet[1],posSelPlanet[2]);
    
    let zoomSpeed = 0.005*radius; // Velocidad de zoom
    let movementScale = 0.02/radius ;

    // Función para actualizar la posición de la cámara
    function updateCameraPosition() {
        camera.position.x = center.x+ radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = center.y+ radius * Math.cos(phi);
        camera.position.z = center.z+ radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(center); // Siempre mirar al centro
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
            const maxPhi = Math.PI -0.1; // Máximo 180 grados
            const minPhi =  0.1; // Mínimo 0 grados
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