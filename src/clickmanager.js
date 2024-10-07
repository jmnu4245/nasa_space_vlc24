import Planeta from Planeta.js

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