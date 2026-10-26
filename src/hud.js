import * as THREE from 'three';

const $ = id => document.getElementById(id);
const GLIFOS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/\\=';

/**
 * Efecto de "decodificación": las letras pasan por glifos aleatorios hasta fijarse, de izquierda a derecha.
 * @param {HTMLElement} el
 * @param {string} texto
 */
export function decodificar(el, texto, duracion = 650) {
    if (el._decodificando) cancelAnimationFrame(el._decodificando);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = texto;
        return;
    }
    const inicio = performance.now();
    const paso = () => {
        const k = Math.min(1, (performance.now() - inicio) / duracion);
        const fijas = Math.floor(texto.length * k);
        el.textContent = texto.slice(0, fijas) + [...texto.slice(fijas)]
            .map(c => (c === ' ' ? ' ' : GLIFOS[Math.floor(Math.random() * GLIFOS.length)])).join('');
        if (k < 1) el._decodificando = requestAnimationFrame(paso);
        else el._decodificando = null;
    };
    paso();
}

// Longitud "redonda" (1, 2 o 5 × 10ⁿ) más cercana por debajo
function redondo(x) {
    const p = 10 ** Math.floor(Math.log10(x));
    const m = x / p;
    return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p;
}

/**
 * Interfaz de instrumentación sobre la escena: retícula sobre el objetivo, telemetría unida por una
 * línea guía, barra de escala y destello de lente del Sol.
 */
export default class HUD {
    constructor() {
        this.reticula = $('reticula');
        this.telemetria = $('telemetria');
        this.guia = $('hud-guia').querySelector('line');
        this.barra = $('escala-barra');
        this.destellos = [...$('destellos').children];
        this.objetivoAnterior = null;
        this.v = new THREE.Vector3();
        this.opacidadDestello = 0;
    }

    /**
     * @param {THREE.Camera} camera
     * @param {?{objeto3d, tamaño, filas: Array<[string,string]>, kmPorUnidad: number}} objetivo
     */
    actualizar(camera, objetivo, { visible = true, escalaKm = null, textoEscala } = {}) {
        const ancho = window.innerWidth, alto = window.innerHeight;
        const escalaPx = alto / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

        // Retícula y telemetría
        let mostrar = visible && objetivo;
        if (mostrar) {
            this.v.copy(objetivo.objeto3d.position).project(camera);
            mostrar = this.v.z < 1 && Math.abs(this.v.x) < 1.2 && Math.abs(this.v.y) < 1.2;
        }
        this.reticula.hidden = this.telemetria.hidden = !mostrar;
        this.guia.parentNode.style.display = mostrar ? '' : 'none';
        if (mostrar) {
            const x = (this.v.x * 0.5 + 0.5) * ancho, y = (-this.v.y * 0.5 + 0.5) * alto;
            const d = camera.position.distanceTo(objetivo.objeto3d.position);
            const radioPx = objetivo.tamaño * escalaPx / Math.max(d, 1e-9);
            const lado = THREE.MathUtils.clamp(radioPx * 2.5, 46, Math.min(ancho, alto) * 0.8);
            // Al cambiar de objetivo la retícula "se cierra" sobre él
            if (objetivo.objeto3d !== this.objetivoAnterior) {
                this.objetivoAnterior = objetivo.objeto3d;
                this.reticula.classList.remove('fijando');
                void this.reticula.offsetWidth;
                this.reticula.classList.add('fijando');
            }
            this.reticula.style.transform = `translate(${x - lado / 2}px, ${y - lado / 2}px)`;
            this.reticula.style.width = this.reticula.style.height = `${lado}px`;
            this.telemetria.innerHTML = objetivo.filas.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
            // Bloque a la derecha (o a la izquierda si no cabe), unido por la guía a la esquina de la retícula
            const derecha = x + lado / 2 + 230 < ancho;
            const tx = derecha ? x + lado / 2 + 48 : x - lado / 2 - 48 - this.telemetria.offsetWidth;
            const ty = Math.max(70, y - lado / 2 - 18);
            this.telemetria.style.transform = `translate(${tx}px, ${ty}px)`;
            this.guia.setAttribute('x1', derecha ? x + lado / 2 : x - lado / 2);
            this.guia.setAttribute('y1', y - lado / 2);
            this.guia.setAttribute('x2', derecha ? tx - 6 : tx + this.telemetria.offsetWidth + 6);
            this.guia.setAttribute('y2', ty + 8);
        } else {
            this.objetivoAnterior = null;
        }

        // Barra de escala: una longitud redonda que mida unos 120 px a la distancia del objetivo
        if (visible && escalaKm) {
            const kmPorPx = escalaKm;
            const km = redondo(kmPorPx * 120);
            this.barra.hidden = false;
            this.barra.querySelector('.barra').style.width = `${km / kmPorPx}px`;
            this.barra.querySelector('span').textContent = textoEscala(km);
        } else {
            this.barra.hidden = true;
        }
    }

    /**
     * Destello de lente: reflejos a lo largo de la recta que une el Sol con el centro de la pantalla.
     * @param {boolean} visible - el Sol está en pantalla y no lo tapa ningún astro
     */
    destello(camera, posSol, radioSol, visible, dt) {
        this.v.copy(posSol).project(camera);
        const ancho = window.innerWidth, alto = window.innerHeight;
        const sx = (this.v.x * 0.5 + 0.5) * ancho, sy = (-this.v.y * 0.5 + 0.5) * alto;
        const escalaPx = alto / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const radioPx = radioSol * escalaPx / camera.position.distanceTo(posSol);
        const enPantalla = this.v.z < 1 && Math.abs(this.v.x) < 1.05 && Math.abs(this.v.y) < 1.05;
        // Con el Sol enorme en pantalla los reflejos sobran
        const objetivo = visible && enPantalla ? THREE.MathUtils.clamp(1 - radioPx / 260, 0, 1) : 0;
        this.opacidadDestello += (objetivo - this.opacidadDestello) * Math.min(1, dt * 6);
        const cx = ancho / 2, cy = alto / 2;
        this.destellos.forEach((el, i) => {
            const k = Number(el.dataset.k);
            el.style.opacity = (this.opacidadDestello * Number(el.dataset.o)).toFixed(3);
            el.style.transform = `translate(${sx + (cx - sx) * k}px, ${sy + (cy - sy) * k}px) translate(-50%, -50%)`;
            el.hidden = this.opacidadDestello < 0.01;
        });
    }
}
