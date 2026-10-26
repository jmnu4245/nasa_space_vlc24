import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { calcularDiaJulianoActual } from './julianthings.js';
import { updateCameraPosition } from './cameracontrol.js';
import CelestialBody from './CelestialBody.js';
import Luna from './lunas.js';
import CuerposMenores from './smallbodies.js';
import Colas from './colas.js';
import Cinturones from './cinturones.js';
import Naves, { MISIONES } from './naves.js';
import Etiquetas from './etiquetas.js';
import Tour from './tour.js';
import { crearRoca, liberarRoca, claseEspectral } from './rocas.js';
import { setupLighting } from './lights.js';
import { cargarTextura, crearAtmosfera, decorarTierra, crearAnillos } from './materiales.js';
import { añadirSombras, actualizarSombras } from './sombras.js';
import { configurarHD, registrarHD, actualizarHD } from './texturasHD.js';
import { gmst } from './efemerides.js';
import { generarEventos } from './eventos.js';
import { crearUI } from './ui.js';
import Sonido from './sonido.js';
import Cartografia from './cartografia.js';
import HUD, { decodificar } from './hud.js';
import { crearPaseCine } from './postproceso.js';
import { kepler } from './calculos.js';
import VistaSuperficie, { CIELOS } from './superficie.js';
import { t, tr, idioma } from './i18n.js';
import { PLANETAS, POLOS, ENANOS, LUNAS, FICHAS, SCALE_SIZE, SCALE_DISTANCE } from './datos.js';

const $ = id => document.getElementById(id);
const guardar = (clave, valor) => { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } };
const local = () => (idioma === 'es' ? 'es-ES' : 'en-GB');
const fmt = (x, d = 4) => x.toLocaleString(local(), { maximumSignificantDigits: d });
const fmtAños = x => x.toLocaleString(local(), { minimumSignificantDigits: 4, maximumSignificantDigits: 4 }); // 1,000 años
const nombreLocal = o => (idioma === 'es' || !o.en ? o.nombre : o.en);
const esMovil = window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;
const UA_KM = 149597870.7;
const KM_POR_UNIDAD = UA_KM / SCALE_DISTANCE;
// Factor que lleva los tamaños ampliados a la misma escala que las distancias (≈ 1/43)
const FACTOR_REAL = SCALE_DISTANCE / (UA_KM * SCALE_SIZE);

// ---------- Pantalla de carga: secuencia de arranque ----------
const ocultarCarga = () => $('carga').classList.add('oculta');
function lineaArranque(texto, pendiente = false) {
    const li = document.createElement('li');
    li.textContent = texto;
    li.classList.toggle('pendiente', pendiente);
    $('carga-log').appendChild(li);
    return li;
}
const pasosArranque = t('arranque');
lineaArranque(pasosArranque[0]);
lineaArranque(pasosArranque[1]);
lineaArranque(t('arranque')[2].replace('{0}', new Date().toISOString().slice(11, 19)));
const lineaTexturas = lineaArranque(pasosArranque[3].replace('{0}', 0).replace('{1}', '…'), true);
let texturasListas = false, catalogoListo = false;
function quizaTerminarArranque() {
    if (!texturasListas || !catalogoListo) return;
    lineaArranque(pasosArranque[5]);
    setTimeout(ocultarCarga, 500);
}
THREE.DefaultLoadingManager.onProgress = (url, cargados, total) => {
    $('carga-progreso').style.width = `${100 * cargados / total}%`;
    lineaTexturas.textContent = pasosArranque[3].replace('{0}', cargados).replace('{1}', total);
};
THREE.DefaultLoadingManager.onLoad = () => {
    lineaTexturas.classList.remove('pendiente');
    texturasListas = true;
    quizaTerminarArranque();
};
setTimeout(ocultarCarga, 20000); // por si alguna textura no llega nunca

// ---------- Escena y render ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.000001, 400000);
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
configurarHD(renderer);

// Post-procesado: el bloom solo afecta a lo que brilla por encima de 1 (el Sol)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.6, 1.0));
const paseCine = crearPaseCine();
composer.addPass(paseCine);
composer.addPass(new OutputPass());

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    paseCine.redimensionar(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
});
paseCine.redimensionar(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
setupLighting(scene);

// Vía Láctea de fondo (versión más ligera en el móvil); su brillo se regula desde Capas
const fondo = new THREE.Mesh(
    new THREE.SphereGeometry(150000, 64, 64),
    new THREE.MeshBasicMaterial({ map: cargarTextura(esMovil ? 'fondo_4k.jpg' : 'fondo_8k.jpg'), side: THREE.BackSide, depthWrite: false })
);
scene.add(fondo);

// ---------- Cuerpos principales: Sol, planetas y planetas enanos ----------
const planetas = PLANETAS.map((d, i) => CelestialBody.planeta(d, POLOS[i]));
const enanos = ENANOS.map(d => CelestialBody.enano(d));
const principales = [...planetas, ...enanos];
const porNombre = Object.fromEntries(principales.map(c => [c.nombre, c]));
const orbitas = [];
const OPACIDAD_ORBITA = 0.2;
for (const cuerpo of principales) {
    scene.add(cuerpo.crearMesh());
    if (cuerpo.fijo) continue;
    const orbita = cuerpo.crearOrbita(cuerpo.enano ? 2048 : 720);
    // Órbitas en blanco tenue; las de los planetas enanos, discontinuas
    orbita.material = cuerpo.enano
        ? new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 3, gapSize: 3, transparent: true, opacity: OPACIDAD_ORBITA * 0.7 })
        : new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: OPACIDAD_ORBITA });
    if (cuerpo.enano) orbita.computeLineDistances();
    cuerpo.orbita = orbita;
    orbitas.push(orbita);
    scene.add(orbita);
}
const [sol, , venus, tierra, marte, , saturno, urano, neptuno] = planetas;
// La Tierra gira según el tiempo sidéreo: cada meridiano mira al Sol a su hora real
tierra.fijarOrientacionAbsoluta(gmst);

const lunas = LUNAS.map(d => new Luna(d, porNombre[d.planeta]));
for (const luna of lunas) scene.add(luna.mesh, luna.orbita);
const luna = lunas.find(l => l.nombre === 'Luna');

// Sombras: cada cuerpo puede ser eclipsado por sus lunas y cada luna por su planeta
const oclusoresDe = cuerpo => lunas.filter(l => l.planeta === cuerpo).map(l => ({ objeto: l.mesh, radio: l.tamaño }));
for (const l of lunas) {
    añadirSombras(l.mesh.material, [{ objeto: l.planeta.mesh, radio: l.planeta.tamaño }], null, null, l.precisa ? 'luna-tierra' : 'luna',
        { rojizo: l.precisa });
}
decorarTierra(tierra, oclusoresDe(tierra));
const anilloSaturno = crearAnillos(saturno);
for (const cuerpo of principales) {
    if (cuerpo.fijo || cuerpo === tierra) continue;
    añadirSombras(cuerpo.esfera.material, oclusoresDe(cuerpo), cuerpo === saturno ? anilloSaturno : null, null, cuerpo.nombre);
}
venus.mesh.add(crearAtmosfera(venus.tamaño, 0xffd9a0, 1.2));
marte.mesh.add(crearAtmosfera(marte.tamaño, 0xff9a70, 0.6));
urano.mesh.add(crearAtmosfera(urano.tamaño, 0x9fe8ff, 0.9));
neptuno.mesh.add(crearAtmosfera(neptuno.tamaño, 0x6f9bff, 0.9));
porNombre['Plutón'].mesh.add(crearAtmosfera(porNombre['Plutón'].tamaño, 0x9fc4ff, 0.3));

