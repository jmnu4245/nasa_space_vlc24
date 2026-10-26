import * as THREE from 'three';

// Capa de referencia celeste: eclíptica graduada, rejilla ecuatorial (ascensión recta y declinación)
// y nombres de las constelaciones del zodiaco. Se dibuja en una esfera centrada en la cámara, como
// una carta del cielo "en el infinito".
const R = 30000;
const RAD = Math.PI / 180;
const EPS = 23.4393 * RAD; // oblicuidad de la eclíptica

// Dirección en la escena a partir de coordenadas ecuatoriales (ascensión recta y declinación en grados)
function desdeEcuatoriales(ra, dec, destino = new THREE.Vector3()) {
    const a = ra * RAD, d = dec * RAD;
    const x = Math.cos(d) * Math.cos(a), y = Math.cos(d) * Math.sin(a), z = Math.sin(d);
    const yEcl = y * Math.cos(EPS) + z * Math.sin(EPS);
    const zEcl = -y * Math.sin(EPS) + z * Math.cos(EPS);
    return destino.set(x, zEcl, -yEcl);
}

// Dirección en la escena a partir de la longitud eclíptica (latitud 0)
const desdeEcliptica = lon => new THREE.Vector3(Math.cos(lon * RAD), 0, -Math.sin(lon * RAD));

// Centros aproximados de las constelaciones zodiacales (AR en horas, Dec en grados)
const CONSTELACIONES = [
    ['Aries', 'Aries', 2.64, 20.8], ['Tauro', 'Taurus', 4.70, 14.9], ['Géminis', 'Gemini', 7.07, 22.6],
    ['Cáncer', 'Cancer', 8.65, 19.8], ['Leo', 'Leo', 10.67, 13.1], ['Virgo', 'Virgo', 13.40, -4.2],
    ['Libra', 'Libra', 15.20, -15.2], ['Escorpio', 'Scorpius', 16.89, -27.0], ['Ofiuco', 'Ophiuchus', 17.39, -7.9],
    ['Sagitario', 'Sagittarius', 19.10, -28.5], ['Capricornio', 'Capricornus', 21.05, -18.0],
    ['Acuario', 'Aquarius', 22.29, -10.8], ['Piscis', 'Pisces', 0.48, 13.7]
];

function linea(puntos, opacidad) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: opacidad, depthWrite: false }));
    l.frustumCulled = false;
    return l;
}

export default class Cartografia {
    constructor() {
        this.grupo = new THREE.Group();
        this.anclas = []; // { texto: string|Function, clase, dir, objeto: { position } }

        // Eclíptica con graduación: marcas cada 5° y cada 10°, rótulos cada 30°
        this.grupo.add(linea(Array.from({ length: 361 }, (_, i) => desdeEcliptica(i).multiplyScalar(R)), 0.22));
        const marcas = [];
        for (let g = 0; g < 360; g += 5) {
            const dir = desdeEcliptica(g);
            const largo = g % 10 === 0 ? 0.012 : 0.006;
            marcas.push(dir.clone().multiplyScalar(R).add(new THREE.Vector3(0, -largo * R, 0)),
                dir.clone().multiplyScalar(R).add(new THREE.Vector3(0, largo * R, 0)));
        }
        const segmentos = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(marcas),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }));
        segmentos.frustumCulled = false;
        this.grupo.add(segmentos);
        for (let g = 0; g < 360; g += 30) {
            this.anclas.push({ texto: g === 0 ? 'γ  0°' : `${g}°`, clase: 'carta', dir: desdeEcliptica(g).add(new THREE.Vector3(0, 0.03, 0)).normalize() });
        }

        // Rejilla ecuatorial: meridianos cada 2 h y paralelos cada 30°
        for (let ra = 0; ra < 24; ra += 2) {
            this.grupo.add(linea(Array.from({ length: 91 }, (_, i) => desdeEcuatoriales(ra * 15, -90 + i * 2).multiplyScalar(R)), 0.045));
        }
        for (let dec = -60; dec <= 60; dec += 30) {
            this.grupo.add(linea(Array.from({ length: 181 }, (_, i) => desdeEcuatoriales(i * 2, dec).multiplyScalar(R)), dec === 0 ? 0.1 : 0.045));
        }

        for (const [es, en, ra, dec] of CONSTELACIONES) {
            this.anclas.push({ texto: { es, en }, clase: 'constelacion', dir: desdeEcuatoriales(ra * 15, dec) });
        }
        this.anclas.forEach(a => { a.objeto = { position: new THREE.Vector3() }; });
    }

    // La carta acompaña a la cámara: siempre está "en el infinito"
    actualizar(camera) {
        this.grupo.position.copy(camera.position);
        for (const a of this.anclas) a.objeto.position.copy(camera.position).addScaledVector(a.dir, R);
    }
}
