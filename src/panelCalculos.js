import { kepler, IntegracionNumerica, periodoNumerico, relatividad, UA } from './calculos.js';
import { t, idioma } from './i18n.js';

const local = () => (idioma === 'es' ? 'es-ES' : 'en-GB');
const num = (x, cifras = 5) => x.toLocaleString(local(), { maximumSignificantDigits: cifras });
// Notación científica solo para números muy grandes o muy pequeños
const sci = x => {
    if (x === 0 || (Math.abs(x) >= 1e-2 && Math.abs(x) < 1e5)) return num(x, 4);
    const [m, e] = x.toExponential(3).split('e');
    return `${idioma === 'es' ? m.replace('.', ',') : m} × 10<sup>${Number(e)}</sup>`;
};
const masaTxt = m => (m ? `${sci(m)} kg` : t('desconocido'));
const fila = (etiqueta, valor, secundaria = false) =>
    `<div class="fila${secundaria ? ' secundaria' : ''}"><span>${etiqueta}</span><b>${valor}</b></div>`;

// Pestaña "Física" de la ficha: magnitudes orbitales del cuerpo seleccionado con el método elegido
export default class PanelCalculos {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.cuerpo = null;
        this.metodo = 'kepler';
        this.integradores = ['euler', 'rk4'];
        this.sims = {};
        this.periodos = {};
    }

    setMetodo(metodo, integradores = this.integradores) {
        this.metodo = metodo;
        this.integradores = integradores;
        this.reiniciar(this.cuerpo, this.t ?? 0);
    }

    // Reinicia las integraciones (al cambiar de cuerpo, método o fecha)
    reiniciar(cuerpo, t) {
        this.cuerpo = cuerpo;
        this.t = t;
        this.sims = {};
        this.periodos = {};
    }

    actualizar(tiempo) {
        this.t = tiempo;
        const cuerpo = this.cuerpo;
        if (!cuerpo) {
            this.contenedor.innerHTML = `<p class="nota">${t('sinFisica')}</p>`;
        } else if (cuerpo.fijo) {
            this.contenedor.innerHTML = `<p class="nota">${t('solSinOrbita')}</p>`;
        } else if (this.metodo === 'clasica') {
            this.contenedor.innerHTML = this.integradores.map(m => this.seccionNumerica(m, tiempo)).join('');
        } else if (this.metodo === 'relatividad') {
            this.contenedor.innerHTML = this.seccionRelatividad(tiempo);
        } else {
            this.contenedor.innerHTML = this.seccionKepler(tiempo);
        }
    }

    seccionKepler(tiempo) {
        const k = kepler(this.cuerpo, tiempo);
        return fila(t('distanciaSol'), `${num(k.r / 1000)} km`) +
            fila('', `${num(k.r / UA, 4)} UA`, true) +
            fila(t('velocidadOrbital'), `${num(k.v / 1000, 4)} km/s`) +
            fila(t('periodoOrbital'), `${num(k.periodo)} ${t('dias')}`) +
            fila('', `${num(k.periodo / 365.25, 4)} ${t('anios')}`, true) +
            fila(t('masaCuerpo'), masaTxt(this.cuerpo.masa)) +
            fila(t('masaSol3'), `${sci(k.masaSol)} kg`);
    }

    seccionNumerica(metodo, tiempo) {
        const sim = this.sims[metodo] ?? (this.sims[metodo] = new IntegracionNumerica(this.cuerpo, metodo, tiempo));
        sim.avanzar(tiempo);
        const k = kepler(this.cuerpo, tiempo);
        this.periodos[metodo] ??= periodoNumerico(this.cuerpo, metodo);
        const T = this.periodos[metodo];
        return `<h4>${t(metodo === 'euler' ? 'metodoEuler' : 'metodoRK4')}</h4>` +
            fila(t('distanciaSol'), `${num(sim.r / 1000)} km`) +
            fila(t('errorKepler'), `${num(Math.abs(sim.r - k.r) / 1000, 3)} km`, true) +
            fila(t('velocidadOrbital'), `${num(sim.v / 1000, 4)} km/s`) +
            fila(t('errorKepler'), `${num(Math.abs(sim.v - k.v), 3)} m/s`, true) +
            fila(t('periodoOrbital'), `${num(T)} ${t('dias')}`) +
            fila(t('errorKepler'), `${sci(100 * Math.abs(T - k.periodo) / k.periodo)} %`, true) +
            fila(t('derivaEnergia'), sci(Math.abs(sim.derivaEnergia)));
    }

    seccionRelatividad(tiempo) {
        const k = kepler(this.cuerpo, tiempo);
        const rel = relatividad(this.cuerpo, k.r, k.v);
        return fila(t('velocidadOrbital'), `${num(k.v / 1000, 4)} km/s`) +
            fila('v / c', sci(rel.betaV), true) +
            fila('γ − 1', sci(rel.gamma - 1), true) +
            fila(t('dilatacion'), `${num(rel.dilatacionAnual, 3)} ${t('sPorAnio')}`) +
            fila(t('precesion'), `${num(rel.precesionSiglo, 3)} ${t('porSiglo')}`) +
            fila(t('schwarzschild'), sci(rel.schwarzschild)) +
            fila(t('masaReposo'), masaTxt(this.cuerpo.masa)) +
            fila(t('masaRelativista'), masaTxt(rel.masaRelativista));
    }
}
