import { dateToJulian } from './julianthings.js';

const jdUTC = iso => dateToJulian(new Date(`${iso}Z`));
const norm180 = g => ((g % 360) + 540) % 360 - 180;

// Eclipses (máximo del eclipse, UTC; NASA Eclipse Web Site) e hitos de misiones
const FIJOS = [
    { fecha: '1999-08-11T11:03', tipo: 'eclipse-sol', objetivo: 'Tierra',
      titulo: ['Eclipse total de Sol', 'Total solar eclipse'], texto: ['La sombra de la Luna cruza Europa central.', 'The Moon’s shadow crosses central Europe.'] },
    { fecha: '2024-04-08T18:17', tipo: 'eclipse-sol', objetivo: 'Tierra',
      titulo: ['Eclipse total de Sol', 'Total solar eclipse'], texto: ['Visible en México, Estados Unidos y Canadá.', 'Visible from Mexico, the United States and Canada.'] },
    { fecha: '2026-03-03T11:33', tipo: 'eclipse-luna', objetivo: 'Luna',
      titulo: ['Eclipse total de Luna', 'Total lunar eclipse'], texto: ['La Luna entra en la sombra de la Tierra y se vuelve rojiza.', 'The Moon enters Earth’s shadow and turns reddish.'] },
    { fecha: '2026-08-12T17:46', tipo: 'eclipse-sol', objetivo: 'Tierra',
      titulo: ['Eclipse total de Sol', 'Total solar eclipse'], texto: ['Visible en Groenlandia, Islandia y España: el primero total en la península desde 1912.', 'Visible from Greenland, Iceland and Spain: the first total eclipse in mainland Spain since 1912.'] },
    { fecha: '2026-08-28T04:13', tipo: 'eclipse-luna', objetivo: 'Luna',
      titulo: ['Eclipse parcial de Luna', 'Partial lunar eclipse'], texto: ['Casi toda la Luna queda dentro de la sombra terrestre.', 'Almost the whole Moon falls inside Earth’s shadow.'] },
    { fecha: '2027-08-02T10:07', tipo: 'eclipse-sol', objetivo: 'Tierra',
      titulo: ['Eclipse total de Sol', 'Total solar eclipse'], texto: ['Uno de los más largos del siglo: sur de España, norte de África y Egipto.', 'One of the longest of the century: southern Spain, North Africa and Egypt.'] },
    { fecha: '2028-01-26T15:08', tipo: 'eclipse-sol', objetivo: 'Tierra',
      titulo: ['Eclipse anular de Sol', 'Annular solar eclipse'], texto: ['Un anillo de fuego sobre Sudamérica y, al atardecer, la península ibérica.', 'A ring of fire over South America and, at sunset, the Iberian Peninsula.'] },
    { fecha: '2028-12-31T16:52', tipo: 'eclipse-luna', objetivo: 'Luna',
      titulo: ['Eclipse total de Luna', 'Total lunar eclipse'], texto: ['Último eclipse del año, visible desde Asia y Australia.', 'The year’s last eclipse, visible from Asia and Australia.'] },
    { fecha: '2029-06-26T03:22', tipo: 'eclipse-luna', objetivo: 'Luna',
      titulo: ['Eclipse total de Luna', 'Total lunar eclipse'], texto: ['Una de las totalidades más largas del siglo XXI.', 'One of the longest totalities of the 21st century.'] },
    { fecha: '1979-03-05T12:05', tipo: 'mision', objetivo: 'nave-Voyager 1',
      titulo: ['Voyager 1 llega a Júpiter', 'Voyager 1 reaches Jupiter'], texto: ['Descubre los volcanes activos de Ío.', 'It discovers Io’s active volcanoes.'] },
    { fecha: '1980-11-12T23:46', tipo: 'mision', objetivo: 'nave-Voyager 1',
      titulo: ['Voyager 1 llega a Saturno', 'Voyager 1 reaches Saturn'], texto: ['Sobrevuela Titán y sale del plano de los planetas.', 'It flies past Titan and leaves the plane of the planets.'] },
    { fecha: '1986-01-24T17:59', tipo: 'mision', objetivo: 'nave-Voyager 2',
      titulo: ['Voyager 2 en Urano', 'Voyager 2 at Uranus'], texto: ['La primera y única visita a Urano.', 'The first and only visit to Uranus.'] },
    { fecha: '1989-08-25T03:56', tipo: 'mision', objetivo: 'nave-Voyager 2',
      titulo: ['Voyager 2 en Neptuno', 'Voyager 2 at Neptune'], texto: ['Descubre la Gran Mancha Oscura y los géiseres de Tritón.', 'It discovers the Great Dark Spot and Triton’s geysers.'] },
    { fecha: '2015-07-14T11:49', tipo: 'mision', objetivo: 'nave-New Horizons',
      titulo: ['New Horizons en Plutón', 'New Horizons at Pluto'], texto: ['Primeras imágenes de cerca de Plutón y Caronte.', 'The first close-up images of Pluto and Charon.'] },
    { fecha: '2019-01-01T05:33', tipo: 'mision', objetivo: 'nave-New Horizons',
      titulo: ['New Horizons en Arrokoth', 'New Horizons at Arrokoth'], texto: ['El objeto más lejano jamás visitado.', 'The most distant object ever visited.'] },
    { fecha: '2024-12-24T11:53', tipo: 'mision', objetivo: 'nave-Parker Solar Probe',
      titulo: ['Parker roza el Sol', 'Parker skims the Sun'], texto: ['Pasa a 6,1 millones de km de la superficie solar.', 'It passes 6.1 million km from the solar surface.'] },
    { fecha: '1986-02-09T11:00', tipo: 'cometa', buscar: 'Halley',
      titulo: ['El cometa Halley en el perihelio', 'Comet Halley at perihelion'], texto: ['Su último paso cerca del Sol; volverá en 2061.', 'Its last pass close to the Sun; it returns in 2061.'] }
];

