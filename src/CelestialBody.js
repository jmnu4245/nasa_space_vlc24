import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

const numPuntos = 100000;
let TIME_SCALE = 0.001;
const SCALE_DISTANCE = 50;
const SCALE = 62;



class CelestialBody {
    constructor(id, name, e, a, p, I, Omega, w, L, t0, n, rot_per, diameter, textura,color_orbita) {
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
        this.diameter = diameter; //diámetro del cuerpo en km
        this.textura = textura;
        this.color_orbita = color_orbita;
        this.SCALE_SIZE = 0.00001436;
        this.tamaño = diameter / 2 * this.SCALE_SIZE;
        this.posicion = [0,0,0];
        
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
        const max_iterations = 10000;
        const e_deg = this.e;
        const L = this.L * Math.PI / 180;
        const w = this.w * Math.PI / 180;
        const n = this.n * Math.PI / 180;
        const M_0 = L - w;
        const M = n * (t - this.t0) ;
        let E = M_0 - e_deg * Math.sin(M_0);
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
        const material = new THREE.LineBasicMaterial({ color: this.color_orbita, linewidth: 2 }); // Asegurarse de que el material sea visible
        const orbita = new THREE.Line(geometria, material);
        return orbita;
    }
    actualizarPosicionPlanetas(t) {
            const [x, y, z] = this.xyz_orbita_plano_ecliptica(t);
            this.sphere.position.set(x * SCALE_DISTANCE, y * SCALE_DISTANCE, z * SCALE_DISTANCE);
        }
    actualizarRotacionPlanetas(){
        this.sphere.rotation.y += this.calcular_n_rot()*TIME_SCALE;
    }
    }
export default CelestialBody;