// Texturas de alta resolución (NASA) que se descargan al acercarse
const tamañoDe = cuerpo => () => cuerpo.tamaño * escala.valor;
registrarHD(tierra.mesh, tamañoDe(tierra), [
    { material: tierra.esfera.material, propiedad: 'map', archivo: 'tierra.jpg' },
    { material: tierra.esfera.material, propiedad: 'emissiveMap', archivo: 'tierra_noche.jpg' },
    { material: tierra.nubes.material, propiedad: 'alphaMap', archivo: 'tierra_nubes.jpg', color: false }
]);
for (const [nombre, archivo] of [['Marte', 'marte.jpg'], ['Mercurio', 'mercurio.jpg'], ['Júpiter', 'jupiter.jpg'], ['Plutón', 'pluton.jpg']]) {
    const cuerpo = porNombre[nombre];
    registrarHD(cuerpo.mesh, tamañoDe(cuerpo), [{ material: cuerpo.esfera.material, propiedad: 'map', archivo }]);
}
registrarHD(luna.mesh, () => luna.tamaño * escala.valor, [{ material: luna.mesh.material, propiedad: 'map', archivo: 'luna.jpg' }]);

// ---------- Cuerpos menores y naves ----------
const asteroides = new CuerposMenores(0xcfd0d3, 4);
const cometas = new CuerposMenores(0xf2f4f8, 5);
const colas = new Colas(cometas);
const cinturones = new Cinturones();
const naves = new Naves();
const carta = new Cartografia();
scene.add(carta.grupo);
scene.add(asteroides.points, cometas.points, colas.grupo, cinturones.grupo, naves.grupo);

// "1 Ceres (A801 AA)" → "Ceres", "1P/Halley" → "Halley"
function nombreCorto(completo) {
    const sinDesignacion = completo.replace(/\s*\([^)]*\)\s*$/, '');
    return sinDesignacion.match(/^\d+\s+(.+)$/)?.[1] ?? sinDesignacion.match(/^\d*[PCDI]\/(.+)$/)?.[1] ?? sinDesignacion;
}

// ---------- Sonido ambiental ----------
const sonido = new Sonido();
for (const evento of ['pointerdown', 'keydown']) window.addEventListener(evento, () => sonido.iniciar(), { once: true });
let movimientoCamara = 0;   // giro acumulado en el fotograma (rad), para el viento
let panViento = 0;
let vientoSuave = 0;

// ---------- Estado ----------
let tiempo = calcularDiaJulianoActual();
let diasPorSegundo = 1;
let pausado = false;
const escala = { valor: 1, objetivo: 1 }; // 1 = tamaños ampliados; FACTOR_REAL = escala real
let orbitaAutomatica = 0;                // giro lento de la cámara (modo cine), rad/s

// ---------- Luz del cursor ----------
// Al acercar el puntero a un astro aparece un halo a su alrededor y una luz que ilumina su
// superficie en la zona hacia la que apunta el cursor (también en la cara nocturna).
function crearTexturaHalo() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.22, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
}
const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: crearTexturaHalo(), color: 0xffffff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
}));
halo.visible = false;
const luzCursor = new THREE.PointLight(0xffffff, 0, 1, 2); // se crea desde el principio para no recompilar materiales
scene.add(halo, luzCursor);
const cercania = { objeto: null, tamaño: 1, valor: 0, objetivo: 0, color: new THREE.Color(), ilumina: true };
let rayoCursor = null; // rayo de cámara bajo el puntero

// ---------- Cámara ----------
const cameraData = { center: new THREE.Vector3(), theta: -0.6, phi: 0.95 };
let radius = 320, minZoom = 1, maxZoom = 7000;
let objetivo = sol.mesh;   // objeto 3D que sigue la cámara
let transicion = null;     // vuelo animado de la cámara hacia un nuevo objetivo
const suavizar = k => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
const anguloCorto = (desde, hasta) => desde + Math.atan2(Math.sin(hasta - desde), Math.cos(hasta - desde));

/**
 * Mueve la cámara suavemente hasta `objeto`, terminando a `radioFinal`.
 * `direccion` (opcional) fija desde dónde mirar: vector unitario del objetivo hacia la cámara.
 */
function enfocar(objeto, radioFinal, radioMinimo, { phi = null, direccion = null } = {}) {
    minZoom = radioMinimo;
    const distancia = cameraData.center.distanceTo(objeto.position);
    const thetaHasta = direccion ? anguloCorto(cameraData.theta, Math.atan2(direccion.z, direccion.x)) : cameraData.theta;
    const phiHasta = direccion ? Math.acos(THREE.MathUtils.clamp(direccion.y, -0.999, 0.999)) : (phi ?? cameraData.phi);
    transicion = {
        desde: cameraData.center.clone(), radioDesde: radius, radioHasta: radioFinal, distancia,
        phiDesde: cameraData.phi, phiHasta, thetaDesde: cameraData.theta, thetaHasta,
        inicio: performance.now(), duracion: 1300 + Math.min(1700, distancia * 1.5), radio: true
    };
    objetivo = objeto;
    if (distancia > radioFinal * 2 || Math.abs(Math.log(radius / radioFinal)) > 1) sonido.vuelo(transicion.duracion / 1000);
}

function seguirObjetivo() {
    if (!transicion) {
        cameraData.center.copy(objetivo.position);
        return;
    }
    const k = Math.min(1, (performance.now() - transicion.inicio) / transicion.duracion);
    const e = suavizar(k);
    cameraData.center.lerpVectors(transicion.desde, objetivo.position, e);
    cameraData.phi = THREE.MathUtils.lerp(transicion.phiDesde, transicion.phiHasta, e);
    cameraData.theta = THREE.MathUtils.lerp(transicion.thetaDesde, transicion.thetaHasta, e);
    if (transicion.radio) {
        // Zoom con interpolación logarítmica, alejándose a mitad de camino en los viajes largos
        const r = Math.exp(THREE.MathUtils.lerp(Math.log(transicion.radioDesde), Math.log(transicion.radioHasta), e));
        radius = Math.max(r, transicion.distancia * 0.5 * Math.sin(Math.PI * e));
    }
    if (k >= 1) transicion = null;
}

// ---------- Selección ----------
let menorSel = null; // { cuerpo, roca, orbita, tamaño }
let idSeleccionado = null;
let orbitaResaltada = null;

function quitarSeleccionMenor() {
    if (!menorSel) return;
    scene.remove(menorSel.roca, menorSel.orbita);
    liberarRoca(menorSel.roca);
    menorSel.orbita.geometry.dispose();
    menorSel = null;
}

// La órbita del objeto seleccionado se ilumina
function resaltarOrbita(orbita) {
    orbitaResaltada = orbita;
    if (orbita) orbita.material.opacity = 0.75;
}

function marcar(id, objeto3d) {
    if (id && id !== idSeleccionado) sonido.seleccion();
    idSeleccionado = id;
    ui.marcarNavegacion(id ?? 'vista-general');
    etiquetas.marcarSeleccionado(objeto3d);
    history.replaceState(null, '', id ? `#o=${encodeURIComponent(id)}` : location.pathname + location.search);
}

const filasFicha = nombre => (FICHAS[nombre]?.datos ?? []).map(([k, v]) => [t(k === 'lunas' ? 'lunasFila' : k), tr(v)]);

function seleccionarPrincipal(cuerpo) {
    quitarSeleccionMenor();
    // Saturno se encuadra con sus anillos
    const tamaño = cuerpo.tamaño * escala.valor * (cuerpo === saturno ? 2.4 : cuerpo.ejes ? 1.3 : 1);
    enfocar(cuerpo.mesh, tamaño * 5, tamaño * 1.3);
    marcar(cuerpo.nombre, cuerpo.mesh);
    resaltarOrbita(cuerpo.orbita ?? null);
    const fichaDatos = FICHAS[cuerpo.nombre];
    ui.mostrarFicha(() => ({
        nombre: nombreLocal(cuerpo),
        tipo: tr(fichaDatos.tipo),
        texto: tr(fichaDatos.texto),
        filas: [
            ...filasFicha(cuerpo.nombre),
            ...(cuerpo.fijo ? [] : [[t('periodoOrbital'), `${fmtAños(cuerpo.periodo() / 365.25)} ${t('anios')}`]])
        ]
    }), cuerpo.fijo ? null : cuerpo, { cielo: !cuerpo.fijo });
}

