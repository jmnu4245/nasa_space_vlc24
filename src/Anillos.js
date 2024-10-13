import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
class Anillos {
    constructor(mesh, textura, tamaño) {
        this.textura = textura;
        this.mesh = mesh;
        this.tamaño = tamaño;
        this.geometry = new THREE.RingGeometry(this.tamaño * 1.2, this.tamaño * 1.5, 32);
        this.material = new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load(this.textura), side: THREE.DoubleSide });
        this.ring = new THREE.Mesh(this.geometry, this.material); // Rotar el anillo para que esté en el plano horizontal
        this.ring.rotation.x = Math.PI / 2;
    }
    setAnillos() {
        // Añadir el anillo como hijo del mesh del planeta
        this.mesh.add(this.ring); 
    }
}
export default Anillos;