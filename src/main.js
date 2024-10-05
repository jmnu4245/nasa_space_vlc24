import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { setupCameraControls } from './cameracontrol.js';
import Planeta from './Planeta.js';

const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    //Fondo
    const loader = new THREE.TextureLoader();
    loader.load('./../entorno/fondo.jpg', function(texture) {
    const geometry = new THREE.SphereGeometry(500, 60, 40); // Tamaño grande
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }); // Invierte las normales
    const skybox = new THREE.Mesh(geometry, material);
    scene.add(skybox);});
 

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

    //Movimiento Camara
    setupCameraControls(camera, renderer);


    // Evento de clic

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


    // Animation loop
    function animate() {
    requestAnimationFrame(animate);

    // Renderizar la escena
    renderer.render(scene, camera);
    }
    animate();
