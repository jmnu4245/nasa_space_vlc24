import * as THREE from 'three';
import { SCALE_DISTANCE, SCALE_SIZE, J2000 } from './datos.js';
import { cargarTextura } from './materiales.js';

const RAD = Math.PI / 180;
const OBLICUIDAD = 23.4393; // inclinación del eje terrestre (grados)

class CelestialBody {
    // Elementos keplerianos: e, a (UA), I, Omega, omega, M0 (grados, anomalía media en t0),
    // t0 (día juliano), n (grados/día). rotacion en días, radio en km, masa en kg.
    constructor({ nombre, e = 0, a = 0, I = 0, Omega = 0, omega = 0, M0 = 0, t0 = J2000, n = 0,
                  rotacion = 0, radio = 0, masa = 0, textura = null, color = 0xffffff, polo = null }) {
        this.nombre = nombre;
        this.e = e;
        this.a = a;
        this.I = I;
        this.Omega = Omega;
        this.omega = omega;
        this.M0 = M0;
        this.t0 = t0;
        this.n = n;
        this.rotacion = rotacion;
        this.radio = radio;
        this.masa = masa;
        this.color = color;
        this.tamaño = radio * SCALE_SIZE;
        this.textura = textura;
        this.polo = polo; // [ascensión recta, declinación] del polo norte, en grados
        this.mesh = null;   // grupo posicionado e inclinado según el eje de rotación
        this.esfera = null; // esfera que gira sobre el eje
    }

    // Planeta a partir de elementos medios en J2000 (L longitud media, varpi longitud del perihelio)
    static planeta(d, polo) {
        return new CelestialBody({
            nombre: d.nombre, e: d.e, a: d.a, I: d.I, Omega: d.Omega,
            omega: d.varpi - d.Omega, M0: d.L - d.varpi, t0: J2000,
            n: d.periodo ? 360 / d.periodo : 0,
            rotacion: d.rotacion, radio: d.radio, masa: d.masa, color: d.color,
            textura: d.textura, polo
        }).conNombreIngles(d.en);
    }

    // Planeta enano: elementos como los de los asteroides, más tamaño, textura y forma
    static enano(d) {
        const cuerpo = new CelestialBody({
            nombre: d.nombre, e: d.e, a: d.a, I: d.i, Omega: d.om, omega: d.w, M0: 0, t0: d.tp, n: d.n,
            rotacion: d.rotacion, radio: d.radio, masa: d.masa, color: d.color, textura: d.textura, polo: d.polo ?? null
        });
        cuerpo.en = d.en;
        cuerpo.ejes = d.ejes ?? null;
        cuerpo.enano = true;
        return cuerpo;
    }

    // Asteroide o cometa a partir de una entrada del JSON (w = argumento del perihelio, tp = paso por el perihelio)
    static menor(d) {
        const cuerpo = new CelestialBody({
            nombre: d.full_name, e: d.e, a: d.a, I: d.i, Omega: d.om, omega: d.w,
            M0: 0, t0: d.tp, n: d.n
        });
        cuerpo.diametro = d.diameter; // km
        cuerpo.spkid = d.spkid;
        cuerpo.spec = d.spec || '';     // clase espectral (Bus/Tholen)
        cuerpo.albedo = d.albedo || 0;
        if (Array.isArray(d.pole)) cuerpo.polo = d.pole;
        if (d.rot_per) cuerpo.rotacion = d.rot_per / 24; // horas -> días
        return cuerpo;
    }

    conNombreIngles(en) {
        this.en = en;
        return this;
    }

    // El Sol está fijo en el origen
    get fijo() {
        return this.a === 0;
    }

    // Periodo orbital en días
    periodo() {
        return this.n ? 360 / this.n : Infinity;
    }

    // Dirección del polo norte en la escena (de ecuatoriales a eclípticas y a ejes de la escena)
    direccionPolo() {
        if (!this.polo) return new THREE.Vector3(0, 1, 0);
        const [ra, dec] = this.polo.map(g => g * RAD);
        const eps = OBLICUIDAD * RAD;
        const x = Math.cos(dec) * Math.cos(ra), y = Math.cos(dec) * Math.sin(ra), z = Math.sin(dec);
        const yEcl = y * Math.cos(eps) + z * Math.sin(eps);
        const zEcl = -y * Math.sin(eps) + z * Math.cos(eps);
        return new THREE.Vector3(x, zEcl, -yEcl).normalize();
    }