function seleccionarLuna(l) {
    quitarSeleccionMenor();
    const tamaño = l.tamaño * escala.valor;
    enfocar(l.mesh, tamaño * 5, tamaño * 1.3);
    marcar(l.nombre, l.mesh);
    resaltarOrbita(l.orbita);
    const d = l.datos;
    const fichaDatos = FICHAS[l.nombre];
    ui.mostrarFicha(() => ({
        nombre: nombreLocal(l),
        tipo: fichaDatos ? tr(fichaDatos.tipo) : t('lunaDe', nombreLocal(l.planeta)),
        texto: fichaDatos ? tr(fichaDatos.texto) : '',
        filas: [
            [t('diametro'), `${fmt(2 * d.radio)} km`],
            [t('distanciaPlaneta'), `${fmt(l.precisa ? l.offsetKm.length() : d.distancia)} km`],
            [t('periodoOrbital'), `${fmt(Math.abs(d.periodo))} ${t('dias')}${d.periodo < 0 ? ` (${t('retrograda')})` : ''}`]
        ]
    }), null, { vivo: l.precisa, cielo: true });
}

function seleccionarMenor(nube, i) {
    quitarSeleccionMenor();
    const cuerpo = nube.cuerpos[i];
    const esCometa = nube === cometas;
    // Si estaba oculto por la cantidad elegida en Capas, se amplía para incluirlo
    if (i >= nube.cantidad) {
        nube.setCantidad(i + 1);
        ui.configurarDeslizador(esCometa ? 'cometas' : 'asteroides', nube.cuerpos.length, i + 1);
    }
    const roca = crearRoca(cuerpo, esCometa);
    roca.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cuerpo.direccionPolo());
    // Radio visual: proporcional al real pero acotado para que siempre se vea
    const tamaño = Math.max(0.05, Math.min(0.4, ((cuerpo.diametro || 5) / 2) * SCALE_SIZE * 40));
    roca.scale.setScalar(tamaño * escala.valor);
    cuerpo.color = 0xffffff;
    const orbita = cuerpo.crearOrbita(1024);
    orbita.material.transparent = true;
    orbita.material.opacity = 0.6;
    scene.add(roca, orbita);
    menorSel = { cuerpo, roca, orbita, tamaño };
    cuerpo.posicionEscena(tiempo, roca.position);
    enfocar(roca, tamaño * escala.valor * 5, tamaño * escala.valor * 1.3);
    marcar(`${esCometa ? 'com' : 'ast'}-${cuerpo.spkid}`, nube.vectores[i]);
    resaltarOrbita(null);
    const corto = nombreCorto(cuerpo.nombre);
    ui.mostrarFicha(() => ({
        nombre: corto,
        tipo: t(esCometa ? 'tipo_cometa' : 'tipo_asteroide'),
        texto: cuerpo.nombre !== corto ? cuerpo.nombre : '',
        filas: [
            [t('diametro'), cuerpo.diametro ? `${fmt(cuerpo.diametro)} km` : t('desconocido')],
            ...(esCometa ? [] : [[t('tipoEspectral'), `${cuerpo.spec || '?'} · ${t(`clase_${claseEspectral(cuerpo, false)}`)}`]]),
            ...(cuerpo.rotacion ? [[t('rotacion'), `${fmt(cuerpo.rotacion * 24)} ${t('horas')}`]] : []),
            [t('semieje'), `${fmt(cuerpo.a)} UA`],
            [t('excentricidad'), fmt(cuerpo.e)],
            [t('periodoOrbital'), `${fmtAños(cuerpo.periodo() / 365.25)} ${t('anios')}`]
        ],
        nota: roca.modeloReal ? t('formaReal') : ''
    }), cuerpo);
}

function tiempoLuz(km) {
    const s = km / 299792.458;
    return s < 120 ? `${fmt(s, 3)} ${t('segundosLuz')}` : s < 7200 ? `${fmt(s / 60, 3)} ${t('minutosLuz')}` : `${fmt(s / 3600, 3)} ${t('horasLuz')}`;
}

function seleccionarNave(nave) {
    quitarSeleccionMenor();
    enfocar(nave.marcador, Math.max(radius * 0.3, 3), 0.0005);
    marcar(`nave-${nave.nombre}`, nave.marcador);
    resaltarOrbita(null);
    const mision = MISIONES[nave.nombre];
    ui.mostrarFicha(() => {
        const activa = nave.activa(tiempo);
        const km = nave.distanciaSolUA * UA_KM;
        return {
            nombre: nave.nombre,
            tipo: t('tipo_nave'),
            texto: tr(mision.texto),
            filas: [
                [t('lanzamiento'), new Date(mision.lanzamiento).toLocaleDateString(local(), { day: 'numeric', month: 'short', year: 'numeric' })],
                ...(activa ? [
                    [t('distanciaSolUA'), `${fmt(nave.distanciaSolUA)} UA`],
                    [t('velocidad'), `${fmt(nave.velocidad, 3)} km/s`],
                    [t('luzTarda'), tiempoLuz(km)]
                ] : [])
            ],
            nota: activa ? '' : t('fueraDeRango')
        };
    }, null, { vivo: true });
}

function vistaGeneral() {
    quitarSeleccionMenor();
    enfocar(sol.mesh, 320, sol.tamaño * escala.valor * 1.3, { phi: 0.95 });
    marcar(null, null);
    resaltarOrbita(null);
    ui.ocultarFicha();
}

// ---------- Registro de objetos seleccionables (buscador, URL, regla, eventos) ----------
const registro = new Map(); // id → { id, tipo, nombre(), claves, seleccionar(), objeto3d, km(v) }
const normalizar = texto => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function registrar(entrada) {
    entrada.claves = entrada.claves.filter(Boolean).map(normalizar);
    registro.set(entrada.id, entrada);
}
const kmHelio = objeto => v => v.copy(objeto.position).multiplyScalar(KM_POR_UNIDAD);
for (const c of principales) {
    registrar({ id: c.nombre, tipo: c.fijo ? 'estrella' : c.enano ? 'enano' : 'planeta', nombre: () => nombreLocal(c),
        claves: [c.nombre, c.en], seleccionar: () => seleccionarPrincipal(c), objeto3d: c.mesh, km: kmHelio(c.mesh) });
}
for (const l of lunas) {
    registrar({ id: l.nombre, tipo: 'luna', nombre: () => nombreLocal(l), claves: [l.nombre, l.en],
        seleccionar: () => seleccionarLuna(l), objeto3d: l.mesh,
        km: v => kmHelio(l.planeta.mesh)(v).add(l.offsetKm) });
}

function buscar(texto) {
    const q = normalizar(texto.trim());
    const puntuar = o => {
        if (o.claves.some(c => c === q)) return 0;
        if (o.claves.some(c => c.startsWith(q))) return 1;
        if (o.claves.some(c => c.split(/[\s/()-]+/).some(p => p.startsWith(q)))) return 2;
        if (o.claves.some(c => c.includes(q))) return 3;
        return Infinity;
    };
    return [...registro.values()]
        .map(o => ({ o, p: puntuar(o) }))
        .filter(r => r.p < Infinity)
        .sort((a, b) => a.p - b.p)
        .map(({ o }) => ({ id: o.id, tipo: o.tipo, nombre: o.nombre() }));
}