// Momento en que un planeta exterior queda justo detrás de la Tierra visto desde el Sol (oposición)
function oposiciones(planeta, tierra, desde, hasta) {
    const diferencia = t => {
        const [px, py] = planeta.xyz_desde_E(planeta.calcular_E(t));
        const [tx, ty] = tierra.xyz_desde_E(tierra.calcular_E(t));
        return norm180((Math.atan2(py, px) - Math.atan2(ty, tx)) * 180 / Math.PI);
    };
    const resultado = [];
    let t0 = desde, d0 = diferencia(t0);
    for (let t = desde + 4; t <= hasta; t += 4) {
        const d = diferencia(t);
        if (d0 > 0 && d <= 0 && d0 - d < 90) {
            let a = t - 4, b = t;
            for (let k = 0; k < 40; k++) {
                const m = (a + b) / 2;
                if (diferencia(m) > 0) a = m; else b = m;
            }
            resultado.push((a + b) / 2);
        }
        t0 = t;
        d0 = d;
    }
    return resultado;
}

/**
 * Lista de eventos ordenada por fecha.
 * @param {{tierra, planetas: Array, cometas: Array}} cuerpos
 * @param {number} hoy - día juliano actual
 */
export function generarEventos({ tierra, planetas, cometas }, hoy) {
    const eventos = FIJOS.map(e => ({ ...e, jd: jdUTC(e.fecha) }));
    for (const planeta of planetas) {
        for (const jd of oposiciones(planeta, tierra, hoy - 30, hoy + 3 * 365.25)) {
            eventos.push({
                jd, tipo: 'oposicion', objetivo: planeta.nombre,
                titulo: [`Oposición de ${planeta.nombre}`, `${planeta.en} at opposition`],
                texto: ['El planeta está en el lado opuesto al Sol: es su mejor momento para observarlo, visible toda la noche.',
                        'The planet is opposite the Sun: the best time to observe it, visible all night long.']
            });
        }
    }
    // Próximos perihelios de cometas que se acercan al Sol más que Marte
    for (const cometa of cometas) {
        if (cometa.a * (1 - cometa.e) > 1.5) continue;
        const P = cometa.periodo();
        const jd = cometa.t0 + Math.ceil((hoy - cometa.t0) / P) * P;
        if (jd > hoy + 3 * 365.25 && !cometa.nombre.includes('Halley')) continue;
        eventos.push({
            jd, tipo: 'cometa', buscar: cometa.nombre,
            titulo: [`Perihelio de ${cometa.nombre}`, `${cometa.nombre} at perihelion`],
            texto: ['El cometa pasa por su punto más cercano al Sol y su cola alcanza el máximo.',
                    'The comet passes closest to the Sun and its tail is at its largest.']
        });
    }
    return eventos.sort((a, b) => a.jd - b.jd);
}
