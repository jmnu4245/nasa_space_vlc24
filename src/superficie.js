import * as THREE from 'three';

// Densidad de la atmósfera de cada mundo (para el viento del sonido ambiental)
export const CIELOS = {
    'Tierra': { densidad: 0.97 }, 'Marte': { densidad: 0.5 }, 'Venus': { densidad: 1 }, 'Titán': { densidad: 1 },
    'Júpiter': { densidad: 0.95 }, 'Saturno': { densidad: 0.95 }, 'Urano': { densidad: 0.9 }, 'Neptuno': { densidad: 0.9 },
    'Plutón': { densidad: 0.1 }
};

// Lugares de observación: en la Tierra, Valencia; en el resto, un punto de latitud media
export const LUGARES = {
    'Tierra': { nombre: 'Valencia', lat: 39.4699, lon: -0.3763 },
    'Marte': { nombre: 'Jezero', lat: 18.38, lon: 77.58 },
    'Luna': { nombre: 'Mare Tranquillitatis (Apolo 11)', lat: 0.674, lon: 23.473 },
    'Titán': { nombre: 'Huygens', lat: -10.25, lon: 192.3 }
};

const ARRIBA = new THREE.Vector3(0, 1, 0);
const ALTURA = 0.07; // altura de la cámara sobre la superficie, en radios del astro

/**
 * Vista desde un astro: la cámara flota a poca altura sobre un punto de su superficie, gira con él
 * (amaneceres y atardeceres reales) y mira hacia fuera, al resto del planetario.
 */
export default class VistaSuperficie {
    constructor(scene) {
        this.activa = false;
        this.azimut = 0;
        this.altura = 0.15;
        this.fov = 70;
        this.pos = new THREE.Vector3();
        this.centro = new THREE.Vector3();
        this.arriba = new THREE.Vector3();
        this.norte = new THREE.Vector3();
        this.este = new THREE.Vector3();
        this.haciaSol = new THREE.Vector3();
        this.altSol = 0;
        this.radioMundo = 1;

        // Planetas como puntos de luz, para encontrarlos aunque sean más pequeños que un píxel
        this.puntos = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({
            size: 5, sizeAttenuation: false, color: 0xfff6e8, transparent: true, depthWrite: false
        }));
        this.puntos.renderOrder = 10;
        this.puntos.visible = false;
        this.puntos.frustumCulled = false;
        scene.add(this.puntos);
    }

    /**
     * @param {{nombre: string, mesh: THREE.Object3D, esfera: THREE.Object3D, tamaño: number}} cuerpo
     * @param {Array<THREE.Object3D>} astros - objetos a mostrar como puntos de luz
     * @param {THREE.Vector3} posSol
     */
    activar(cuerpo, astros, posSol) {
        this.cuerpo = cuerpo;
        this.lugar = LUGARES[cuerpo.nombre] ?? { nombre: null, lat: 25, lon: 0 };
        this.astros = astros;
        this.puntos.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(astros.length * 3), 3));
        this.puntos.visible = true;
        this.atmosfera = CIELOS[cuerpo.nombre]?.densidad ?? 0;
        this.activa = true;
        // Se empieza mirando hacia el Sol, un poco por encima del horizonte
        this.calcularMarco();
        this.haciaSol.subVectors(posSol, this.pos).normalize();
        this.azimut = Math.atan2(this.haciaSol.dot(this.este), this.haciaSol.dot(this.norte));
        this.altura = 0.06;
    }

    desactivar() {
        this.activa = false;
        this.puntos.visible = false;
    }

    mirar(dx, dy) {
        this.azimut += dx * 0.004 * this.fov / 60;
        this.altura = THREE.MathUtils.clamp(this.altura - dy * 0.004 * this.fov / 60, -1.2, Math.PI / 2 - 0.01);
    }

    zoom(factor) {
        this.fov = THREE.MathUtils.clamp(this.fov * factor, 10, 110);
    }

    // Posición de la cámara y ejes locales (arriba, norte, este) en el lugar de observación
    calcularMarco() {
        const φ = THREE.MathUtils.degToRad(this.lugar.lat), λ = THREE.MathUtils.degToRad(this.lugar.lon);
        const esfera = this.cuerpo.esfera ?? this.cuerpo.mesh;
        esfera.updateWorldMatrix(true, false);
        // Punto de la superficie en coordenadas de la esfera (lon 0 = +X, este = −Z, norte = +Y)
        const local = new THREE.Vector3(Math.cos(φ) * Math.cos(λ), Math.sin(φ), -Math.cos(φ) * Math.sin(λ));
        esfera.getWorldPosition(this.centro);
        this.pos.copy(local).multiplyScalar(this.cuerpo.tamaño * (1 + ALTURA));
        esfera.localToWorld(this.pos);
        this.radioMundo = this.pos.distanceTo(this.centro) / (1 + ALTURA);
        this.arriba.subVectors(this.pos, this.centro).normalize();
        const polo = ARRIBA.clone().transformDirection(esfera.matrixWorld);
        this.norte.copy(polo).addScaledVector(this.arriba, -polo.dot(this.arriba)).normalize();
        this.este.crossVectors(this.norte, this.arriba);
    }

    actualizar(camera, posSol) {
        this.calcularMarco();
        const vista = new THREE.Vector3()
            .addScaledVector(this.norte, Math.cos(this.altura) * Math.cos(this.azimut))
            .addScaledVector(this.este, Math.cos(this.altura) * Math.sin(this.azimut))
            .addScaledVector(this.arriba, Math.sin(this.altura));
        camera.position.copy(this.pos);
        camera.up.copy(this.arriba);
        camera.lookAt(vista.add(this.pos));
        if (camera.fov !== this.fov) {
            camera.fov = this.fov;
            camera.updateProjectionMatrix();
        }
        this.haciaSol.subVectors(posSol, this.pos).normalize();
        this.altSol = THREE.MathUtils.radToDeg(Math.asin(this.haciaSol.dot(this.arriba)));

        const p = this.puntos.geometry.attributes.position;
        this.astros.forEach((a, i) => p.setXYZ(i, a.position.x, a.position.y, a.position.z));
        p.needsUpdate = true;
    }

    // ¿Lo tapa el propio astro? (el segmento cámara → objeto atraviesa su esfera)
    sobreHorizonte(objeto3d) {
        const d = new THREE.Vector3().subVectors(objeto3d.position, this.pos);
        const largo = d.length();
        d.divideScalar(largo);
        const c = new THREE.Vector3().subVectors(this.centro, this.pos);
        const t = c.dot(d);
        if (t < 0 || t > largo) return true;
        return c.lengthSq() - t * t > this.radioMundo * this.radioMundo;
    }

    // Rumbo de la vista en grados (0 = norte, 90 = este)
    get rumbo() {
        return ((THREE.MathUtils.radToDeg(this.azimut) % 360) + 360) % 360;
    }

    restaurarCamara(camera) {
        camera.up.set(0, 1, 0);
        camera.fov = 45;
        camera.updateProjectionMatrix();
    }
}
