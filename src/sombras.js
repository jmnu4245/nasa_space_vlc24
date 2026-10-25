import * as THREE from 'three';
import { SCALE_DISTANCE } from './datos.js';

// Sombras analíticas: cada material receptor sabe qué esferas (y qué anillo) pueden taparle el Sol,
// que está en el origen. Así hay eclipses y sombras de los anillos sin mapas de sombras.
const MAX_OCLUSORES = 4;
const receptores = [];
const v = new THREE.Vector3();

// Radio angular real del Sol a 1 UA (rad), para que la penumbra tenga el tamaño correcto
const RADIO_ANGULAR_SOL = 0.00465 * SCALE_DISTANCE;

/**
 * @param {THREE.Material} material - MeshStandardMaterial del receptor
 * @param {Array<{objeto: THREE.Object3D, radio: number}>} oclusores - esferas que pueden darle sombra
 * @param {Object} [anillo] - { objeto, interior, exterior, mapa } anillo que proyecta sombra
 * @param {Function} [extra] - modificación adicional del shader (onBeforeCompile)
 * @param {string} clave - identificador del tipo de shader para la caché de programas
 */
export function añadirSombras(material, oclusores, anillo = null, extra = null, clave = '', { rojizo = false } = {}) {
    const uniforms = {
        uOclusores: { value: Array.from({ length: MAX_OCLUSORES }, () => new THREE.Vector4()) },
        uNumOclusores: { value: 0 },
        uRadioAngularSol: { value: RADIO_ANGULAR_SOL },
        uAnilloCentro: { value: new THREE.Vector3() },
        uAnilloNormal: { value: new THREE.Vector3(0, 1, 0) },
        uAnilloRadios: { value: new THREE.Vector2() },
        uAnilloMapa: { value: anillo ? anillo.mapa : null }
    };
    receptores.push({ uniforms, oclusores, anillo });

    material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vPosMundo;')
            .replace('#include <project_vertex>', '#include <project_vertex>\nvPosMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `#include <common>
varying vec3 vPosMundo;
uniform vec4 uOclusores[${MAX_OCLUSORES}];
uniform int uNumOclusores;
uniform float uRadioAngularSol;
${anillo ? `uniform vec3 uAnilloCentro;
uniform vec3 uAnilloNormal;
uniform vec2 uAnilloRadios;
uniform sampler2D uAnilloMapa;` : ''}
float luzSolar() {
    float distSol = length(vPosMundo);
    vec3 haciaSol = -vPosMundo / distSol;
    float luz = 1.0;
    for (int i = 0; i < ${MAX_OCLUSORES}; i++) {
        if (i >= uNumOclusores) break;
        vec3 c = uOclusores[i].xyz - vPosMundo;
        float t = dot(c, haciaSol);
        if (t <= 0.0 || t >= distSol) continue;
        float r = uOclusores[i].w;
        float d = length(c - haciaSol * t);
        float penumbra = max(uRadioAngularSol * t / distSol, 1e-5);
        float tapado = min(1.0, (r * r) / (penumbra * penumbra));
        luz *= 1.0 - tapado * (1.0 - smoothstep(r - penumbra, r + penumbra, d));
    }
${anillo ? `    float den = dot(haciaSol, uAnilloNormal);
    if (abs(den) > 1e-4) {
        float tt = dot(uAnilloCentro - vPosMundo, uAnilloNormal) / den;
        if (tt > 0.0) {
            float rr = length(vPosMundo + haciaSol * tt - uAnilloCentro);
            float u = (rr - uAnilloRadios.x) / (uAnilloRadios.y - uAnilloRadios.x);
            if (u > 0.0 && u < 1.0) luz *= 1.0 - 0.9 * texture2D(uAnilloMapa, vec2(u, 0.5)).a;
        }
    }` : ''}
    return luz;
}`)
            .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
float luzSol = luzSolar();
${rojizo ? '// Eclipse de Luna: la atmósfera terrestre refracta luz rojiza hacia la sombra\nreflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.42, 0.11, 0.04) * (1.0 - luzSol) * smoothstep(0.0, 0.3, dot(normal, normalize((viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz + vViewPosition)) + 0.3);' : ''}
reflectedLight.directDiffuse *= luzSol;
reflectedLight.directSpecular *= luzSol;`);
        if (extra) extra(shader);
    };
    material.customProgramCacheKey = () => `sombras-${anillo ? 'anillo' : 'esferas'}-${clave}-${rojizo}`;
}

// Actualiza las posiciones de los oclusores (llamar en cada fotograma)
export function actualizarSombras() {
    for (const { uniforms, oclusores, anillo } of receptores) {
        let n = 0;
        for (const { objeto, radio } of oclusores) {
            if (!objeto.visible || n >= MAX_OCLUSORES) continue;
            objeto.getWorldPosition(v);
            uniforms.uOclusores.value[n++].set(v.x, v.y, v.z, radio * objeto.scale.x); // escala real incluida
        }
        uniforms.uNumOclusores.value = n;
        if (anillo) {
            anillo.objeto.getWorldPosition(uniforms.uAnilloCentro.value);
            uniforms.uAnilloNormal.value.set(0, 1, 0).applyQuaternion(anillo.objeto.quaternion);
            const k = anillo.objeto.scale.x;
            uniforms.uAnilloRadios.value.set(anillo.interior * k, anillo.exterior * k);
        }
    }
}