// ---------- Regla: distancia entre dos objetos ----------
const regla = {
    activa: false,
    puntos: [],
    linea: new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthTest: false }))
};
regla.linea.visible = false;
regla.linea.frustumCulled = false;
scene.add(regla.linea);

function alternarRegla() {
    regla.activa = !regla.activa;
    regla.puntos = [];
    regla.linea.visible = false;
    $('regla-etiqueta').hidden = true;
    ui.setReglaActiva(regla.activa);
    if (regla.activa) ui.avisar(t('reglaInicio'), 3500);
}

function añadirPuntoRegla(entrada) {
    if (regla.puntos.length >= 2) regla.puntos = [];
    regla.puntos.push(entrada);
    if (regla.puntos.length === 1) ui.avisar(t('reglaSegundo'), 2500);
}

const vA = new THREE.Vector3(), vB = new THREE.Vector3();
function actualizarRegla() {
    if (!regla.activa || regla.puntos.length < 2) return;
    const [a, b] = regla.puntos;
    const posiciones = regla.linea.geometry.attributes.position;
    posiciones.setXYZ(0, ...a.objeto3d.position.toArray());
    posiciones.setXYZ(1, ...b.objeto3d.position.toArray());
    posiciones.needsUpdate = true;
    regla.linea.visible = true;
    const km = a.km(vA).distanceTo(b.km(vB));
    // Etiqueta en el punto medio de la línea, sobre la pantalla
    vA.addVectors(a.objeto3d.position, b.objeto3d.position).multiplyScalar(0.5).project(camera);
    const el = $('regla-etiqueta');
    el.hidden = vA.z > 1;
    el.style.transform = `translate(${(vA.x * 0.5 + 0.5) * window.innerWidth}px, ${(-vA.y * 0.5 + 0.5) * window.innerHeight}px) translate(-50%, -50%)`;
    el.innerHTML = `<small>${a.nombre()} — ${b.nombre()}</small>${fmt(km, 4)} km · ${fmt(km / UA_KM, 4)} UA<br><small>${tiempoLuz(km)}</small>`;
}

// ---------- Eventos astronómicos ----------
let listaEventos = null;
function eventos() {
    listaEventos ??= generarEventos({ tierra, planetas: [marte, porNombre['Júpiter'], saturno, urano, neptuno], cometas: cometas.cuerpos },
        calcularDiaJulianoActual());
    return listaEventos;
}

function irAEvento(ev) {
    tiempo = ev.jd;
    ui.reiniciarFisica();
    const id = ev.objetivo ?? buscar(ev.buscar)[0]?.id;
    const entrada = registro.get(id);
    // Los sobrevuelos solo son correctos con los tamaños reales (si no, la nave atravesaría el planeta ampliado)
    if (ev.tipo === 'mision') {
        ui.fijarCapa('escalaReal', true);
        escala.valor = escala.objetivo = FACTOR_REAL;
        escala.transicion = null; // sin animación: el encuadre del evento manda
        aplicarEscala();
    }
    for (const c of principales) c.actualizarPosicion(tiempo);
    lunas.forEach(l => l.actualizar(tiempo, escala.valor));
    naves.actualizar(tiempo);
    if (!entrada) return;
    entrada.seleccionar();
    // Encuadre según el tipo de evento
    const direccion = new THREE.Vector3();
    if (ev.tipo === 'eclipse-sol') {
        // Punto donde el eje de la sombra (Sol → Luna) corta la Tierra: la cámara lo mira de frente
        const eje = new THREE.Vector3().copy(luna.mesh.position).normalize();
        const centro = tierra.mesh.position;
        const masCercano = luna.mesh.position.clone().addScaledVector(eje, eje.dot(new THREE.Vector3().subVectors(centro, luna.mesh.position)));
        const desvio = masCercano.clone().sub(centro);
        const R = tierra.tamaño * escala.valor;
        if (desvio.length() < R) masCercano.addScaledVector(eje, -Math.sqrt(R * R - desvio.lengthSq()));
        direccion.subVectors(masCercano, centro).normalize();
        enfocar(tierra.mesh, tierra.tamaño * escala.valor * 4, tierra.tamaño * escala.valor * 1.3, { direccion });
    } else if (ev.tipo === 'eclipse-luna') {
        direccion.subVectors(tierra.mesh.position, luna.mesh.position).normalize(); // la Luna vista desde la Tierra
        direccion.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.35);
        enfocar(luna.mesh, luna.tamaño * escala.valor * 6, luna.tamaño * escala.valor * 1.3, { direccion });
    } else if (ev.tipo === 'oposicion') {
        direccion.subVectors(tierra.mesh.position, entrada.objeto3d.position).normalize();
        const c = porNombre[id];
        enfocar(c.mesh, c.tamaño * escala.valor * (c === saturno ? 12 : 5), c.tamaño * escala.valor * 1.3, { direccion });
    } else if (ev.tipo === 'mision') {
        enfocar(entrada.objeto3d, 0.8, 0.0005);
    }
}

// ---------- Escala real ----------
function aplicarEscala() {
    for (const c of principales) c.mesh.scale.setScalar(escala.valor);
    if (menorSel) menorSel.roca.scale.setScalar(menorSel.tamaño * escala.valor);
}
function setEscalaReal(real) {
    const nueva = real ? FACTOR_REAL : 1;
    if (nueva === escala.objetivo) return;
    // La cámara acompaña al cambio de tamaño del objeto enfocado
    const k = nueva / escala.objetivo;
    escala.objetivo = nueva;
    escala.transicion = { desdeR: radius, hastaR: objetivo === sol.mesh && !idSeleccionado ? radius : radius * k, desdeMin: minZoom, hastaMin: minZoom * k, desde: escala.valor, inicio: performance.now() };
    if (real) ui.avisar(t('escalaActivada'), 3500);
}
function actualizarEscala() {
    const anim = escala.transicion;
    if (!anim) return;
    const k = Math.min(1, (performance.now() - anim.inicio) / 1600);
    const e = suavizar(k);
    escala.valor = Math.exp(THREE.MathUtils.lerp(Math.log(anim.desde), Math.log(escala.objetivo), e));
    radius = Math.exp(THREE.MathUtils.lerp(Math.log(anim.desdeR), Math.log(anim.hastaR), e));
    minZoom = Math.exp(THREE.MathUtils.lerp(Math.log(anim.desdeMin), Math.log(anim.hastaMin), e));
    aplicarEscala();
    if (k >= 1) escala.transicion = null;
}

// ---------- Vista desde la superficie ----------
const superficie = new VistaSuperficie(scene);

function verCielo() {
    if (superficie.activa) return;
    const principal = porNombre[idSeleccionado];
    const l = lunas.find(m => m.nombre === idSeleccionado);
    if ((!principal && !l) || principal?.fijo) {
        ui.avisar(t('verCielo'), 1500);
        return;
    }
    const cuerpo = principal ?? { nombre: l.nombre, mesh: l.mesh, esfera: l.mesh, tamaño: l.tamaño, planeta: l.planeta };
    // Los planetas se marcan con puntos de luz para encontrarlos desde cualquier distancia
    const astros = principales.filter(c => !c.fijo && c !== principal).map(c => c.mesh);
    superficie.activar(cuerpo, astros, sol.mesh.position);
    // Las etiquetas de lo que queda detrás del propio astro se ocultan
    etiquetas.filtro = objeto => objeto !== cuerpo.mesh && superficie.sobreHorizonte(objeto);
    cercania.objetivo = 0;
    ui.setModoSuperficie(true);
    sonido.vuelo(1.6);
}

