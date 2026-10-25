import * as THREE from 'three';

// Texturas de alta resolución bajo demanda: se descargan en segundo plano cuando la cámara se acerca
// a un astro y sustituyen a la versión ligera. Usan su propio gestor de carga para no reabrir la
// pantalla de carga inicial.
const cargador = new THREE.TextureLoader(new THREE.LoadingManager());
const registros = [];
let anisotropia = 8;

export function configurarHD(renderer) {
    anisotropia = renderer.capabilities.getMaxAnisotropy();
}

/**
 * @param {THREE.Object3D} objeto - objeto cuya distancia a la cámara decide la carga
 * @param {Function} tamaño - tamaño() radio visible actual
 * @param {Array<{material, propiedad, archivo, color}>} texturas - qué mapa sustituir en cada material
 */
export function registrarHD(objeto, tamaño, texturas) {
    registros.push({ objeto, tamaño, texturas, estado: 'pendiente' });
}

export function actualizarHD(camera, { alEmpezar, alCargar } = {}) {
    for (const r of registros) {
        if (r.estado !== 'pendiente') continue;
        if (camera.position.distanceTo(r.objeto.position) > r.tamaño() * 25) continue;
        r.estado = 'cargando';
        alEmpezar?.();
        Promise.all(r.texturas.map(({ material, propiedad, archivo, color = true }) =>
            cargador.loadAsync(`../texturas/hd/${archivo}`).then(textura => {
                if (color) textura.colorSpace = THREE.SRGBColorSpace;
                textura.anisotropy = anisotropia;
                const anterior = material[propiedad];
                material[propiedad] = textura;
                anterior?.dispose();
            })
        )).then(() => { r.estado = 'lista'; alCargar?.(); })
          .catch(() => { r.estado = 'error'; });
    }
}

export const hayCargasHD = () => registros.some(r => r.estado === 'cargando');
