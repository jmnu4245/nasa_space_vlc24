// Sonido ambiental generado en tiempo real (Web Audio, sin archivos). Cada zona tiene su carácter:
//   · Sol: fuego que crepita y un acorde grave y amplio, grandioso, que crece al acercarse.
//   · Tierra: un acorde mayor cálido y suave, "hogar".
//   · Espacio profundo: el fondo se apaga hasta casi el silencio, con un subgrave y ecos lejanos.
// Además: viento discreto al moverse cerca de un planeta con atmósfera, siseo al acelerar el tiempo
// y pequeños efectos al seleccionar, volar y hacer fotos. Todo pasa por una reverberación.
const leer = clave => { try { return localStorage.getItem(clave); } catch (e) { return null; } };
const guardar = (clave, valor) => { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } };

const VOLUMEN = 0.8;
const nota = (n) => 440 * 2 ** ((n - 69) / 12); // número MIDI → Hz

export default class Sonido {
    constructor() {
        this.ctx = null;
        this.activo = leer('sonido') !== '0';
        this.proximoEco = 0;
    }

    // Reverberación: respuesta al impulso de ruido que decae (cola larga, estéreo)
    crearReverb(segundos) {
        const ctx = this.ctx;
        const largo = Math.floor(ctx.sampleRate * segundos);
        const ir = ctx.createBuffer(2, largo, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = ir.getChannelData(c);
            for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / largo) ** 3;
        }
        const conv = ctx.createConvolver();
        conv.buffer = ir;
        return conv;
    }

    // Ruido en bucle: blanco, marrón (grave, tipo rugido) o crepitar (impulsos sueltos que decaen)
    crearBuffer(tipo, segundos = 4) {
        const ctx = this.ctx;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * segundos, ctx.sampleRate);
        const d = buffer.getChannelData(0);
        let ultimo = 0, chispa = 0;
        for (let i = 0; i < d.length; i++) {
            const blanco = Math.random() * 2 - 1;
            if (tipo === 'marron') {
                ultimo = (ultimo + 0.02 * blanco) / 1.02;
                d[i] = ultimo * 3.5;
            } else if (tipo === 'crepitar') {
                if (Math.random() < 0.0007) chispa = 0.4 + Math.random() * 0.6;
                chispa *= 0.993;
                d[i] = blanco * chispa;
            } else {
                d[i] = blanco;
            }
        }
        return buffer;
    }

    fuente(buffer) {
        const s = this.ctx.createBufferSource();
        s.buffer = buffer;
        s.loop = true;
        s.start(this.ctx.currentTime, Math.random() * buffer.duration);
        return s;
    }

    // Acorde sostenido de osciladores ligeramente desafinados, con filtro y trémolo lento
    crearAcorde(notas, tipo, { corte, desafinado = 6, tremolo = 0.12 }) {
        const ctx = this.ctx;
        const filtro = ctx.createBiquadFilter();
        filtro.type = 'lowpass';
        filtro.frequency.value = corte;
        filtro.Q.value = 0.5;
        const ganancia = ctx.createGain();
        ganancia.gain.value = 0;
        filtro.connect(ganancia);
        for (const n of notas) {
            for (const signo of [-1, 1]) {
                const o = ctx.createOscillator();
                o.type = tipo;
                o.frequency.value = nota(n);
                o.detune.value = signo * desafinado;
                const g = ctx.createGain();
                g.gain.value = 0.5 / notas.length;
                // Cada voz respira a su ritmo
                const lfo = ctx.createOscillator();
                lfo.frequency.value = tremolo * (0.7 + Math.random() * 0.6);
                const lfoG = ctx.createGain();
                lfoG.gain.value = 0.2 / notas.length;
                lfo.connect(lfoG).connect(g.gain);
                lfo.start();
                o.connect(g).connect(filtro);
                o.start();
            }
        }
        return { filtro, ganancia };
    }

    // Envía una capa a la mezcla: parte directa y parte a la reverberación
    conectar(nodo, seco, humedo) {
        const s = this.ctx.createGain();
        s.gain.value = seco;
        const h = this.ctx.createGain();
        h.gain.value = humedo;
        nodo.connect(s).connect(this.master);
        nodo.connect(h).connect(this.reverb);
    }

    // El navegador solo deja crear el audio tras una interacción del usuario
    iniciar() {
        if (this.ctx || !this.activo) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = this.ctx = new AC();

        this.master = ctx.createGain();
        this.master.gain.value = 0;
        const compresor = ctx.createDynamicsCompressor();
        compresor.threshold.value = -20;
        compresor.ratio.value = 3;
        this.master.connect(compresor).connect(ctx.destination);
        this.master.gain.setTargetAtTime(VOLUMEN, ctx.currentTime, 2); // entrada suave
        this.reverb = this.crearReverb(5);
        const retorno = ctx.createGain();
        retorno.gain.value = 0.9;
        this.reverb.connect(retorno).connect(this.master);

        this.blanco = this.crearBuffer('blanco', 2);

        // Fondo del espacio: graves suaves con un filtro que respira
        this.fondo = this.crearAcorde([33, 40, 45], 'sine', { corte: 380, desafinado: 4, tremolo: 0.05 });
        this.conectar(this.fondo.ganancia, 0.8, 0.5);

        // Sol: rugido grave, crepitar de fuego y un acorde amplio (do mayor con décima) en dientes de sierra
        const filtroRugido = ctx.createBiquadFilter();
        filtroRugido.type = 'lowpass';
        filtroRugido.frequency.value = 420;
        this.rugido = ctx.createGain();
        this.rugido.gain.value = 0;
        this.fuente(this.crearBuffer('marron', 6)).connect(filtroRugido).connect(this.rugido);
        // El fuego "late": el volumen del rugido oscila lentamente
        const pulso = ctx.createOscillator();
        pulso.frequency.value = 0.18;
        const pulsoG = ctx.createGain();
        pulsoG.gain.value = 0.25;
        pulso.connect(pulsoG).connect(this.rugido.gain);
        pulso.start();
        this.conectar(this.rugido, 0.9, 0.35);
        const filtroChispas = ctx.createBiquadFilter();
        filtroChispas.type = 'bandpass';
        filtroChispas.frequency.value = 2400;
        filtroChispas.Q.value = 0.6;
        this.chispas = ctx.createGain();
        this.chispas.gain.value = 0;
        this.fuente(this.crearBuffer('crepitar', 5)).connect(filtroChispas).connect(this.chispas);
        this.conectar(this.chispas, 0.7, 0.4);
        this.grandioso = this.crearAcorde([36, 43, 48, 52, 55], 'sawtooth', { corte: 300, desafinado: 9, tremolo: 0.08 });
        this.conectar(this.grandioso.ganancia, 0.5, 0.9);

        // Tierra: acorde mayor cálido (sol mayor abierto) con senos y triángulos
        this.hogar = this.crearAcorde([43, 50, 55, 59, 62, 67], 'triangle', { corte: 1400, desafinado: 3, tremolo: 0.1 });
        this.conectar(this.hogar.ganancia, 0.55, 0.8);

        // Vacío: subgrave casi imperceptible
        const sub = ctx.createOscillator();
        sub.frequency.value = 27.5;
        this.subgrave = ctx.createGain();
        this.subgrave.gain.value = 0;
        sub.connect(this.subgrave);
        sub.start();
        this.conectar(this.subgrave, 1, 0.2);

        // Viento: ruido por un filtro paso banda cuya frecuencia sube con la velocidad (discreto)
        this.filtroViento = ctx.createBiquadFilter();
        this.filtroViento.type = 'bandpass';
        this.filtroViento.frequency.value = 500;
        this.filtroViento.Q.value = 0.7;
        this.viento = ctx.createGain();
        this.viento.gain.value = 0;
        this.panViento = ctx.createStereoPanner();
        this.fuente(this.blanco).connect(this.filtroViento).connect(this.viento).connect(this.panViento);
        this.conectar(this.panViento, 0.6, 0.3);

        // Siseo agudo cuando el tiempo corre muy deprisa
        const filtroSiseo = ctx.createBiquadFilter();
        filtroSiseo.type = 'highpass';
        filtroSiseo.frequency.value = 6000;
        this.siseo = ctx.createGain();
        this.siseo.gain.value = 0;
        this.fuente(this.blanco).connect(filtroSiseo).connect(this.siseo);
        this.conectar(this.siseo, 0.6, 0.4);
    }

    setActivo(activo) {
        this.activo = activo;
        guardar('sonido', activo ? '1' : '0');
        if (activo && !this.ctx) return this.iniciar();
        if (!this.ctx) return;
        if (activo) this.ctx.resume();
        this.master.gain.setTargetAtTime(activo ? VOLUMEN : 0, this.ctx.currentTime, 0.3);
        if (!activo) setTimeout(() => !this.activo && this.ctx.suspend(), 1200);
    }

    get listo() {
        return this.ctx && this.activo && this.ctx.state === 'running';
    }

    /**
     * Ajusta las capas continuas (llamar en cada fotograma). Todos los valores van de 0 a 1.
     * @param {{solar, hogar, lejania, viento, pan, rapidez}} e
     */
    actualizar({ solar = 0, hogar = 0, lejania = 0, viento = 0, pan = 0, rapidez = 0 }) {
        if (!this.listo) return;
        const t = this.ctx.currentTime;
        const suave = 0.8; // constante de tiempo de los cambios de ambiente (s)
        // Las zonas se reparten la escena: cerca del Sol domina él; cerca de la Tierra, el hogar; lejos, el vacío
        const vacio = lejania * (1 - solar);
        this.fondo.ganancia.gain.setTargetAtTime(0.55 * (1 - 0.85 * vacio) * (1 - 0.7 * solar) * (1 - 0.5 * hogar), t, suave);
        this.fondo.filtro.frequency.setTargetAtTime(380 - 220 * vacio, t, suave);

        this.rugido.gain.setTargetAtTime(0.9 * solar ** 1.6, t, 0.5);
        this.chispas.gain.setTargetAtTime(0.5 * solar ** 2.2, t, 0.5);
        this.grandioso.ganancia.gain.setTargetAtTime(0.45 * solar ** 1.3, t, suave);
        this.grandioso.filtro.frequency.setTargetAtTime(250 + 2200 * solar ** 2, t, suave);

        this.hogar.ganancia.gain.setTargetAtTime(0.32 * hogar * (1 - solar), t, suave);
        this.subgrave.gain.setTargetAtTime(0.18 * vacio, t, suave);

        this.viento.gain.setTargetAtTime(0.16 * viento, t, 0.25);
        this.filtroViento.frequency.setTargetAtTime(300 + 1100 * viento, t, 0.25);
        this.panViento.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, pan)), t, 0.3);
        this.siseo.gain.setTargetAtTime(0.025 * rapidez, t, 0.6);

        // En el vacío, de vez en cuando, un eco lejano
        if (vacio > 0.4 && t > this.proximoEco) {
            this.proximoEco = t + 7 + Math.random() * 10;
            const n = [76, 79, 83, 86, 88][Math.floor(Math.random() * 5)];
            this.tono([nota(n)], 3, 0.03 * vacio, 'sine', 0.95);
        }
    }

    // Tono breve con envolvente; `humedo` = proporción enviada a la reverberación
    tono(frecuencias, duracion, volumen, tipo = 'sine', humedo = 0.4) {
        if (!this.listo) return;
        const t = this.ctx.currentTime;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(volumen, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
        this.conectar(g, 1 - humedo, humedo * 1.5);
        frecuencias.forEach((f, i) => {
            const o = this.ctx.createOscillator();
            o.type = tipo;
            o.frequency.setValueAtTime(f, t);
            o.connect(g);
            o.start(t + i * 0.04);
            o.stop(t + duracion + 0.1);
        });
    }

    clic() {
        this.tono([2093], 0.05, 0.02, 'sine', 0.2);
    }

    seleccion() {
        this.tono([nota(72), nota(79), nota(84)], 1.4, 0.04, 'sine', 0.6);
    }

    // Barrido de ruido suave que acompaña al vuelo de la cámara
    vuelo(duracion) {
        if (!this.listo) return;
        const t = this.ctx.currentTime;
        const s = this.ctx.createBufferSource();
        s.buffer = this.blanco;
        s.loop = true;
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.Q.value = 1.6;
        f.frequency.setValueAtTime(160, t);
        f.frequency.exponentialRampToValueAtTime(900, t + duracion * 0.5);
        f.frequency.exponentialRampToValueAtTime(180, t + duracion);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + duracion * 0.45);
        g.gain.linearRampToValueAtTime(0, t + duracion);
        s.connect(f).connect(g);
        this.conectar(g, 0.6, 0.6);
        s.start(t);
        s.stop(t + duracion + 0.1);
    }

    // Obturador: dos golpes de ruido muy cortos
    obturador() {
        if (!this.listo) return;
        const t = this.ctx.currentTime;
        [0, 0.07].forEach((retraso, i) => {
            const s = this.ctx.createBufferSource();
            s.buffer = this.blanco;
            const f = this.ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.value = i ? 2600 : 1800;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.35, t + retraso);
            g.gain.exponentialRampToValueAtTime(0.0001, t + retraso + 0.045);
            s.connect(f).connect(g).connect(this.master);
            s.start(t + retraso, Math.random());
            s.stop(t + retraso + 0.06);
        });
    }
}
