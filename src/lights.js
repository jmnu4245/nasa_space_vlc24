import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
/**
 * Crea y agrega una luz ambiental a la escena.
 * @param {THREE.Scene} scene - La escena a la que se agrega la luz.
 * @param {number} color - El color de la luz ambiental.
 */
function createAmbientLight(scene, color = 0x404040) {
    const ambientLight = new THREE.AmbientLight(color);
    scene.add(ambientLight);
}

/**
 * Crea y agrega un spotlight a la escena.
 * @param {THREE.Scene} scene - La escena a la que se agrega el spotlight.
 * @param {Object} options - Opciones para configurar el spotlight.
 * @param {THREE.Vector3} position - La posición del spotlight.
 */
function createSpotLight(scene, options, position) {
    const { color = 0xffffff, intensity = 1, distance = 1000, penumbra = 0.4 } = options;

    const spotLight = new THREE.SpotLight(color, intensity);
    spotLight.position.set(position.x, position.y, position.z); // Posición
    spotLight.target.position.set(0, 0, 0); // Apuntar al centro
    spotLight.penumbra = penumbra; // Difuminado en los bordes
    spotLight.distance = distance; // Distancia a la que afecta la luz

    scene.add(spotLight);
    scene.add(spotLight.target);
}

/**
 * Configura la iluminación en la escena.
 * @param {THREE.Scene} scene - La escena a la que se agrega la iluminación.
 * @param {Object} options - Opciones para configurar la iluminación.
 */
export function setupLighting(scene, options = {}) {
    // Configuración de parámetros de luz ambiental y spotlights
    const {
        ambientColor = 0x404040, // Color de la luz ambiental
        radiusSun = 20,          // Radio del sol
        spotLightOptions = {     // Opciones de spotlight
            intensity: 1,
            distance: 1000,
            penumbra: 0.4
        }
    } = options;

    // Crear luz ambiental
    createAmbientLight(scene, ambientColor);

    // Crear spotlights desde diferentes posiciones
    const positions = [
        { x: 0, y: radiusSun * 2, z: 0 },      // Desde arriba
        { x: 0, y: -radiusSun * 2, z: 0 },     // Desde abajo
        { x: -radiusSun * 2, y: 0, z: 0 },     // Desde la izquierda
        { x: radiusSun * 2, y: 0, z: 0 },      // Desde la derecha
        { x: 0, y: 0, z: radiusSun * 2 },      // Desde el frente
        { x: 0, y: 0, z: -radiusSun * 2 }      // Desde atrás
    ];

    positions.forEach(position => {
        createSpotLight(scene, spotLightOptions, position);
    });
}
