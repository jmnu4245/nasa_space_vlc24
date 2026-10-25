import * as THREE from 'three';
import { SCALE_DISTANCE } from './datos.js';

const UA_KM = 149597870.7;

// Información de cada misión (lanzamiento y descripción breve, español / inglés)
export const MISIONES = {
    'Voyager 1': { lanzamiento: '1977-09-05', texto: [
        'El objeto humano más lejano. Sobrevoló Júpiter (1979) y Saturno (1980) y en 2012 cruzó la heliopausa hacia el espacio interestelar.',
        'The most distant human-made object. It flew past Jupiter (1979) and Saturn (1980) and crossed the heliopause into interstellar space in 2012.'] },
    'Voyager 2': { lanzamiento: '1977-08-20', texto: [
        'La única nave que ha visitado Urano (1986) y Neptuno (1989), tras pasar por Júpiter y Saturno.',
        'The only spacecraft to have visited Uranus (1986) and Neptune (1989), after Jupiter and Saturn.'] },
    'New Horizons': { lanzamiento: '2006-01-19', texto: [
        'Sobrevoló Plutón en 2015 y el objeto del cinturón de Kuiper Arrokoth en 2019.',
        'It flew past Pluto in 2015 and the Kuiper belt object Arrokoth in 2019.'] },
    'Parker Solar Probe': { lanzamiento: '2018-08-12', texto: [
        'Atraviesa la corona del Sol: es el objeto más rápido construido jamás, a casi 700 000 km/h en el perihelio.',
        'It flies through the Sun’s corona and is the fastest object ever built, at almost 700,000 km/h at perihelion.'] },
    'James Webb': { lanzamiento: '2021-12-25', texto: [
        'Telescopio espacial infrarrojo en el punto de Lagrange L2, a 1,5 millones de km de la Tierra.',
        'Infrared space telescope at the L2 Lagrange point, 1.5 million km from Earth.'] }
};

// Sprite circular con borde nítido para marcar la posición de la nave
function texturaMarcador() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(32, 32, 7, 0, 2 * Math.PI);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

class Nave {
    constructor({ nombre, puntos }, textura) {
        this.nombre = nombre;
        this.jd = Float64Array.from(puntos, p => p[0]);
        // Posiciones en la escena (la eclíptica es el plano XZ)
        this.pos = new Float32Array(puntos.length * 3);
        puntos.forEach(([, x, y, z], i) => this.pos.set([x * SCALE_DISTANCE, z * SCALE_DISTANCE, -y * SCALE_DISTANCE], i * 3));

        const geomTotal = new THREE.BufferGeometry();
        geomTotal.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
        this.trayectoria = new THREE.Line(geomTotal, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 }));
        const geomRecorrida = new THREE.BufferGeometry();
        geomRecorrida.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
        this.recorrido = new THREE.Line(geomRecorrida, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
        this.marcador = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, sizeAttenuation: false, depthWrite: false, transparent: true }));
        this.marcador.scale.setScalar(0.022);
        this.trayectoria.frustumCulled = this.recorrido.frustumCulled = false;
        this.grupo = new THREE.Group();
        this.grupo.add(this.trayectoria, this.recorrido, this.marcador);
        this.velocidad = 0; // km/s
    }

    // Índice del último punto anterior a t (búsqueda binaria)
    indice(t) {
        let lo = 0, hi = this.jd.length - 1;
        while (hi - lo > 1) {
            const m = (lo + hi) >> 1;
            if (this.jd[m] <= t) lo = m; else hi = m;
        }
        return lo;
    }

    activa(t) {
        return t >= this.jd[0] && t <= this.jd[this.jd.length - 1];
    }

    actualizar(t) {
        const activa = this.activa(t);
        this.marcador.visible = this.recorrido.visible = activa;
        if (!activa) return;
        const i = this.indice(t);
        const j = Math.min(i + 1, this.jd.length - 1);
        const f = j === i ? 0 : (t - this.jd[i]) / (this.jd[j] - this.jd[i]);
        const p = this.pos;
        this.marcador.position.set(
            p[i * 3] + (p[j * 3] - p[i * 3]) * f,
            p[i * 3 + 1] + (p[j * 3 + 1] - p[i * 3 + 1]) * f,
            p[i * 3 + 2] + (p[j * 3 + 2] - p[i * 3 + 2]) * f
        );
        this.recorrido.geometry.setDrawRange(0, i + 1);
        // Velocidad media entre los dos puntos de la tabla (km/s)
        const d = Math.hypot(p[j * 3] - p[i * 3], p[j * 3 + 1] - p[i * 3 + 1], p[j * 3 + 2] - p[i * 3 + 2]);
        this.velocidad = j === i ? 0 : (d / SCALE_DISTANCE) * UA_KM / ((this.jd[j] - this.jd[i]) * 86400);
    }

    get distanciaSolUA() {
        return this.marcador.position.length() / SCALE_DISTANCE;
    }
}

// Trayectorias reales de JPL Horizons (datos/naves.json)
export default class Naves {
    constructor() {
        this.lista = [];
        this.grupo = new THREE.Group();
        this.textura = texturaMarcador();
    }

    async cargar(url) {
        const datos = await (await fetch(url)).json();
        this.lista = datos.map(d => new Nave(d, this.textura));
        this.lista.forEach(n => this.grupo.add(n.grupo));
    }

    actualizar(t) {
        this.lista.forEach(n => n.actualizar(t));
    }
}
