export class CelestialBody {
    id: string;
    name: string;
    e: number;
    a: number;
    p: number;
    I: number;
    W: number;
    w: number;
    M: number;
    t0: number;
    n: number;
    n_degPerDay: number;
    e_deg: number;
    isPotentiallyHazardous: boolean;

    constructor(
        id: string,
        name: string,
        e: number,
        a: number,
        p: number,
        I: number,
        W: number,
        w: number,
        M: number,
        t0: number,
        n: number,
        n_degPerDay: number,
        e_deg: number,
        isPotentiallyHazardous: boolean
    ) {
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
        this.n_degPerDay = n_degPerDay;
        this.e_deg = e_deg;
        this.isPotentiallyHazardous = isPotentiallyHazardous;
    }

    calcular_E(t: number): number {
        console.log('  -ejecutando calcular_E');
        const tol: number = 1e-6;
        const max_iterations: number = 500;
        let E0: number = this.n * (t - this.t0) + this.e_deg * Math.sin(this.n * (t - this.t0));
        let E: number = 0;
        let iterations = 0;

        while (iterations < max_iterations) {
            E = E0 - (E0 - this.e_deg * Math.sin(E0) - this.n * (t - this.t0)) / (1 - this.e_deg * Math.cos(E0));
            iterations++;

            if (Math.abs(E - E0) <= tol) {
                console.log('convergió en ' + iterations);
                return E; // Retornar el valor de E si convergió
            }
            E0 = E;
        }
        console.warn("  -No convergence after maximum iterations");
        return E;
    }

    xy_orbita_plano_orbital(E: number): [number, number] {
        console.log('  -ejecutando la funcion xy_orbita_plano_orbital');
        const x = this.a * (Math.cos(E) - this.e);
        const y = this.a * Math.sqrt(1 - this.e ** 2) * Math.sin(E);
        return [x, y];
    }

    xyz_orbita_plano_ecliptica(t: number): [number, number, number] {
        console.log('  -ejecutando la funcion xyz_orbita_plano_ecliptica');

        // Llama a calcular_E y xy_orbita_plano_orbital
        const E = this.calcular_E(t);
        const coordOrbita = this.xy_orbita_plano_orbital(E);

        const x0: number = coordOrbita[0];
        const y0: number = coordOrbita[1];
        const x: number = (Math.cos(this.w) * Math.cos(this.W) - Math.sin(this.w) * Math.sin(this.W) * Math.cos(this.I)) * x0 + (-Math.sin(this.w) * Math.cos(this.W) - Math.cos(this.w) * Math.sin(this.W) * Math.cos(this.I)) * y0;
        const y: number = (Math.cos(this.w) * Math.sin(this.W) + Math.sin(this.w) * Math.cos(this.W) * Math.cos(this.I)) * x0 + (-Math.sin(this.w) * Math.sin(this.W) - Math.cos(this.w) * Math.cos(this.W) * Math.cos(this.I)) * y0;
        const z: number = (Math.sin(this.w) * Math.sin(this.I)) * x0 + (Math.cos(this.w) * Math.sin(this.I)) * y0;
        return [x, y, z];
    }
}