function salirSuperficie() {
    if (!superficie.activa) return false;
    superficie.desactivar();
    superficie.restaurarCamara(camera);
    etiquetas.filtro = null;
    ui.setModoSuperficie(false);
    const id = idSeleccionado;
    idSeleccionado = null;
    registro.get(id)?.seleccionar();
    return true;
}

// Hora solar local en la Tierra (la longitud desplaza 1 h cada 15°)
function horaSolarLocal(lon) {
    const utc = ((tiempo + 0.5) % 1) * 24;
    const h = (utc + lon / 15 + 48) % 24;
    return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
}

// ---------- Foto ----------
// Renderiza la escena al doble de resolución (hasta 4096 px de ancho), sin interfaz, con un pie de foto discreto
function hacerFoto() {
    sonido.obturador();
    const flash = $('flash');
    flash.classList.remove('disparo');
    void flash.offsetWidth;
    flash.classList.add('disparo');

    const original = renderer.getPixelRatio();
    const ratio = original * Math.max(1, Math.min(2, 4096 / (window.innerWidth * original)));
    renderer.setPixelRatio(ratio);
    composer.setPixelRatio(ratio);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.render();
    const origen = renderer.domElement;
    const lienzo = document.createElement('canvas');
    lienzo.width = origen.width;
    lienzo.height = origen.height;
    const ctx = lienzo.getContext('2d');
    ctx.drawImage(origen, 0, 0); // en el mismo instante del render, antes de que se borre el búfer
    renderer.setPixelRatio(original);
    composer.setPixelRatio(original);
    composer.setSize(window.innerWidth, window.innerHeight);

    // Pie de foto: nombre, fecha UTC y firma
    const u = lienzo.width / 1600;
    const sombra = ctx.createLinearGradient(0, lienzo.height * 0.72, 0, lienzo.height);
    sombra.addColorStop(0, 'rgba(0,0,0,0)');
    sombra.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = sombra;
    ctx.fillRect(0, lienzo.height * 0.72, lienzo.width, lienzo.height * 0.28);
    const entrada = registro.get(idSeleccionado);
    const titulo = superficie.activa
        ? `${superficie.lugar.nombre ? `${superficie.lugar.nombre} · ` : ''}${entrada?.nombre() ?? ''}`
        : entrada?.nombre() ?? t('titulo');
    const fecha = new Date((tiempo - 2440587.5) * 86400000);
    const fechaTexto = Number.isNaN(fecha.getTime()) ? '' : `${fecha.toISOString().slice(0, 16).replace('T', '  ')} UTC`;
    const fuente = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 ${Math.round(34 * u)}px ${fuente}`;
    ctx.fillText(titulo.toUpperCase().split('').join(String.fromCharCode(8202)), 56 * u, lienzo.height - 88 * u);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = `500 ${Math.round(15 * u)}px ${fuente}`;
    ctx.fillText(fechaTexto, 56 * u, lienzo.height - 56 * u);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('NASA SPACE APPS · VALENCIA', lienzo.width - 56 * u, lienzo.height - 56 * u);

    lienzo.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const nombre = normalizar(titulo).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sistema-solar';
        a.download = `${nombre}-${fecha.toISOString?.().slice(0, 10) ?? ''}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        ui.avisar(t('fotoGuardada'));
    }, 'image/png');
}

// ---------- Recorrido guiado ----------
let estadoPrevioTour = null;
const app = {
    buscar,
    seleccionar: id => registro.get(id)?.seleccionar(),
    vistaGeneral,
    navegacion: [
        ...planetas.map(p => ({ id: p.nombre, anillo: 1, nombre: () => nombreLocal(p), textura: `../texturas/${p.textura}` })),
        ...enanos.map(e => ({ id: e.nombre, anillo: 2, nombre: () => nombreLocal(e), textura: `../texturas/${e.textura}` }))
    ],
    getTiempo: () => tiempo,
    setTiempo: jd => { tiempo = jd; },
    setVelocidad: v => { diasPorSegundo = v; },
    setPausado: p => { pausado = p; },
    setCapa(clave, valor) {
        switch (clave) {
            case 'etiquetas': etiquetas.setVisibles(valor); break;
            case 'orbitas': orbitas.forEach(o => { o.visible = valor; }); break;
            case 'lunas': lunas.forEach(l => { l.mesh.visible = l.orbita.visible = valor; }); break;
            case 'naves': naves.grupo.visible = valor; break;
            case 'cinturones': cinturones.grupo.visible = valor; break;
            case 'cartografia': carta.grupo.visible = valor; break;
            case 'colas': colas.grupo.visible = valor; break;
            case 'escalaReal': setEscalaReal(valor); break;
            case 'asteroides': asteroides.setCantidad(valor); break;
            case 'cometas': cometas.setCantidad(valor); break;
            case 'fondo':
                fondo.material.color.setScalar((valor / 100) ** 2);
                fondo.visible = valor > 0;
                guardar('brilloFondo', valor);
                break;
        }
    },
    urlActual() {
        const { indice, sentido, pausado: p } = ui.estadoVelocidad;
        const params = new URLSearchParams({ t: tiempo.toFixed(4), v: indice });
        if (idSeleccionado) params.set('o', idSeleccionado);
        if (sentido < 0) params.set('s', '-1');
        if (p) params.set('p', '1');
        return `${location.origin}${location.pathname}#${params}`;
    },
    alCambiarIdioma() {
        etiquetas.actualizarTextos();
        tour.pintar();
    },
    eventos,
    irAEvento,
    alternarRegla,
    cancelarRegla() {
        if (!regla.activa) return false;
        alternarRegla();
        return true;
    },
    iniciarTour: () => tour.iniciar(),
    verCielo,
    salirSuperficie,
    hacerFoto,
    sonidoClic: () => sonido.clic(),
    alternarSonido() {
        sonido.setActivo(!sonido.activo);
        ui.setSonido(sonido.activo);
        ui.avisar(t(sonido.activo ? 'sonidoActivado' : 'sonidoDesactivado'), 1500);
    },
    alEmpezarTour() {
        estadoPrevioTour = { ...ui.estadoVelocidad, carta: carta.grupo.visible };
        carta.grupo.visible = false; // en modo cine la carta celeste sobra
        if (regla.activa) alternarRegla();
        orbitaAutomatica = 0.05;
    },
    alTerminarTour() {
        orbitaAutomatica = 0;
        carta.grupo.visible = estadoPrevioTour.carta;
        ui.setVelocidadDesdeURL(estadoPrevioTour.indice, estadoPrevioTour.sentido);
        vistaGeneral();
    },
    irAParada(paso) {
        pausado = false;
        diasPorSegundo = paso.velocidad;
        if (paso.objetivo === 'vista-general') {
            vistaGeneral();
            enfocar(sol.mesh, paso.radio, 1, { phi: paso.phi });
            return;
        }
        const entrada = registro.get(paso.objetivo);
        if (!entrada) return;
        entrada.seleccionar();
        if (paso.factor) {
            const c = porNombre[paso.objetivo] ?? lunas.find(l => l.nombre === paso.objetivo);
            transicion.radioHasta = c.tamaño * escala.valor * paso.factor * (c === saturno ? 2.4 : 1);
        } else if (paso.radio) {
            transicion.radioHasta = paso.radio;
        }
        if (paso.phi) {
            transicion.phiHasta = paso.phi;
        } else if (entrada.objeto3d !== sol.mesh) {
            // Cámara del lado iluminado, girada ~40° para que el terminador dé relieve
            const dir = new THREE.Vector3().subVectors(sol.mesh.position, entrada.objeto3d.position).normalize()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.7);
            transicion.thetaHasta = anguloCorto(cameraData.theta, Math.atan2(dir.z, dir.x));
            transicion.phiHasta = Math.acos(THREE.MathUtils.clamp(dir.y, -0.99, 0.99)) - 0.3;
        }
    }
};

