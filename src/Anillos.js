import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';



class Anillos {
    constructor(mesh, textura, tamaño) {
        this.textura = textura;
        this.mesh = mesh;
        this.tamaño = tamaño;
        this.anillo = this.setAnillos();
        this.mesh.add(this.anillo); // Añadir el anillo como hijo del mesh del planeta
    }

    setAnillos() {
        const geometry = new THREE.RingGeometry(this.tamaño * 1.2, this.tamaño * 1.5, 32);
        const material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(this.textura), side: THREE.DoubleSide });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2; // Rotar el anillo para que esté en el plano horizontal
        return ring;
    }
}

export default Anillos;