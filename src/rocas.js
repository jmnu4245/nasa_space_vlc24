import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Modelos de forma reales (NASA 3D Resources), por spkid del JPL
const MODELOS = {
    20000004: 'vesta.glb',
    20101955: 'bennu.glb',
    20000216: 'kleopatra.glb',
    20001620: 'geographos.glb',
    20004486: 'mithra.glb'
};

// Aspecto según la clase espectral: color base, color de las manchas, metalicidad y rugosidad
const ASPECTOS = {
    C: { base: '#4a4540', manchas: '#2c2926', metal: 0, rugosidad: 1 },        // carbonáceos (oscuros)
    S: { base: '#8f7a64', manchas: '#6a5848', metal: 0, rugosidad: 0.95 },     // silíceos (rojizos)
    V: { base: '#8e8980', manchas: '#5a554e', metal: 0, rugosidad: 0.9 },      // basálticos (tipo Vesta)
    M: { base: '#8e8e92', manchas: '#5e5e64', metal: 0.35, rugosidad: 0.7 },   // metálicos (tipo Psyche)
    cometa: { base: '#35322f', manchas: '#1f1d1b', metal: 0, rugosidad: 1 }    // núcleos de cometa
};

// Agrupa la clasificación espectral (Bus/Tholen) en los aspectos anteriores
export function claseEspectral(cuerpo, esCometa) {
    if (esCometa) return 'cometa';
    const tipo = (cuerpo.spec || '').toUpperCase();
    if (tipo.startsWith('V')) return 'V';
    if (/^[XME]/.test(tipo)) return 'M';
    if (/^[SQKLARZ]/.test(tipo)) return 'S';
    if (/^[CBDPTFG]/.test(tipo)) return 'C';
    // Sin clase conocida: los de albedo alto suelen ser silíceos
    return cuerpo.albedo > 0.15 ? 'S' : 'C';
}

export const NOMBRES_CLASE = {
    C: 'carbonáceo', S: 'silíceo', V: 'basáltico', M: 'metálico', cometa: 'núcleo de cometa'
};

// Generador pseudoaleatorio reproducible (mulberry32): cada asteroide sale siempre igual
function aleatorio(semilla) {
    let a = semilla >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Textura que se repite sin costuras (para el mapeado triplanar)
function crearTexturaRepetible(base, manchas, rnd) {
    const N = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = N;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, N, N);
    const circulo = (x, y, r, estilo, relleno) => {
        for (const dx of [-N, 0, N]) {
            for (const dy of [-N, 0, N]) {
                ctx.beginPath();
                ctx.arc(x + dx, y + dy, r, 0, 2 * Math.PI);
                if (relleno) { ctx.fillStyle = estilo; ctx.fill(); } else { ctx.strokeStyle = estilo; ctx.stroke(); }
            }
        }
    };
    // Variaciones suaves grandes y mucho grano fino, para que no se vean "lunares"
    for (let i = 0; i < 40; i++) {
        const claro = rnd() < 0.5;
        circulo(rnd() * N, rnd() * N, 30 + rnd() * 90, claro ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.07)', true);
    }
    for (let i = 0; i < 6000; i++) {
        const claro = rnd() < 0.5;
        const alfa = 0.04 + rnd() * 0.1;
        circulo(rnd() * N, rnd() * N, 0.5 + rnd() ** 3 * 4, claro ? `rgba(255,255,255,${alfa * 0.7})` : `rgba(0,0,0,${alfa})`, true);
    }
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 25; i++) circulo(rnd() * N, rnd() * N, 2 + rnd() ** 2 * 12, manchas, false);
    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
    return textura;
}

// Material con proyección triplanar: no necesita coordenadas UV (los modelos STL no las tienen)
function crearMaterial(clase, rnd) {
    const a = ASPECTOS[clase];
    const material = new THREE.MeshStandardMaterial({
        map: crearTexturaRepetible(a.base, a.manchas, rnd), metalness: a.metal, roughness: a.rugosidad
    });
    material.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vPosObj;\nvarying vec3 vNormObj;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosObj = position;\nvNormObj = normal;');
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vPosObj;\nvarying vec3 vNormObj;')
            .replace('#include <map_fragment>', `
                vec3 pesos = pow(abs(normalize(vNormObj)), vec3(4.0));
                pesos /= pesos.x + pesos.y + pesos.z;
                vec3 p = vPosObj * 0.8;
                diffuseColor *= texture2D(map, p.yz) * pesos.x + texture2D(map, p.xz) * pesos.y + texture2D(map, p.xy) * pesos.z;`);
    };
    material.customProgramCacheKey = () => 'roca-triplanar';
    return material;
}