const etiquetas = new Etiquetas($('etiquetas'));
const ui = crearUI(app);
ui.setSonido(sonido.activo);
const tour = new Tour(app);

// ---------- Etiquetas ----------
// Con la regla activa, pulsar una etiqueta añade ese objeto a la medida en lugar de seleccionarlo
const accion = id => () => {
    const entrada = registro.get(id);
    if (!entrada || superficie.activa) return;
    if (regla.activa) añadirPuntoRegla(entrada);
    else entrada.seleccionar();
};
principales.forEach(c => etiquetas.añadir(() => nombreLocal(c), c.mesh, accion(c.nombre)));
// Rótulos de la carta celeste (grados de la eclíptica y constelaciones)
for (const a of carta.anclas) {
    const texto = typeof a.texto === 'string' ? a.texto : () => (idioma === 'es' ? a.texto.es : a.texto.en);
    etiquetas.añadir(texto, a.objeto, null, () => carta.grupo.visible);
    etiquetas.items.at(-1).el.classList.add(a.clase);
}
// Las lunas solo se etiquetan con la cámara cerca de su planeta
lunas.forEach(l => etiquetas.añadir(() => nombreLocal(l), l.mesh, accion(l.nombre),
    cam => l.mesh.visible && cam.position.distanceTo(l.planeta.mesh.position) < 8 * l.distancia * escala.valor, true));

// Cada asteroide/cometa tiene etiqueta clicable, visible si está activo y la cámara está cerca
function prepararMenores(nube, tipo) {
    nube.cuerpos.forEach((cuerpo, i) => {
        etiquetas.añadir(nombreCorto(cuerpo.nombre), { position: nube.vectores[i] }, accion(`${tipo === 'cometa' ? 'com' : 'ast'}-${cuerpo.spkid}`),
            cam => i < nube.cantidad && cam.position.distanceTo(nube.vectores[i]) < 250, true);
        const posicion = { get position() { return menorSel?.cuerpo === cuerpo ? menorSel.roca.position : nube.vectores[i]; } };
        registrar({ id: `${tipo === 'cometa' ? 'com' : 'ast'}-${cuerpo.spkid}`, tipo, nombre: () => nombreCorto(cuerpo.nombre),
            claves: [cuerpo.nombre, nombreCorto(cuerpo.nombre)], seleccionar: () => seleccionarMenor(nube, i), objeto3d: posicion,
            km: v => cuerpo.posicionEscena(tiempo, v).multiplyScalar(KM_POR_UNIDAD) });
    });
}
const CERES = 20000001; // se muestra como planeta enano, no como asteroide
const cargaMenores = Promise.all([
    asteroides.cargar('../datos/asteroides.json', d => d.spkid !== CERES).then(() => {
        asteroides.setCantidad(30);
        ui.configurarDeslizador('asteroides', asteroides.cuerpos.length, 30);
        prepararMenores(asteroides, 'asteroide');
    }),
    cometas.cargar('../datos/cometas.json').then(() => {
        cometas.setCantidad(15);
        ui.configurarDeslizador('cometas', cometas.cuerpos.length, 15);
        prepararMenores(cometas, 'cometa');
    }),
    naves.cargar('../datos/naves.json').then(() => {
        lineaArranque(pasosArranque[4].replace('{0}', asteroides.cuerpos.length + 1).replace('{1}', cometas.cuerpos.length).replace('{2}', naves.lista.length));
        catalogoListo = true;
        quizaTerminarArranque();
        for (const nave of naves.lista) {
            etiquetas.añadir(nave.nombre, nave.marcador, accion(`nave-${nave.nombre}`), () => nave.marcador.visible && naves.grupo.visible);
            etiquetas.items.at(-1).el.classList.add('nave');
            registrar({ id: `nave-${nave.nombre}`, tipo: 'nave', nombre: () => nave.nombre, claves: [nave.nombre],
                seleccionar: () => seleccionarNave(nave), objeto3d: nave.marcador, km: kmHelio(nave.marcador) });
        }
    })
]);

// ---------- Estado inicial desde la URL (#o=Tierra&t=2460000.5&v=4) ----------
const params = new URLSearchParams(location.hash.slice(1));
if (Number.isFinite(Number(params.get('t'))) && params.has('t')) tiempo = Number(params.get('t'));
if (params.has('v') || params.has('s')) ui.setVelocidadDesdeURL(Number(params.get('v') ?? 4), Number(params.get('s') ?? 1));
if (params.get('p') === '1') $('btn-play').click();
for (const c of principales) c.actualizarPosicion(tiempo);
cameraData.center.copy(sol.mesh.position);
ui.marcarNavegacion('vista-general');
const objetoInicial = params.get('o');
if (objetoInicial) {
    if (registro.has(objetoInicial)) app.seleccionar(objetoInicial);
    else cargaMenores.then(() => app.seleccionar(objetoInicial));
}

// ---------- Bucle de animación ----------
const reloj = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(reloj.getDelta(), 0.1);
    const dias = pausado ? 0 : diasPorSegundo * dt;
    tiempo += dias;

    actualizarEscala();
    for (const cuerpo of principales) {
        cuerpo.actualizarPosicion(tiempo);
        cuerpo.actualizarRotacion(dias, tiempo);
    }
    tierra.nubes.rotation.y += 2 * Math.PI * dias * 0.03; // las nubes se desplazan algo respecto al suelo
    lunas.forEach(l => l.actualizar(tiempo, escala.valor));
    asteroides.actualizar(tiempo);
    cometas.actualizar(tiempo);
    colas.actualizar(tiempo);
    cinturones.actualizar(tiempo);
    naves.actualizar(tiempo);
    if (menorSel) {
        menorSel.cuerpo.posicionEscena(tiempo, menorSel.roca.position);
        // Giro real según su periodo, limitado a media vuelta por segundo para que no parpadee
        const giro = menorSel.cuerpo.rotacion ? 2 * Math.PI * dias / menorSel.cuerpo.rotacion : dt * 0.3;
        menorSel.roca.girar.rotation.y += Math.sign(giro) * Math.min(Math.abs(giro), Math.PI * dt);
    }
    actualizarSombras();
    actualizarLuzCursor(dt);
    actualizarHD(camera, { alEmpezar: () => ui.avisar(t('cargandoHD'), 2500) });
    ui.tick(tiempo);

    // Las órbitas se atenúan al acercarse a un astro para no cruzar la vista
    const atenuacion = THREE.MathUtils.clamp(radius / 60, 0.2, 1);
    for (const o of orbitas) if (o !== orbitaResaltada) o.material.opacity = OPACIDAD_ORBITA * atenuacion * (o.material.isLineDashedMaterial ? 0.7 : 1);

    if (superficie.activa) {
        superficie.actualizar(camera, sol.mesh.position);
        const { lugar } = superficie;
        ui.actualizarHUD({
            mundo: registro.get(idSeleccionado)?.nombre() ?? '', lugar: lugar.nombre, lat: lugar.lat, lon: lugar.lon,
            altSol: superficie.altSol, rumbo: superficie.rumbo,
            horaSolar: idSeleccionado === 'Tierra' ? horaSolarLocal(lugar.lon) : null
        });
    } else {
        cameraData.theta += orbitaAutomatica * dt;
        movimientoCamara += Math.abs(orbitaAutomatica * dt);
        seguirObjetivo();
        updateCameraPosition(camera, cameraData, radius);
    }
    actualizarSonido(dt, dias);
    carta.actualizar(camera);
    actualizarHUDEscena(dt);
    composer.render();
    etiquetas.actualizar(camera);
    actualizarRegla();
}

// ---------- HUD de instrumentación ----------
const hud = new HUD();
const raycasterSol = new THREE.Raycaster();
const fmtKm = km => (km < 1e7 ? `${fmt(km, 4)} km` : `${fmt(km / UA_KM, 4)} UA`);

