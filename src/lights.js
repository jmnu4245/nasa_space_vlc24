import * as THREE from 'three';

/**
 * Configura la iluminación: luz ambiental muy tenue y una luz puntual en el Sol (origen)
 * que ilumina cada planeta por su cara orientada al Sol.
 * @param {THREE.Scene} scene - La escena a la que se agrega la iluminación.
 * @param {Object} options - intensidad de la luz ambiental y de la luz del Sol.
 */
export function setupLighting(scene, { ambiental = 0.12, intensidadSol = 3.2 } = {}) {
    scene.add(new THREE.AmbientLight(0xffffff, ambiental));
    // decay = 0: la luz llega igual a todos los planetas (a escala real, Neptuno se vería negro)
    scene.add(new THREE.PointLight(0xffffff, intensidadSol, 0, 0));
}
