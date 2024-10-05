import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { setupCameraControls } from './cameracontrol.js';

const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 8;
    camera.position.x =2;
    camera.position.y=2;

    // Renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a sphere geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);


    //Create light
    const ambientLight = new THREE.AmbientLight(0x404040); // Luz ambiental suave
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

//Camara
setupCameraControls(camera, renderer);

//grid
//const gridSize = 10; // Tamaño del grid
//const gridDivisions = 10; // Número de divisiones en el grid
//const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
//scene.add(gridHelper);

    // Animation loop
    function animate() {
    requestAnimationFrame(animate);

    sphere.rotation.x += 0.01;
    sphere.position.x+=0.01;
    sphere.rotation.y += 0.01;

    // Renderizar la escena
    renderer.render(scene, camera);

        //controls.update();
    }

    animate();
