import { tr } from './i18n.js';

const $ = id => document.getElementById(id);
const DURACION = 10000; // ms por parada

// Paradas del recorrido: objetivo, encuadre (factor × tamaño o radio fijo), velocidad del tiempo (días/s) y textos
const PASOS = [
    { objetivo: 'vista-general', radio: 1500, phi: 1.05, velocidad: 7,
      titulo: ['El Sistema Solar', 'The Solar System'],
      texto: ['Una estrella, ocho planetas y millones de cuerpos menores. Las posiciones que ves son las reales.',
              'One star, eight planets and millions of smaller bodies. The positions you see are the real ones.'] },
    { objetivo: 'Sol', factor: 4, velocidad: 1 / 24,
      titulo: ['El Sol', 'The Sun'],
      texto: ['Una esfera de plasma de 1,4 millones de km que reúne casi toda la masa del sistema.',
              'A 1.4-million-km sphere of plasma holding almost all the mass of the system.'] },
    { objetivo: 'Tierra', factor: 4, velocidad: 1 / 24,
      titulo: ['La Tierra', 'Earth'],
      texto: ['El único mundo conocido con vida. De noche, sus ciudades dibujan los continentes.',
              'The only known world with life. At night, its cities outline the continents.'] },
    { objetivo: 'Luna', factor: 5, velocidad: 1 / 24,
      titulo: ['La Luna', 'The Moon'],
      texto: ['A 384 400 km de nosotros, siempre nos muestra la misma cara.',
              '384,400 km away, it always shows us the same face.'] },
    { objetivo: 'Marte', factor: 4.5, velocidad: 1 / 24,
      titulo: ['Marte', 'Mars'],
      texto: ['El planeta rojo, objetivo de la próxima gran exploración humana.',
              'The red planet, target of the next great human exploration.'] },
    { objetivo: 'vista-general', radio: 230, phi: 0.55, velocidad: 7,
      titulo: ['El cinturón de asteroides', 'The asteroid belt'],
      texto: ['Entre Marte y Júpiter orbitan millones de rocas. Los huecos que ves los abre la gravedad de Júpiter.',
              'Millions of rocks orbit between Mars and Jupiter. The gaps you see are carved by Jupiter’s gravity.'] },
    { objetivo: 'Júpiter', factor: 9, velocidad: 1 / 4,
      titulo: ['Júpiter', 'Jupiter'],
      texto: ['Más del doble de masa que todos los demás planetas juntos. Sus cuatro grandes lunas giran a su alrededor.',
              'More than twice the mass of all the other planets combined. Its four large moons circle around it.'] },
    { objetivo: 'Saturno', factor: 2, velocidad: 1 / 24,
      titulo: ['Saturno', 'Saturn'],
      texto: ['Sus anillos miden 280 000 km de diámetro y apenas unas decenas de metros de grosor.',
              'Its rings span 280,000 km yet are only tens of metres thick.'] },
    { objetivo: 'Urano', factor: 4.5, velocidad: 1 / 24,
      titulo: ['Urano', 'Uranus'],
      texto: ['Gira tumbado, con el eje inclinado 98°.', 'It rolls on its side, its axis tilted 98°.'] },
    { objetivo: 'Neptuno', factor: 4.5, velocidad: 1 / 24,
      titulo: ['Neptuno', 'Neptune'],
      texto: ['A 4 500 millones de km, la luz del Sol tarda más de cuatro horas en llegar.',
              'At 4.5 billion km, sunlight takes more than four hours to arrive.'] },
    { objetivo: 'Plutón', factor: 5, velocidad: 1 / 24,
      titulo: ['Plutón', 'Pluto'],
      texto: ['En el cinturón de Kuiper, con su corazón de hielo de nitrógeno.', 'Out in the Kuiper belt, with its heart of nitrogen ice.'] },
    { objetivo: 'nave-Voyager 1', radio: 400, phi: 1.2, velocidad: 30,
      titulo: ['Voyager 1', 'Voyager 1'],
      texto: ['Lanzada en 1977, es el objeto humano más lejano: más de 160 UA del Sol, y sigue alejándose.',
              'Launched in 1977, it is the most distant human-made object: over 160 AU from the Sun and still going.'] },
    { objetivo: 'vista-general', radio: 6000, phi: 1.1, velocidad: 30,
      titulo: ['Un punto azul pálido', 'A pale blue dot'],
      texto: ['Desde aquí, todo lo que conocemos cabe en un punto de luz.', 'From out here, everything we know fits in a single point of light.'] }
];

/**
 * Recorrido automático con cámara cinematográfica.
 * `app.irAParada(paso)` encuadra el objetivo; `app.alEmpezarTour` / `app.alTerminarTour` guardan y restauran el estado.
 */
export default class Tour {
    constructor(app) {
        this.app = app;
        this.activo = false;
        this.indice = 0;
        this.temporizador = null;
        $('cine-salir').addEventListener('click', () => this.salir());
        window.addEventListener('keydown', e => {
            if (!this.activo) return;
            if (e.key === 'Escape') { e.stopImmediatePropagation(); this.salir(); }
            else if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); this.ir(this.indice + 1); }
            else if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); this.ir(this.indice - 1); }
        }, true);
    }

    iniciar() {
        if (this.activo) return;
        this.activo = true;
        this.app.alEmpezarTour();
        document.body.classList.add('modo-cine');
        $('cine').hidden = false;
        $('cine-progreso').innerHTML = PASOS.map(() => '<span><i></i></span>').join('');
        this.ir(0);
    }

    ir(i) {
        if (i >= PASOS.length) return this.salir();
        this.indice = Math.max(0, i);
        const paso = PASOS[this.indice];
        clearTimeout(this.temporizador);
        this.app.irAParada(paso);
        this.pintar();
        // Barras de progreso: completas las anteriores, animada la actual
        [...$('cine-progreso').querySelectorAll('i')].forEach((barra, k) => {
            barra.style.transition = 'none';
            barra.style.width = k < this.indice ? '100%' : '0';
            if (k === this.indice) {
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    barra.style.transition = `width ${DURACION}ms linear`;
                    barra.style.width = '100%';
                }));
            }
        });
        this.temporizador = setTimeout(() => this.ir(this.indice + 1), DURACION);
    }

    // Textos de la parada actual (se repinta al cambiar de idioma)
    pintar() {
        if (!this.activo) return;
        const paso = PASOS[this.indice];
        const texto = $('cine-texto');
        $('cine-paso').textContent = `${String(this.indice + 1).padStart(2, '0')} / ${String(PASOS.length).padStart(2, '0')}`;
        $('cine-titulo').textContent = tr(paso.titulo);
        $('cine-subtitulo').textContent = tr(paso.texto);
        texto.classList.remove('entrando');
        void texto.offsetWidth; // reinicia la animación de entrada
        texto.classList.add('entrando');
    }

    salir() {
        if (!this.activo) return;
        this.activo = false;
        clearTimeout(this.temporizador);
        document.body.classList.remove('modo-cine');
        $('cine').hidden = true;
        this.app.alTerminarTour();
    }
}
