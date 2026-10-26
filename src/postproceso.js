import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Acabado cinematográfico: aberración cromática en los bordes, viñeta y grano de película animado
export function crearPaseCine() {
    const pase = new ShaderPass({
        uniforms: {
            tDiffuse: { value: null },
            uTiempo: { value: 0 },
            uGrano: { value: 0.024 },
            uVineta: { value: 0.42 },
            uAberracion: { value: 0.0032 },
            uResolucion: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uTiempo, uGrano, uVineta, uAberracion;
            uniform vec2 uResolucion;
            varying vec2 vUv;
            float azar(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTiempo * 61.7) * 43758.5453);
            }
            void main() {
                vec2 c = vUv - 0.5;
                float r = length(c);
                vec2 desvio = c * uAberracion * r;
                vec4 base = texture2D(tDiffuse, vUv);
                vec3 color = vec3(texture2D(tDiffuse, vUv + desvio).r, base.g, texture2D(tDiffuse, vUv - desvio).b);
                color *= 1.0 - uVineta * smoothstep(0.3, 0.85, r);
                // Grano más visible en las sombras, como en la película
                float luma = dot(color, vec3(0.299, 0.587, 0.114));
                color += (azar(floor(vUv * uResolucion)) - 0.5) * uGrano * (1.0 - 0.6 * clamp(luma, 0.0, 1.0));
                gl_FragColor = vec4(color, base.a);
            }`
    });
    pase.actualizar = t => { pase.uniforms.uTiempo.value = t % 100; };
    pase.redimensionar = (ancho, alto) => pase.uniforms.uResolucion.value.set(ancho, alto);
    return pase;
}