    crearMesh() {
        const map = cargarTextura(this.textura);
        // El Sol emite luz: material sin sombreado y con brillo por encima de 1 para el bloom
        const material = this.fijo
            ? new THREE.MeshBasicMaterial({ map, color: new THREE.Color(1.6, 1.45, 1.3) })
            : new THREE.MeshStandardMaterial({ map, roughness: 0.9, metalness: 0 });
        this.esfera = new THREE.Mesh(new THREE.SphereGeometry(this.tamaño, 96, 96), material);
        if (this.ejes) this.esfera.geometry.scale(...this.ejes); // cuerpos elipsoidales (Haumea)
        this.mesh = new THREE.Group();
        this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.direccionPolo());
        this.mesh.add(this.esfera);
        return this.mesh;
    }

    /**
     * Orientación absoluta (solo la Tierra): el eje X local apunta al equinoccio y el giro diario
     * es el tiempo sidéreo, de modo que cada meridiano mira al Sol a su hora real.
     * @param {Function} angulo - angulo(t) en grados (tiempo sidéreo de Greenwich)
     */
    fijarOrientacionAbsoluta(angulo) {
        const polo = this.direccionPolo();
        const equinoccio = new THREE.Vector3(1, 0, 0);
        const z = new THREE.Vector3().crossVectors(equinoccio, polo);
        this.mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(equinoccio, polo, z));
        this.anguloRotacion = angulo;
    }

    // Anomalía excéntrica E (rad) resolviendo la ecuación de Kepler con Newton-Raphson
    calcular_E(t) {
        const M = ((this.M0 + this.n * (t - this.t0)) % 360) * RAD;
        let E = this.e > 0.8 ? Math.PI : M;
        for (let i = 0; i < 100; i++) {
            const delta = (E - this.e * Math.sin(E) - M) / (1 - this.e * Math.cos(E));
            E -= delta;
            if (Math.abs(delta) < 1e-10) break;
        }
        return E;
    }

    // Posición en el plano orbital (UA) para una anomalía excéntrica
    xy_orbita_plano_orbital(E) {
        return [this.a * (Math.cos(E) - this.e), this.a * Math.sqrt(1 - this.e ** 2) * Math.sin(E)];
    }

    // Posición eclíptica (UA) para una anomalía excéntrica, rotando por omega, I y Omega
    xyz_desde_E(E) {
        const [x0, y0] = this.xy_orbita_plano_orbital(E);
        const w = this.omega * RAD, Om = this.Omega * RAD, I = this.I * RAD;
        const cw = Math.cos(w), sw = Math.sin(w);
        const cO = Math.cos(Om), sO = Math.sin(Om);
        const cI = Math.cos(I), sI = Math.sin(I);
        return [
            (cw * cO - sw * sO * cI) * x0 + (-sw * cO - cw * sO * cI) * y0,
            (cw * sO + sw * cO * cI) * x0 + (-sw * sO + cw * cO * cI) * y0,
            (sw * sI) * x0 + (cw * sI) * y0
        ];
    }

    // Posición en la escena (la eclíptica es el plano XZ; Y es el norte eclíptico)
    posicionEscena(t, destino = new THREE.Vector3()) {
        if (this.fijo) return destino.set(0, 0, 0);
        const [x, y, z] = this.xyz_desde_E(this.calcular_E(t));
        return destino.set(x * SCALE_DISTANCE, z * SCALE_DISTANCE, -y * SCALE_DISTANCE);
    }

    crearOrbita(puntos = 720) {
        const vertices = [];
        for (let i = 0; i <= puntos; i++) {
            const [x, y, z] = this.xyz_desde_E(2 * Math.PI * i / puntos);
            vertices.push(new THREE.Vector3(x * SCALE_DISTANCE, z * SCALE_DISTANCE, -y * SCALE_DISTANCE));
        }
        const geometria = new THREE.BufferGeometry().setFromPoints(vertices);
        return new THREE.Line(geometria, new THREE.LineBasicMaterial({ color: this.color }));
    }

    actualizarPosicion(t) {
        this.posicionEscena(t, this.mesh.position);
    }

    // Gira el planeta sobre su eje durante `dias` días simulados
    actualizarRotacion(dias, t) {
        if (this.anguloRotacion) this.esfera.rotation.y = this.anguloRotacion(t) * RAD;
        else if (this.rotacion) this.esfera.rotation.y += 2 * Math.PI * dias / this.rotacion;
    }
}
export default CelestialBody;
