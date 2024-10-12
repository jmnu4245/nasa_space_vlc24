class CelestialBody {
    constructor(id, name, e, a, p, I, Omega, w, L, t0, n) {
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
    }

    //cálculo del periodo orbital
    calcular_T(){
        const T = 360 / this.n;
        return T;
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
}

export default CelestialBody;