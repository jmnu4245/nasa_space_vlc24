import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import Planeta from './Planeta.js'; // Importar la clase Planeta

function createSphere() {
    // Crear la escena
    const scene = new THREE.Scene();

    // Crear una cámara
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Crear un renderizador
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Crear una instancia de Planeta
    const marte = new Planeta(1, [1, 0, 0], 'texturas/textura_marte.jpg');

    // Cargar la textura
    const textureLoader = new THREE.TextureLoader();
    const marsTexture = textureLoader.load(marte.textura);

    // Crear la geometría de la esfera
    const geometry = new THREE.SphereGeometry(marte.tamaño, 32, 32);

    // Crear un material con la textura
    const material = new THREE.MeshBasicMaterial({ map: marsTexture });

    // Crear una malla con la geometría y el material
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(...marte.posicion);
    scene.add(sphere);

    // Bucle de animación
    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();
}

createSphere();