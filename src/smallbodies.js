import * as THREE from 'three';
import CelestialBody from './CelestialBody.js';

// Nube de puntos con los asteroides o cometas del JSON; solo se dibujan los `cantidad` primeros
// Sprite redondo con borde suave para los puntos (por defecto serían cuadrados)
function crearSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.6, '#fff');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

export default class CuerposMenores {
    constructor(color, tamaño) {
        this.cuerpos = [];
        this.vectores = []; // posición en la escena de cada cuerpo
        this.cantidad = 0;
        this.posiciones = new Float32Array(0);
        this.geometry = new THREE.BufferGeometry();
        this.points = new THREE.Points(
            this.geometry,
            new THREE.PointsMaterial({ color, size: tamaño, sizeAttenuation: false, map: crearSprite(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        this.points.frustumCulled = false;
    }

    // `filtro` permite descartar entradas (p. ej. Ceres, que se muestra como planeta enano)
    async cargar(url, filtro = () => true) {
        const datos = await (await fetch(url)).json();
        this.cuerpos = datos.filter(filtro).map(d => CelestialBody.menor(d));
        this.vectores = this.cuerpos.map(() => new THREE.Vector3());
        this.posiciones = new Float32Array(this.cuerpos.length * 3);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.posiciones, 3));
        this.setCantidad(this.cantidad);
    }

    setCantidad(n) {
        this.cantidad = Math.min(n, this.cuerpos.length);
        this.geometry.setDrawRange(0, this.cantidad);
    }

    actualizar(t) {
        if (!this.cuerpos.length) return; // aún cargando el JSON
        for (let i = 0; i < this.cantidad; i++) {
            this.cuerpos[i].posicionEscena(t, this.vectores[i]).toArray(this.posiciones, i * 3);
        }
        this.geometry.attributes.position.needsUpdate = true;
    }
}
