import * as THREE from 'three';
import { SCALE_SIZE, J2000 } from './datos.js';
import { cargarTextura, crearAtmosfera } from './materiales.js';
import { crearTextura } from './rocas.js';
import { lunaGeocentrica } from './efemerides.js';

const EJE_X = new THREE.Vector3(1, 0, 0);
const ARRIBA = new THREE.Vector3(0, 1, 0);
const RAD = Math.PI / 180;
const MES = 27.3217;

// Vector geocéntrico de la Luna en km (ejes de la escena: la eclíptica es el plano XZ)
function vectorLuna(t, destino) {
    const { lon, lat, dist } = lunaGeocentrica(t);
    const x = dist * Math.cos(lat * RAD) * Math.cos(lon * RAD);
    const y = dist * Math.cos(lat * RAD) * Math.sin(lon * RAD);
    const z = dist * Math.sin(lat * RAD);
    return destino.set(x, z, -y);
}

/**
 * Luna de un planeta. La Luna terrestre usa la teoría de Meeus (posición real, eclipses incluidos);
 * las demás, una órbita circular en el plano ecuatorial de su planeta. Las distancias usan la escala
 * de los tamaños, así que la geometría de los eclipses es coherente.
 */
export default class Luna {
    constructor(datos, planeta) {
        this.nombre = datos.nombre;
        this.en = datos.en;
        this.datos = datos;
        this.planeta = planeta;
        this.tamaño = datos.radio * SCALE_SIZE;
        this.distancia = datos.distancia * SCALE_SIZE;
        this.periodo = datos.periodo;
        this.precisa = datos.nombre === 'Luna';
        this.offsetKm = new THREE.Vector3(); // posición respecto al planeta, en km
        // Plano de la órbita: el ecuador del planeta, o la eclíptica inclinada (caso de la Luna)
        this.plano = datos.inclinacionEcliptica
            ? new THREE.Quaternion().setFromAxisAngle(EJE_X, datos.inclinacionEcliptica * RAD)
            : planeta.mesh.quaternion.clone();

        const color = new THREE.Color(datos.color);
        const map = datos.textura
            ? cargarTextura(datos.textura)
            : crearTextura(color.getStyle(), color.clone().multiplyScalar(0.6).getStyle());
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.tamaño, 64, 64),
            new THREE.MeshStandardMaterial({ map, roughness: 1 })
        );
        if (datos.ejes) this.mesh.geometry.scale(...datos.ejes); // lunas irregulares (Fobos, Deimos)
        if (datos.atmosfera) this.mesh.add(crearAtmosfera(this.tamaño, datos.atmosfera, 1.4));

        const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
        if (this.precisa) {
            this.puntosOrbita = new Float32Array(129 * 3);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(this.puntosOrbita, 3));
            this.orbita = new THREE.Line(geometry, material);
            this.tOrbita = -Infinity;
        } else {
            const puntos = [];
            for (let i = 0; i <= 128; i++) {
                const ang = 2 * Math.PI * i / 128;
                puntos.push(new THREE.Vector3(Math.cos(ang) * this.distancia, 0, Math.sin(ang) * this.distancia));
            }
            this.orbita = new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos), material);
            this.orbita.quaternion.copy(this.plano);
        }
        this.giro = new THREE.Quaternion();
        this.m = new THREE.Matrix4();
        this.v = new THREE.Vector3();
    }

    // Recalcula la órbita de la Luna (cambia poco a poco: precesión del nodo y del perigeo)
    actualizarOrbitaPrecisa(t) {
        if (Math.abs(t - this.tOrbita) < 2) return;
        this.tOrbita = t;
        for (let i = 0; i <= 128; i++) {
            vectorLuna(t + (i / 128 - 0.5) * MES, this.v).multiplyScalar(SCALE_SIZE).toArray(this.puntosOrbita, i * 3);
        }
        this.orbita.geometry.attributes.position.needsUpdate = true;
        this.orbita.geometry.computeBoundingSphere();
    }

    /**
     * @param {number} t - día juliano
     * @param {number} escala - factor de tamaño (1 = tamaños ampliados; < 1 = escala real)
     */
    actualizar(t, escala = 1) {
        const centro = this.planeta.mesh.position;
        if (this.precisa) {
            vectorLuna(t, this.offsetKm);
            this.mesh.position.copy(this.offsetKm).multiplyScalar(SCALE_SIZE * escala).add(centro);
            this.actualizarOrbitaPrecisa(t);
            // Rotación síncrona: el meridiano 0 (centro de la textura) mira a la Tierra
            const haciaTierra = this.v.copy(this.offsetKm).negate().normalize();
            const z = new THREE.Vector3().crossVectors(haciaTierra, ARRIBA).normalize();
            const y = new THREE.Vector3().crossVectors(z, haciaTierra);
            this.mesh.quaternion.setFromRotationMatrix(this.m.makeBasis(haciaTierra, y, z));
        } else {
            const ang = 2 * Math.PI * (t - J2000) / this.periodo;
            this.offsetKm.set(Math.cos(ang), 0, -Math.sin(ang)).applyQuaternion(this.plano).multiplyScalar(this.datos.distancia);
            this.mesh.position.copy(this.offsetKm).multiplyScalar(SCALE_SIZE * escala).add(centro);
            // Rotación síncrona: siempre muestra la misma cara al planeta
            this.giro.setFromAxisAngle(ARRIBA, ang + Math.PI);
            this.mesh.quaternion.copy(this.plano).multiply(this.giro);
        }
        this.mesh.scale.setScalar(escala);
        this.orbita.scale.setScalar(escala);
        this.orbita.position.copy(centro);
    }
}