// Forma irregular única: elipsoide con cráteres y bultos. Los cuerpos grandes son casi esféricos.
function crearForma(rnd, diametro) {
    const grande = Math.min(1, (diametro || 10) / 400); // 0 = pequeño e irregular, 1 = casi esférico
    // Ejes del elipsoide: los pequeños suelen ser alargados (tipo patata)
    const irregular = 1 - grande * 0.9;
    const ejes = [1, 1 - irregular * (0.15 + rnd() * 0.35), 1 - irregular * (0.25 + rnd() * 0.35)];
    const crateres = Array.from({ length: 18 + Math.floor(rnd() * 20) }, () => ({
        centro: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        radio: 0.08 + rnd() ** 2 * 0.45,
        profundidad: (0.03 + rnd() * 0.08) * (1 - grande * 0.6)
    }));
    const bultos = Array.from({ length: 6 }, () => ({
        centro: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        radio: 0.5 + rnd() * 0.6,
        altura: (rnd() - 0.5) * 0.4 * (1 - grande)
    }));

    // Relieve rocoso: suma de ondulaciones en direcciones aleatorias, cada vez más finas
    const ondas = Array.from({ length: 24 }, (_, k) => ({
        dir: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        frecuencia: 2 + k * 1.6,
        fase: rnd() * 2 * Math.PI,
        amplitud: 0.06 * (1 - grande * 0.7) / (1 + k * 0.45)
    }));

    let geometry = new THREE.IcosahedronGeometry(1, 6);
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    geometry = mergeVertices(geometry);
    const pos = geometry.attributes.position;
    const dir = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        dir.fromBufferAttribute(pos, i).normalize();
        let h = 1;
        for (const o of ondas) h += o.amplitud * Math.sin(o.frecuencia * dir.dot(o.dir) + o.fase);
        for (const b of bultos) {
            const ang = dir.angleTo(b.centro);
            h += b.altura * Math.exp(-((ang / b.radio) ** 2));
        }
        for (const c of crateres) {
            const x = dir.angleTo(c.centro) / c.radio;
            if (x < 1) h -= c.profundidad * (1 - x * x);
            h += c.profundidad * 0.35 * Math.exp(-(((x - 1) / 0.25) ** 2)); // borde del cráter
        }
        pos.setXYZ(i, dir.x * h * ejes[0], dir.y * h * ejes[1], dir.z * h * ejes[2]);
    }
    geometry.computeVertexNormals();
    return geometry;
}

const cargador = new GLTFLoader();
const cacheModelos = {};

function cargarModelo(archivo) {
    cacheModelos[archivo] ??= cargador.loadAsync(`../models/${archivo}`).then(gltf => {
        let geometry = null;
        gltf.scene.traverse(o => { if (o.isMesh && !geometry) geometry = o.geometry; });
        geometry.rotateX(-Math.PI / 2); // en los modelos de forma, el eje de giro es Z
        geometry.computeVertexNormals();
        geometry.userData.compartida = true; // se reutiliza entre selecciones: no se libera
        return geometry;
    });
    return cacheModelos[archivo];
}

/**
 * Crea la roca de un asteroide o cometa. Devuelve un grupo orientado según su polo cuyo hijo
 * `girar` rota sobre el eje. Si existe un modelo real, sustituye a la forma generada al cargarse.
 */
export function crearRoca(cuerpo, esCometa) {
    const rnd = aleatorio(cuerpo.spkid || 1);
    const clase = claseEspectral(cuerpo, esCometa);
    const malla = new THREE.Mesh(crearForma(rnd, cuerpo.diametro), crearMaterial(clase, rnd));
    const archivo = MODELOS[cuerpo.spkid];
    if (archivo) {
        cargarModelo(archivo).then(geometry => {
            malla.geometry.dispose();
            malla.geometry = geometry;
        }).catch(() => { /* sin modelo: se queda la forma generada */ });
    }
    const grupo = new THREE.Group();
    grupo.add(malla);
    grupo.girar = malla;
    grupo.modeloReal = Boolean(archivo);
    return grupo;
}

export function liberarRoca(roca) {
    const malla = roca.girar;
    if (!malla.geometry.userData.compartida) malla.geometry.dispose();
    malla.material.map.dispose();
    malla.material.dispose();
}

// Textura sencilla con manchas y cráteres (lunas sin textura propia)
export function crearTextura(base, oscuro) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
        const g = Math.floor(Math.random() * 60);
        ctx.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${g / 255})` : `rgba(255,255,255,${g / 400})`;
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 10, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.strokeStyle = oscuro;
    for (let i = 0; i < 25; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 14, 0, 2 * Math.PI);
        ctx.stroke();
    }
    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    return textura;
}
