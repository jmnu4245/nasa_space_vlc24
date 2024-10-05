const SCALE = 62;
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
class Planeta {
    constructor(tamaño, posicion, textura, velocidadRotacion) {
    this.tamaño = tamaño;
    this.posicion = posicion;
    this.textura = textura;
    this.velocidadRotacion = velocidadRotacion;
    //Donde tamaño es un float, posición es un vector de tres componentes y textura es un string.
    }
    cambiarPosicion= function(nuevaPosicion)
    {
        if (nuevaPosicion.length == 3){
            this.posicion = nuevaPosicion/SCALE
            ;
        }else{
            console.log("Error: la nueva posición no tiene tres componentes");
        }
    }
    
    setPlaneta = function(){
        const geometry = new THREE.SphereGeometry(this.tamaño, 32, 32);
        const material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(this.textura) });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(...this.posicion);
        return sphere;
    }
        
}
export default Planeta; // Exportar la clase Planeta
