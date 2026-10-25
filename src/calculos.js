
export const G = 6.6743e-11;       // m^3 kg^-1 s^-2
export const M_SOL = 1.98847e30;   // kg
export const C = 299792458;        // m/s
export const UA = 1.495978707e11;  // m
export const DIA = 86400;          // s
const MU = G * M_SOL;

// ---------- Leyes de Kepler ----------

// Estado (x, y, vx, vy) en el plano orbital, en unidades SI, para una anomalía excéntrica E
export function estadoDesdeE(cuerpo, E) {
    const a = cuerpo.a * UA, e = cuerpo.e;
    const r = a * (1 - e * Math.cos(E));
    const nRad = Math.sqrt(MU / a ** 3);
    const f = nRad * a * a / r;
    return {
        x: a * (Math.cos(E) - e),
        y: a * Math.sqrt(1 - e * e) * Math.sin(E),
        vx: -f * Math.sin(E),
        vy: f * Math.sqrt(1 - e * e) * Math.cos(E)
    };
}

// Magnitudes de la solución analítica de Kepler en el instante t (día juliano)
export function kepler(cuerpo, t) {
    const a = cuerpo.a * UA;
    const r = a * (1 - cuerpo.e * Math.cos(cuerpo.calcular_E(t)));
    const T = cuerpo.periodo() * DIA;
    return {
        r,
        v: Math.sqrt(MU * (2 / r - 1 / a)),                  // ecuación vis-viva
        periodo: 2 * Math.PI * Math.sqrt(a ** 3 / MU) / DIA, // 3ª ley: T = 2π√(a³/GM), en días
        masaSol: 4 * Math.PI ** 2 * a ** 3 / (G * T * T)     // 3ª ley despejando la masa del Sol
    };
}

// ---------- Mecánica clásica: integración numérica del problema de dos cuerpos ----------

function derivada(s) {
    const r3 = Math.hypot(s.x, s.y) ** 3;
    return { x: s.vx, y: s.vy, vx: -MU * s.x / r3, vy: -MU * s.y / r3 };
}

function suma(s, k, h) {
    return { x: s.x + h * k.x, y: s.y + h * k.y, vx: s.vx + h * k.vx, vy: s.vy + h * k.vy };
}

function pasoEuler(s, h) {
    return suma(s, derivada(s), h);
}

function pasoRK4(s, h) {
    const k1 = derivada(s);
    const k2 = derivada(suma(s, k1, h / 2));
    const k3 = derivada(suma(s, k2, h / 2));
    const k4 = derivada(suma(s, k3, h));
    const media = {};
    for (const c of ['x', 'y', 'vx', 'vy']) media[c] = (k1[c] + 2 * k2[c] + 2 * k3[c] + k4[c]) / 6;
    return suma(s, media, h);
}

export const INTEGRADORES = { euler: pasoEuler, rk4: pasoRK4 };

export const energia = s => 0.5 * (s.vx ** 2 + s.vy ** 2) - MU / Math.hypot(s.x, s.y);

// Integración que acompaña al tiempo simulado, partiendo del estado kepleriano exacto
export class IntegracionNumerica {
    constructor(cuerpo, metodo, t) {
        this.paso = INTEGRADORES[metodo];
        this.hMax = 2 * Math.PI * Math.sqrt((cuerpo.a * UA) ** 3 / MU) / 200; // 200 pasos por órbita
        this.cuerpo = cuerpo;
        this.reiniciar(t);
    }

    reiniciar(t) {
        this.estado = estadoDesdeE(this.cuerpo, this.cuerpo.calcular_E(t));
        this.energia0 = energia(this.estado);
        this.t = t;
    }

    avanzar(t) {
        const restante = (t - this.t) * DIA;
        if (restante < 0 || restante > 5000 * this.hMax) return this.reiniciar(t);
        const pasos = Math.ceil(restante / this.hMax);
        for (let i = 0; i < pasos; i++) this.estado = this.paso(this.estado, restante / pasos);
        this.t = t;
    }

    get r() { return Math.hypot(this.estado.x, this.estado.y); }
    get v() { return Math.hypot(this.estado.vx, this.estado.vy); }
    get derivaEnergia() { return (energia(this.estado) - this.energia0) / Math.abs(this.energia0); }
}

// Periodo (días) medido integrando una órbita desde el perihelio hasta que el ángulo barrido llega a 2π
export function periodoNumerico(cuerpo, metodo, pasosPorOrbita = 1000) {
    const paso = INTEGRADORES[metodo];
    const T = 2 * Math.PI * Math.sqrt((cuerpo.a * UA) ** 3 / MU);
    const h = T / pasosPorOrbita;
    let s = estadoDesdeE(cuerpo, 0);
    let barrido = 0, anterior = Math.atan2(s.y, s.x);
    for (let i = 0; i < 3 * pasosPorOrbita; i++) {
        s = paso(s, h);
        const actual = Math.atan2(s.y, s.x);
        let d = actual - anterior;
        if (d < -Math.PI) d += 2 * Math.PI;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (barrido + d >= 2 * Math.PI) return (i + (2 * Math.PI - barrido) / d) * h / DIA;
        barrido += d;
        anterior = actual;
    }
    return NaN;
}

// ---------- Relatividad ----------

export function relatividad(cuerpo, r, v) {
    const a = cuerpo.a * UA, e = cuerpo.e;
    const gamma = 1 / Math.sqrt(1 - (v / C) ** 2);
    const precesionOrbita = 6 * Math.PI * MU / (C * C * a * (1 - e * e)); // rad por órbita
    const orbitasSiglo = 36525 / cuerpo.periodo();
    return {
        gamma,
        betaV: v / C,
        masaRelativista: gamma * cuerpo.masa,
        schwarzschild: 2 * MU / (C * C * r),                  // r_s / r
        precesionSiglo: precesionOrbita * orbitasSiglo * (180 / Math.PI) * 3600, // segundos de arco por siglo
        dilatacionAnual: (gamma - 1) * 365.25 * DIA           // segundos que atrasa su reloj al año
    };
}

