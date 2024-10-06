"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CelestialBody = void 0;
var CelestialBody = /** @class */ (function () {
    function CelestialBody(id, name, e, a, p, I, W, w, M, t0, n) {
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
    CelestialBody.prototype.calcular_E = function (t) {
        var n_degPerDay = this.n / 365.6;
        var e_deg = this.e * 180 / Math.PI;
        //console.log('  -ejecutando calcular_E');
        var tol = 1e-6;
        var max_iterations = 1000;
        var E0 = this.n * (t - this.t0) + e_deg * Math.sin(this.n * (t - this.t0));
        var E = 0;
        var iterations = 0;
        while (iterations < max_iterations) {
            E = E0 - (E0 - e_deg * Math.sin(E0) - this.n * (t - this.t0)) / (1 - e_deg * Math.cos(E0));
            iterations++;
            if (Math.abs(E - E0) <= tol) {
                console.log('convergió en ' + iterations);
                return E; // Retornar el valor de E si convergió
            }
            E0 = E;
        }
        console.warn("  -No convergence after maximum iterations");
        return E;
    };
    CelestialBody.prototype.xy_orbita_plano_orbital = function (E) {
        //console.log('  -ejecutando la funcion xy_orbita_plano_orbital');
        var x = this.a * (Math.cos(E) - this.e);
        var y = this.a * Math.sqrt(1 - Math.pow(this.e, 2)) * Math.sin(E);
        return [x, y];
    };
    CelestialBody.prototype.xyz_orbita_plano_ecliptica = function (t) {
        console.log('  -ejecutando la funcion xyz_orbita_plano_ecliptica');
        // Llama a calcular_E y xy_orbita_plano_orbital
        var E = this.calcular_E(t);
        var coordOrbita = this.xy_orbita_plano_orbital(E);
        var x0 = coordOrbita[0];
        var y0 = coordOrbita[1];
        var x = (Math.cos(this.w) * Math.cos(this.W) - Math.sin(this.w) * Math.sin(this.W) * Math.cos(this.I)) * x0 + (-Math.sin(this.w) * Math.cos(this.W) - Math.cos(this.w) * Math.sin(this.W) * Math.cos(this.I)) * y0;
        var y = (Math.cos(this.w) * Math.sin(this.W) + Math.sin(this.w) * Math.cos(this.W) * Math.cos(this.I)) * x0 + (-Math.sin(this.w) * Math.sin(this.W) - Math.cos(this.w) * Math.cos(this.W) * Math.cos(this.I)) * y0;
        var z = (Math.sin(this.w) * Math.sin(this.I)) * x0 + (Math.cos(this.w) * Math.sin(this.I)) * y0;
        return [x, y, z];
    };
    return CelestialBody;
}());
exports.CelestialBody = CelestialBody;
