import * as THREE from 'three';
import { SCALE_DISTANCE, J2000 } from './datos.js';

// Huecos de Kirkwood del cinturón principal (resonancias con Júpiter), en UA
const HUECOS_KIRKWOOD = [2.5, 2.705, 2.82, 2.95, 3.27];

// Normal estándar (Box-Muller)
const normal = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

function crearNube(n, generarA, sigmaInclinacion, color, tamaño, opacidad) {
    const orbitas = new Float32Array(n * 4); // a (escena), inclinación, nodo, fase inicial
    const movimiento = new Float32Array(n);  // rad/día
    for (let i = 0; i < n; i++) {
        const a = generarA();
        orbitas.set([a * SCALE_DISTANCE, Math.abs(normal()) * sigmaInclinacion * Math.PI / 180,
            Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI], i * 4);
        movimiento[i] = 2 * Math.PI / (365.25 * a ** 1.5); // 3.ª ley de Kepler
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geometry.setAttribute('aOrbita', new THREE.BufferAttribute(orbitas, 4));
    geometry.setAttribute('aMovimiento', new THREE.BufferAttribute(movimiento, 1));
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTiempo: { value: 0 },
            uColor: { value: new THREE.Color(color) },
            uTamano: { value: tamaño * Math.min(window.devicePixelRatio, 2) },
            uOpacidad: { value: opacidad }
        },
        vertexShader: `
            #include <common>
            #include <logdepthbuf_pars_vertex>
            attribute vec4 aOrbita;
            attribute float aMovimiento;
            uniform float uTiempo;
            uniform float uTamano;
            void main() {
                // Circular inclined orbit computed on the GPU for every instant
                float th = aOrbita.w + aMovimiento * uTiempo;
                float cO = cos(aOrbita.z), sO = sin(aOrbita.z), cI = cos(aOrbita.y), sI = sin(aOrbita.y);
                float x = aOrbita.x * (cO * cos(th) - sO * sin(th) * cI);
                float y = aOrbita.x * (sO * cos(th) + cO * sin(th) * cI);
                float z = aOrbita.x * sin(th) * sI;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(x, z, -y, 1.0);
                gl_PointSize = uTamano;
                #include <logdepthbuf_vertex>
            }`,
        fragmentShader: `
            #include <logdepthbuf_pars_fragment>
            uniform vec3 uColor;
            uniform float uOpacidad;
            void main() {
                #include <logdepthbuf_fragment>
                float d = length(gl_PointCoord - 0.5);
                gl_FragColor = vec4(uColor * smoothstep(0.5, 0.1, d) * uOpacidad, 1.0);
            }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });
    const puntos = new THREE.Points(geometry, material);
    puntos.frustumCulled = false;
    return puntos;
}

// Cinturón principal (2,1–3,3 UA, con los huecos de Kirkwood) y cinturón de Kuiper (30–50 UA)
export default class Cinturones {
    constructor() {
        const aPrincipal = () => {
            for (;;) {
                const a = 2.1 + Math.random() * 1.2;
                if (HUECOS_KIRKWOOD.every(h => Math.abs(a - h) > 0.025)) return a;
            }
        };
        // Kuiper: plutinos en la resonancia 3:2 con Neptuno (39,4 UA) y objetos clásicos (42–48 UA)
        const aKuiper = () => (Math.random() < 0.25 ? 39.4 + normal() * 0.3 : 42 + Math.random() * 6);
        this.principal = crearNube(7000, aPrincipal, 7, 0xb8aa98, 1.6, 0.55);
        this.kuiper = crearNube(6000, aKuiper, 9, 0x8fa8c8, 1.6, 0.45);
        this.grupo = new THREE.Group();
        this.grupo.add(this.principal, this.kuiper);
    }

    actualizar(tiempo) {
        const dias = tiempo - J2000;
        this.principal.material.uniforms.uTiempo.value = dias;
        this.kuiper.material.uniforms.uTiempo.value = dias;
    }
}
