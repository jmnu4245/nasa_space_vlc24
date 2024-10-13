import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

const numPuntos = 10000;
let TIME_SCALE = 0.001;
const SCALE_DISTANCE = 50;
const color = [
  0xffe59e, // Sol (amarillo suave)
  0xc2c2c2, // Mercurio (gris suave)
  0xffd5a0, // Venus (naranja muy suave)
  0xa3c1e0, // Tierra (azul suave)
  0xffb3b3, // Marte (rojo suave)
  0xffd5a0, // Júpiter (naranja muy suave)
  0xffe59e, // Saturno (amarillo suave)
  0xb3e0e0, // Urano (cyan suave)
  0xa3c1e0  // Neptuno (azul suave)
];
const SCALE = 62;
const SCALE_SIZE = 0.00001436; // Factor de escala para los tamaños

const tiempoTotalOrbita = [
    25.38,  // Sol (rotación)
    87.97,  // Mercurio (traslación)
    224.70, // Venus (traslación)
    365.25, // Tierra (traslación)
    686.98, // Marte (traslación)
    4332.59, // Júpiter (traslación)
    10759.22, // Saturno (traslación)
    30685.49, // Urano (traslación)
    60190.03  // Neptuno (traslación)
];

const size = [
    696340 * SCALE_SIZE,  // Sol
    2439.7 * SCALE_SIZE,  // Mercurio
    6051.8 * SCALE_SIZE,  // Venus
    6371.0 * SCALE_SIZE,  // Tierra
    3389.5 * SCALE_SIZE,  // Marte
    69911 * SCALE_SIZE,   // Júpiter
    58232 * SCALE_SIZE,   // Saturno
    25362 * SCALE_SIZE,   // Urano
    24622 * SCALE_SIZE    // Neptuno
];
const textura = [
    '../texturas/textura_sol.jpg',
    '../texturas/textura_mercurio.png',
    '../texturas/textura_venus.jpg',
    '../texturas/textura_tierra.jpg',
    '../texturas/textura_marte.jpg',
    '../texturas/textura_jupiter.jpg',
    '../texturas/textura_saturno.jpg',
    '../texturas/textura_urano.jpg',
    '../texturas/textura_neptuno.jpg'
];

class CelestialBody {
    constructor(id, name, e, a, p, I, Omega, w, L, t0, n, rot_per) {
        this.id = id;
        this.name = name;
        this.e = e; // none
        this.a = a; // ua
        this.p = p; 
        this.I = I; // deg
        this.Omega = Omega; // deg
        this.w = w; // deg
        this.L = L; // deg
        this.t0 = t0; // julian Days
        this.n = n; // deg per day
        this.rot_per = rot_per; //periodo de rotacion en dias
        this.tamaño = size[id];
        this.posicion = [0,0,0];
        this.textura = textura[id];
        this.geometry = new THREE.SphereGeometry(this.tamaño, 64, 64);
        this.material = new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load(this.textura) });
        this.sphere = new THREE.Mesh(this.geometry, this.material);
        this.sphere.position.set(...[0,0,0]);
    }
    cambiarPosicion(nuevaPosicion)
    {
        if (nuevaPosicion.length == 3){
            this.posicion = nuevaPosicion/SCALE;
        }else{
            console.log("Error: la nueva posición no tiene tres componentes");
        }
    }
    getPlaneta(){
        return this.sphere;
    }
    //cálculo del periodo orbital
    calcular_T(){
        const T = 360 / this.n;
        return T;
    }
    //cálculo velocidad angular de rotación
    calcular_n_rot(){
        const n_rot = 2* Math.PI / this.rot_per;
        return n_rot;
    }
    //cálculo de la anomalía excéntrica
    calcular_E(t) {
        const tol = 1e-6 * Math.PI / 180;
        const max_iterations = 100;
        const e_deg = this.e;
        const L = this.L * Math.PI / 180;
        const w = this.w * Math.PI / 180;
        const n = this.n * Math.PI / 180;
        const M_0 = L - w;

        const M = n * (t - this.t0) ;
        let E = M_0 - e_deg * Math.sin(M_0);

        //M = M % (2 * Math.PI);  Asegurarse de que M esté en el rango [0, 2π]

        let delta = 1;
        let iterations = 0;

        while (Math.abs(delta) > tol && iterations < max_iterations) {
            delta = E - e_deg * Math.sin(E) - M;
            E = E - delta / (1 - e_deg * Math.cos(E));
            iterations++;
        }

        if (iterations >= max_iterations) {
            console.warn("No convergence after maximum iterations");
        }

        return E;
    }
    xy_orbita_plano_orbital(E) {
        const x = this.a * (Math.cos(E) - this.e);
        const y = this.a * Math.sqrt(1 - this.e ** 2) * Math.sin(E);
        return [x, y];
    }
    xyz_orbita_plano_ecliptica(t) {
        const E = this.calcular_E(t);
        const [x0, y0] = this.xy_orbita_plano_orbital(E);

        const w = this.w * Math.PI / 180;
        const Omega = this.Omega * Math.PI / 180;
        const omega = w - Omega;
        const I = this.I * Math.PI / 180;

        const cos_omega = Math.cos(omega);
        const sin_omega = Math.sin(omega);
        const cos_Omega = Math.cos(Omega);
        const sin_Omega = Math.sin(Omega);
        const cos_I = Math.cos(I);
        const sin_I = Math.sin(I);

        const x = (cos_omega * cos_Omega - sin_omega * sin_Omega * cos_I) * x0 + (-sin_omega * cos_Omega - cos_omega * sin_Omega * cos_I) * y0;
        const y = (cos_omega * sin_Omega + sin_omega * cos_Omega * cos_I) * x0 + (-sin_omega * sin_Omega + cos_omega * cos_Omega * cos_I) * y0;
        const z = (sin_omega * sin_I) * x0 + (cos_omega * sin_I) * y0;

        return [x, z, y]; //se ha usado distinto SR en los calculos y en la simulación
    }
    crearOrbita(T, i) {
        const puntos = []; 
        let t = 0;
        for (let i = 0; i <= numPuntos; i++) {
            const t =+ (i / numPuntos) * (T);
            const [x, y, z] = this.xyz_orbita_plano_ecliptica(t);
            puntos.push(new THREE.Vector3(x *SCALE_DISTANCE , y * SCALE_DISTANCE, z * SCALE_DISTANCE));
        }
        const geometria = new THREE.BufferGeometry().setFromPoints(puntos);
        const material = new THREE.LineBasicMaterial({ color: color[i], linewidth: 2 }); // Asegurarse de que el material sea visible
        const orbita = new THREE.Line(geometria, material);
        return orbita;
    }
    actualizarPosicionPlanetas(tiempo) {
            const [x, y, z] = this.xyz_orbita_plano_ecliptica(tiempo);
            this.sphere.position.set(x * SCALE_DISTANCE, y * SCALE_DISTANCE, z * SCALE_DISTANCE);
        }
    actualizarRotacionPlanetas(tiempo){
        this.sphere.rotation.y += this.calcular_n_rot()*TIME_SCALE;
    }
    }
export default CelestialBody;