// Fracción del disco iluminada vista desde la cámara
function iluminacion(pos) {
    const haciaSol = vTmp.copy(pos).negate().normalize();
    const haciaCamara = new THREE.Vector3().subVectors(camera.position, pos).normalize();
    return `${Math.round(50 * (1 + haciaSol.dot(haciaCamara)))} %`;
}

function datosHUD() {
    if (!idSeleccionado || superficie.activa) return null;
    const c = porNombre[idSeleccionado];
    const l = lunas.find(m => m.nombre === idSeleccionado);
    const nave = naves.lista.find(n => `nave-${n.nombre}` === idSeleccionado);
    const filas = [];
    let objeto3d, tamaño = 0, kmPorUnidad = KM_POR_UNIDAD;
    if (c) {
        objeto3d = c.mesh;
        tamaño = c.tamaño * escala.valor;
        kmPorUnidad = c.radio / tamaño;
        filas.push([t('tAlt'), fmtKm(Math.max(0, camera.position.distanceTo(c.mesh.position) - tamaño) * kmPorUnidad)]);
        if (!c.fijo) {
            filas.push([t('tSol'), `${fmt(c.mesh.position.length() / SCALE_DISTANCE, 4)} UA`]);
            filas.push([t('tVel'), `${fmt(kepler(c, tiempo).v / 1000, 3)} km/s`]);
            filas.push([t('tIlum'), iluminacion(c.mesh.position)]);
        }
    } else if (l) {
        objeto3d = l.mesh;
        tamaño = l.tamaño * escala.valor;
        kmPorUnidad = l.datos.radio / tamaño;
        filas.push([t('tAlt'), fmtKm(Math.max(0, camera.position.distanceTo(l.mesh.position) - tamaño) * kmPorUnidad)]);
        filas.push([t('tDist'), fmtKm(l.offsetKm.length())]);
        filas.push([t('tIlum'), iluminacion(l.mesh.position)]);
    } else if (nave) {
        if (!nave.activa(tiempo)) return null;
        objeto3d = nave.marcador;
        filas.push([t('tSol'), `${fmt(nave.distanciaSolUA, 4)} UA`]);
        filas.push([t('tVel'), `${fmt(nave.velocidad, 3)} km/s`]);
    } else if (menorSel) {
        objeto3d = menorSel.roca;
        tamaño = menorSel.roca.scale.x;
        filas.push([t('tSol'), `${fmt(menorSel.roca.position.length() / SCALE_DISTANCE, 4)} UA`]);
        filas.push([t('tVel'), `${fmt(kepler(menorSel.cuerpo, tiempo).v / 1000, 3)} km/s`]);
        filas.push([t('tIlum'), iluminacion(menorSel.roca.position)]);
    } else {
        return null;
    }
    return { objeto3d, tamaño, filas, kmPorUnidad };
}

function actualizarHUDEscena(dt) {
    const datos = datosHUD();
    // Kilómetros por píxel a la distancia del objetivo (o del centro de la vista)
    const d = datos ? camera.position.distanceTo(datos.objeto3d.position) : radius;
    const unidadesPorPx = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / window.innerHeight;
    const kmPorUnidad = datos?.tamaño ? datos.kmPorUnidad : KM_POR_UNIDAD;
    hud.actualizar(camera, datos, { visible: !superficie.activa && !tour.activo, escalaKm: unidadesPorPx * kmPorUnidad, textoEscala: fmtKm });

    // Destello de lente: solo si nada tapa el Sol (ni el horizonte, en la superficie)
    const posSol = sol.mesh.position;
    const dSol = camera.position.distanceTo(posSol);
    raycasterSol.set(camera.position, vTmp.subVectors(posSol, camera.position).normalize());
    raycasterSol.far = dSol;
    const tapadores = [...principales.filter(c => !c.fijo).map(c => c.esfera), ...lunas.map(m => m.mesh)];
    let visible = raycasterSol.intersectObjects(tapadores, false).length === 0;
    hud.destello(camera, posSol, sol.tamaño * escala.valor, visible, dt);
    paseCine.actualizar(performance.now() / 1000);
}

// Capas continuas del sonido según lo que ocurre en la escena
function actualizarSonido(dt, dias) {
    if (!sonido.listo) return;
    const radioSol = sol.tamaño * escala.valor;
    const dSol = camera.position.length();
    const solar = THREE.MathUtils.clamp(1 - Math.log(Math.max(dSol, radioSol) / radioSol) / Math.log(40), 0, 1);
    // Lejanía: crece desde la órbita de Marte hasta más allá de Neptuno
    const lejania = THREE.MathUtils.clamp(Math.log(Math.max(dSol, 80) / 80) / Math.log(25), 0, 1);
    // Hogar: cercanía a la Tierra (máximo junto a ella, se desvanece a unos 200 radios)
    const radioTierra = tierra.tamaño * escala.valor;
    const dTierra = Math.max(camera.position.distanceTo(tierra.mesh.position), radioTierra);
    const hogar = THREE.MathUtils.clamp(1 - Math.log(dTierra / radioTierra) / Math.log(200), 0, 1);
    // Viento: velocidad de giro de la cámara × cercanía al astro × densidad de su atmósfera
    const velocidadGiro = movimientoCamara / Math.max(dt, 1e-3);
    movimientoCamara = 0;
    const atmosfera = CIELOS[idSeleccionado]?.densidad ?? (idSeleccionado ? 0.2 : 0);
    let viento;
    if (superficie.activa) {
        viento = superficie.atmosfera * (0.08 + 0.5 * Math.min(1, velocidadGiro / 3));
    } else {
        const cercaniaAstro = idSeleccionado
            ? THREE.MathUtils.clamp(1 - Math.log(Math.max(radius, minZoom) / minZoom) / Math.log(30), 0, 1) : 0;
        viento = Math.min(1, velocidadGiro / 3) * cercaniaAstro * (0.3 + 0.7 * atmosfera);
    }
    vientoSuave += (viento - vientoSuave) * Math.min(1, dt * 6);
    panViento *= Math.exp(-dt * 3);
    const rapidez = dias === 0 ? 0 : THREE.MathUtils.clamp((Math.log10(Math.abs(diasPorSegundo) * 86400) - 4.5) / 4, 0, 1);
    sonido.actualizar({ solar, hogar, lejania, viento: vientoSuave, pan: panViento, rapidez });
}

// Busca el objeto más cercano al puntero (en píxeles, descontando su radio aparente en pantalla)
const ALCANCE_LUZ = 90;
const vTmp = new THREE.Vector3();
function buscarCercano(x, y) {
    const escalaPx = window.innerHeight / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let mejor = null;
    const probar = (objeto, tamaño, ilumina, id) => {
        if (!objeto.visible) return;
        vTmp.copy(objeto.position).project(camera);
        if (vTmp.z > 1) return;
        const px = (vTmp.x * 0.5 + 0.5) * window.innerWidth, py = (-vTmp.y * 0.5 + 0.5) * window.innerHeight;
        const radioPx = tamaño * escalaPx / camera.position.distanceTo(objeto.position);
        const d = Math.max(0, Math.hypot(px - x, py - y) - radioPx);
        if (d < ALCANCE_LUZ && (!mejor || d < mejor.d)) mejor = { objeto, tamaño, ilumina, d, id };
    };
    for (const c of principales) probar(c.mesh, c.tamaño * escala.valor * (c === saturno ? 2.3 : 1), !c.fijo, c.nombre);
    for (const l of lunas) probar(l.mesh, l.tamaño * escala.valor, true, l.nombre);
    for (const nube of [asteroides, cometas]) {
        for (let i = 0; i < nube.cantidad; i++) {
            probar({ position: nube.vectores[i], visible: true }, 0, false, `${nube === cometas ? 'com' : 'ast'}-${nube.cuerpos[i].spkid}`);
        }
    }
    if (naves.grupo.visible) for (const n of naves.lista) probar(n.marcador, 0, false, `nave-${n.nombre}`);
    if (menorSel) probar(menorSel.roca, menorSel.roca.scale.x, true, idSeleccionado);
    return mejor;
}

