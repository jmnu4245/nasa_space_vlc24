import * as THREE from 'three';
import { SCALE_DISTANCE } from './datos.js';

const ARRIBA = new THREE.Vector3(0, 1, 0);

// Cono abierto con la cabeza en el origen y la cola hacia +Y (longitud 1)
const GEOMETRIA = new THREE.CylinderGeometry(1, 0.03, 1, 64, 8, true).translate(0, 0.5, 0);

function crearMaterial(color, opacidad) {
    return new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uOpacidad: { value: opacidad } },
        vertexShader: `
            #include <common>
            #include <logdepthbuf_pars_vertex>
            varying float vLargo;
            varying vec3 vNormal;
            varying vec3 vVista;
            void main() {
                vLargo = uv.y;
                vNormal = normalMatrix * normal;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vVista = -mv.xyz;
                gl_Position = projectionMatrix * mv;
                #include <logdepthbuf_vertex>
            }`,
        fragmentShader: `
            #include <logdepthbuf_pars_fragment>
            uniform vec3 uColor;
            uniform float uOpacidad;
            varying float vLargo;
            varying vec3 vNormal;
            varying vec3 vVista;
            void main() {
                #include <logdepthbuf_fragment>
                // Brighter near the nucleus, fading towards the end and the edges
                float borde = abs(dot(normalize(vNormal), normalize(vVista)));
                float a = pow(1.0 - vLargo, 2.5) * pow(borde, 2.5) * uOpacidad;
                gl_FragColor = vec4(uColor * a, 1.0);
            }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
    });
}

// Colas de los cometas: la de iones (azul) apunta en sentido opuesto al Sol y la de polvo
// (blanquecina) se curva hacia atrás respecto al movimiento. Crecen al acercarse al Sol.
export default class Colas {
    constructor(cometas) {
        this.cometas = cometas;
        this.grupo = new THREE.Group();
        this.iones = [];
        this.polvo = [];
        this.matIones = crearMaterial(0xc9d6ff, 0.6);
        this.matPolvo = crearMaterial(0xfff1d6, 0.22);
        this.siguiente = new THREE.Vector3();
        this.dir = new THREE.Vector3();
        this.vel = new THREE.Vector3();
    }

    actualizar(t) {
        const { cuerpos, vectores, cantidad } = this.cometas;
        while (this.iones.length < cuerpos.length) {
            const ion = new THREE.Mesh(GEOMETRIA, this.matIones);
            const polvo = new THREE.Mesh(GEOMETRIA, this.matPolvo);
            ion.frustumCulled = polvo.frustumCulled = false;
            this.iones.push(ion);
            this.polvo.push(polvo);
            this.grupo.add(ion, polvo);
        }
        for (let i = 0; i < cuerpos.length; i++) {
            const pos = vectores[i];
            const rUA = pos.length() / SCALE_DISTANCE;
            const visible = i < cantidad && rUA < 5;
            this.iones[i].visible = this.polvo[i].visible = visible;
            if (!visible) continue;

            const largo = Math.min(40, 10 / (rUA * rUA));
            this.dir.copy(pos).normalize();
            this.iones[i].position.copy(pos);
            this.iones[i].quaternion.setFromUnitVectors(ARRIBA, this.dir);
            this.iones[i].scale.set(largo * 0.035, largo, largo * 0.035);

            cuerpos[i].posicionEscena(t + 1, this.siguiente);
            this.vel.subVectors(this.siguiente, pos).normalize();
            this.dir.addScaledVector(this.vel, -0.45).normalize();
            this.polvo[i].position.copy(pos);
            this.polvo[i].quaternion.setFromUnitVectors(ARRIBA, this.dir);
            this.polvo[i].scale.set(largo * 0.1, largo * 0.7, largo * 0.1);
        }
    }
}
