const SCALE = 62;
const SCALE_SIZE = 0.00001436; // Factor de escala para los tamaños
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
const size = [
    696340 * SCALE_SIZE,  // Sol
    2439.7 * SCALE_SIZE,  // Mercurio
    6051.8 * SCALE_SIZE,  // Venus
    6371.0 * SCALE_SIZE,  // Tierra
    3389.5 * SCALE_SIZE,  // Marte
    69911 * SCALE_SIZE,   // Júpiter
    58232 * SCALE_SIZE,   // Saturno
    25362 * SCALE_SIZE,   // Urano
    24622 * SCALE_SIZE    // Neptuno
];

const textura = [
    '../texturas/textura_sol.jpg',
    '../texturas/textura_mercurio.png',
    '../texturas/textura_venus.jpg',
    '../texturas/textura_tierra.jpg',
    '../texturas/textura_marte.jpg',
    '../texturas/textura_jupiter.jpg',
    '../texturas/textura_saturno.jpg',
    '../texturas/textura_urano.jpg',
    '../texturas/textura_neptuno.jpg'
];

class Planeta {
    constructor(i) {
    this.tamaño = size[i];
    this.posicion = [0,0,0];
    this.textura = textura[i];

    //Donde tamaño es un float, posición es un vector de tres componentes y textura es un string.
    }
    cambiarPosicion= function(nuevaPosicion)
    {
        if (nuevaPosicion.length == 3){
            this.posicion = nuevaPosicion/SCALE;
        }else{
            console.log("Error: la nueva posición no tiene tres componentes");
        }
    }
    
    setPlaneta = function(){
        const geometry = new THREE.SphereGeometry(this.tamaño, 64, 64);
        const material = new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load(this.textura) });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(...this.posicion);
        return sphere;
    }
}
        
export default Planeta; // Exportar la clase Planeta