function actualizarCercania(x, y) {
    const cercano = buscarCercano(x, y);
    if (cercano) {
        cercania.objeto = cercano.objeto;
        cercania.tamaño = cercano.tamaño;
        cercania.ilumina = cercano.ilumina;
        cercania.objetivo = 1 - cercano.d / ALCANCE_LUZ;
    } else {
        cercania.objetivo = 0;
    }
    etiquetas.marcarCerca(cercano && cercano.d < 30 ? cercano.objeto : null);
    renderer.domElement.style.cursor = isDragging ? 'grabbing' : cercano && cercano.d < 12 ? 'pointer' : 'grab';
}

function actualizarLuzCursor(dt) {
    cercania.valor += (cercania.objetivo - cercania.valor) * Math.min(1, dt * 8); // transición suave
    const v = cercania.valor;
    halo.visible = v > 0.01 && Boolean(cercania.objeto);
    if (!halo.visible) {
        luzCursor.intensity = 0;
        return;
    }
    const centro = cercania.objeto.position;
    const tamaño = cercania.tamaño || radius * 0.01; // los puntos (asteroides, naves) usan un halo relativo al zoom
    halo.position.copy(centro);
    halo.scale.setScalar(Math.max(tamaño * 3.6, radius * 0.03));
    halo.material.opacity = 0.65 * v;
    if (!cercania.ilumina || !rayoCursor) {
        luzCursor.intensity = 0;
        return;
    }
    // La luz se sitúa delante del astro, desplazada hacia el punto del rayo del cursor más cercano a él
    const haciaCamara = vTmp.subVectors(camera.position, centro).normalize();
    const t0 = Math.max(0, rayoCursor.direction.dot(new THREE.Vector3().subVectors(centro, rayoCursor.origin)));
    const puntoRayo = rayoCursor.at(t0, new THREE.Vector3());
    const desplazamiento = puntoRayo.sub(centro).add(haciaCamara.multiplyScalar(tamaño * 1.2)).normalize();
    const separacion = tamaño * 1.5;
    luzCursor.position.copy(centro).addScaledVector(desplazamiento, separacion);
    luzCursor.distance = tamaño * 3.6;
    luzCursor.intensity = 2.2 * v * separacion * separacion;
}

// ---------- Control de la cámara (ratón y táctil) ----------
const movementScale = 0.005;
let isDragging = false;
let previous = { x: 0, y: 0 };
let initialPinchDistance = null;
let inicioClic = null;

const distanciaDedos = (a, b) => Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);

function girar(x, y) {
    const dx = x - previous.x, dy = y - previous.y;
    movimientoCamara += (Math.abs(dx) + Math.abs(dy)) * movementScale;
    panViento = THREE.MathUtils.clamp(panViento + dx * 0.01, -1, 1);
    if (superficie.activa) {
        superficie.mirar(-dx, -dy); // se "agarra" el cielo
        previous = { x, y };
        return;
    }
    cameraData.theta += (x - previous.x) * movementScale;
    cameraData.phi -= (y - previous.y) * movementScale;
    cameraData.phi = Math.max(0.05, Math.min(Math.PI - 0.05, cameraData.phi)); // evita voltear la cámara
    if (transicion) {
        transicion.phiHasta = transicion.phiDesde = cameraData.phi;
        transicion.thetaHasta = transicion.thetaDesde = cameraData.theta;
    }
    previous = { x, y };
}

function zoom(factor) {
    movimientoCamara += Math.abs(Math.log(factor)) * 1.5;
    if (superficie.activa) return superficie.zoom(factor);
    if (transicion) transicion.radio = false; // el usuario manda sobre el zoom durante el vuelo
    radius = Math.max(minZoom, Math.min(maxZoom, radius * factor));
}

// Clic en la escena: primero esferas (planetas, enanos, lunas); si no, el objeto más cercano al cursor
const raycaster = new THREE.Raycaster();
const seleccionables = () => [...principales.map(c => c.esfera), ...lunas.filter(l => l.mesh.visible).map(l => l.mesh)];
function objetoEnPantalla(x, y) {
    raycaster.setFromCamera(new THREE.Vector2(x / window.innerWidth * 2 - 1, -y / window.innerHeight * 2 + 1), camera);
    const impacto = raycaster.intersectObjects(seleccionables(), false)[0];
    if (impacto) {
        const cuerpo = principales.find(c => c.esfera === impacto.object);
        if (cuerpo) return registro.get(cuerpo.nombre);
        const l = lunas.find(m => m.mesh === impacto.object);
        if (l) return registro.get(l.nombre);
    }
    const cercano = buscarCercano(x, y);
    return cercano && cercano.d < 15 ? registro.get(cercano.id) : null;
}

function clicEnEscena(x, y) {
    if (superficie.activa) return;
    const entrada = objetoEnPantalla(x, y);
    if (!entrada) return;
    if (regla.activa) añadirPuntoRegla(entrada);
    else entrada.seleccionar();
}

const esClic = (x, y) => inicioClic && Math.hypot(x - inicioClic.x, y - inicioClic.y) < 5;

renderer.domElement.addEventListener('mousedown', event => {
    isDragging = true;
    previous = { x: event.clientX, y: event.clientY };
    inicioClic = { x: event.clientX, y: event.clientY };
});
window.addEventListener('mouseup', event => {
    isDragging = false;
    if (event.target === renderer.domElement && esClic(event.clientX, event.clientY)) clicEnEscena(event.clientX, event.clientY);
    inicioClic = null;
});
window.addEventListener('mousemove', event => {
    if (isDragging) girar(event.clientX, event.clientY);
    if (event.target !== renderer.domElement) {
        cercania.objetivo = 0;
        etiquetas.marcarCerca(null);
        return;
    }
    if (superficie.activa) return;
    raycaster.setFromCamera(new THREE.Vector2(event.clientX / window.innerWidth * 2 - 1, -event.clientY / window.innerHeight * 2 + 1), camera);
    rayoCursor = raycaster.ray.clone();
    actualizarCercania(event.clientX, event.clientY);
});
renderer.domElement.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(Math.exp(event.deltaY * 0.001));
}, { passive: false });

renderer.domElement.addEventListener('touchstart', event => {
    if (event.touches.length === 1) {
        isDragging = true;
        previous = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        inicioClic = { ...previous };
    } else if (event.touches.length === 2) {
        isDragging = false;
        inicioClic = null;
        initialPinchDistance = distanciaDedos(event.touches[0], event.touches[1]);
    }
}, { passive: true });
renderer.domElement.addEventListener('touchmove', event => {
    event.preventDefault();
    if (isDragging && event.touches.length === 1) {
        girar(event.touches[0].clientX, event.touches[0].clientY);
    } else if (event.touches.length === 2 && initialPinchDistance !== null) {
        const nueva = distanciaDedos(event.touches[0], event.touches[1]);
        zoom(initialPinchDistance / nueva);
        initialPinchDistance = nueva;
    }
}, { passive: false });
renderer.domElement.addEventListener('touchend', event => {
    if (event.touches.length === 0) {
        const toque = event.changedTouches[0];
        if (toque && esClic(toque.clientX, toque.clientY)) clicEnEscena(toque.clientX, toque.clientY);
        isDragging = false;
        initialPinchDistance = null;
        inicioClic = null;
    }
});

// Arranque del bucle, cuando todo el módulo está definido
animate();
