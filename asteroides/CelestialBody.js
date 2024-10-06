class CelestialBody {
    constructor(id, name, e, a, p, I, W, w, M, t0, n) {
        this.id = id;
        this.name = name;
        this.e = e;
        this.a = a;
        this.p = p;
        this.I = I;
        this.W = W;
        this.w = w;
        this.M = M;
        this.t0 = t0;
        this.n = n;
    }

    calcular_E(t) {
        const tol = 1e-6;
        const max_iterations = 1000;
        let M = this.n * (t - this.t0) + this.M;
        M = M % (2 * Math.PI); // Asegurarse de que M esté en el rango [0, 2π]
        let E = M;
        let delta = 1;
        let iterations = 0;

        while (Math.abs(delta) > tol && iterations < max_iterations) {
            delta = E - this.e * Math.sin(E) - M;
            E = E - delta / (1 - this.e * Math.cos(E));
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

        const cos_w = Math.cos(this.w);
        const sin_w = Math.sin(this.w);
        const cos_W = Math.cos(this.W);
        const sin_W = Math.sin(this.W);
        const cos_I = Math.cos(this.I);
        const sin_I = Math.sin(this.I);

        const x = (cos_w * cos_W - sin_w * sin_W * cos_I) * x0 + (-sin_w * cos_W - cos_w * sin_W * cos_I) * y0;
        const y = (cos_w * sin_W + sin_w * cos_W * cos_I) * x0 + (-sin_w * sin_W + cos_w * cos_W * cos_I) * y0;
        const z = (sin_w * sin_I) * x0 + (cos_w * sin_I) * y0;

        return [x, y, z];
    }
}

export default CelestialBody;