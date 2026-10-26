// Textos de la interfaz en español e inglés
const TEXTOS = {
    es: {
        titulo: 'Sistema Solar',
        buscar: 'Buscar planeta, luna, asteroide…',
        sinResultados: 'Sin resultados',
        capas: 'Capas',
        compartir: 'Compartir',
        ayuda: 'Ayuda',
        vistaGeneral: 'Vista general',
        enlaceCopiado: 'Enlace copiado al portapapeles',
        enlaceListo: 'Copia este enlace:',
        cargando: 'Cargando texturas…',
        // Tipos de objeto (buscador)
        tipo_estrella: 'Estrella', tipo_planeta: 'Planeta', tipo_enano: 'Planeta enano', tipo_luna: 'Luna',
        tipo_asteroide: 'Asteroide', tipo_cometa: 'Cometa',
        // Capas
        etiquetas: 'Etiquetas', orbitas: 'Órbitas', lunas: 'Lunas', colas: 'Colas de cometas',
        cinturones: 'Cinturones', asteroides: 'Asteroides', cometas: 'Cometas',
        brilloFondo: 'Vía Láctea',
        // Tiempo
        hoy: 'Hoy', pausa: 'Pausa', reanudar: 'Reanudar', masLento: 'Más lento', masRapido: 'Más rápido',
        haciaAtras: 'Hacia atrás', haciaDelante: 'Hacia delante', elegirFecha: 'Elegir fecha',
        velocidades: ['Tiempo real', '1 minuto/s', '1 hora/s', '6 horas/s', '1 día/s', '1 semana/s', '1 mes/s', '3 meses/s', '1 año/s', '10 años/s'],
        meses: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        // Ficha
        info: 'Información', fisica: 'Física',
        diametro: 'Diámetro', gravedad: 'Gravedad', temperatura: 'Temperatura', temperaturaMedia: 'Temperatura media',
        edad: 'Edad', rotacion: 'Rotación', lunasFila: 'Lunas', distanciaPlaneta: 'Distancia al planeta',
        periodoOrbital: 'Periodo orbital', retrograda: 'retrógrada', tipoEspectral: 'Tipo espectral',
        semieje: 'Semieje mayor', excentricidad: 'Excentricidad', desconocido: 'desconocido', dias: 'días', anios: 'años', horas: 'h',
        formaReal: 'Forma real a partir de observaciones (NASA 3D Resources).',
        lunaDe: 'Luna de {0}', distanciaSol: 'Distancia al Sol',
        clase_C: 'carbonáceo', clase_S: 'silíceo', clase_V: 'basáltico', clase_M: 'metálico', clase_cometa: 'núcleo de cometa',
        // Física
        kepler: 'Kepler', clasica: 'Clásica', relatividad: 'Relatividad',
        metodoKepler: 'Leyes de Kepler', metodoEuler: 'Método de Euler', metodoRK4: 'Runge-Kutta 4',
        explicaKepler: 'Solución analítica de la órbita elíptica (ecuación de Kepler y vis-viva).',
        explicaClasica: 'Integración numérica de la gravedad de Newton paso a paso, comparada con la solución exacta.',
        explicaRelatividad: 'Correcciones de la relatividad: dilatación temporal y precesión del perihelio.',
        sinFisica: 'Los cálculos orbitales están disponibles para planetas, planetas enanos, asteroides y cometas.',
        solSinOrbita: 'El Sol está en el centro del sistema: no tiene órbita.',
        velocidadOrbital: 'Velocidad orbital', errorKepler: 'Error frente a Kepler', derivaEnergia: 'Deriva de energía',
        masaCuerpo: 'Masa', masaSol3: 'Masa del Sol (3.ª ley)', constante: 'constante', masaReposo: 'Masa en reposo',
        masaRelativista: 'Masa relativista (γm)', schwarzschild: 'Radio de Schwarzschild / r',
        dilatacion: 'Dilatación temporal', precesion: 'Precesión del perihelio', porSiglo: '″/siglo', sPorAnio: 's/año',
        eventos: 'Eventos', tour: 'Recorrido guiado', regla: 'Medir distancias', naves: 'Naves espaciales',
        escalaReal: 'Tamaños a escala real', salirTour: 'Salir · Esc', proximos: 'Próximos', historia: 'Historia',
        tipo_nave: 'Nave espacial', lanzamiento: 'Lanzamiento', distanciaSolUA: 'Distancia al Sol', velocidad: 'Velocidad',
        luzTarda: 'La luz tarda', fueraDeRango: 'Fuera del periodo con datos', reglaInicio: 'Haz clic en dos astros para medir la distancia entre ellos',
        reglaSegundo: 'Elige el segundo astro', minutosLuz: 'min luz', horasLuz: 'h luz', segundosLuz: 's luz',
        escalaActivada: 'Tamaños a escala real: los planetas son diminutos comparados con sus distancias',
        cargandoHD: 'Cargando texturas en alta resolución…',
        cartografia: 'Cartografía celeste', tAlt: 'Alt', tSol: 'Sol', tVel: 'Vel', tIlum: 'Ilum', tDist: 'Dist',
        arranque: ['Iniciando efemérides · J2000', 'Teoría lunar · Meeus cap. 47', 'Sincronizando reloj · {0} UTC', 'Texturas · {0} / {1}', 'Catálogo JPL · {0} asteroides · {1} cometas · {2} naves', 'Sistema listo'],
        foto: 'Hacer una foto', fotoGuardada: 'Foto guardada', sonido: 'Sonido', sonidoActivado: 'Sonido activado', sonidoDesactivado: 'Sonido desactivado',
        verCielo: 'Ver el sistema desde aquí', volverOrbita: 'Volver a la órbita',
        solSobre: 'Sol a {0}° sobre el horizonte', solBajo: 'Sol {0}° bajo el horizonte', horaSolar: 'hora solar local {0}',
        puntosCardinales: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
        'evento_eclipse-sol': 'Eclipse de Sol', 'evento_eclipse-luna': 'Eclipse de Luna', evento_oposicion: 'Oposición',
        evento_cometa: 'Cometa', evento_mision: 'Misión espacial',
        // Ayuda
        ayudaTitulo: 'Cómo usar el simulador',
        ayudaTexto: [
            ['Arrastrar', 'Girar la cámara'],
            ['Rueda / pellizcar', 'Acercar y alejar'],
            ['Clic en un astro o su nombre', 'Seleccionarlo y viajar hasta él'],
            ['Espacio', 'Pausar / reanudar'],
            ['← →', 'Más lento / más rápido'],
            ['R', 'Invertir el sentido del tiempo'],
            ['/', 'Buscar'],
            ['Esc', 'Vista general del Sistema Solar'],
            ['T', 'Recorrido guiado'],
            ['M', 'Medir distancias'],
            ['E', 'Tamaños a escala real'],
            ['V', 'Ver el sistema desde el astro seleccionado'],
            ['F', 'Hacer una foto'],
            ['S', 'Activar o silenciar el sonido'],
            ['L · O', 'Mostrar u ocultar etiquetas · órbitas']
        ],
        entendido: 'Entendido',
        escalaAviso: 'Los tamaños de los astros están ampliados para que se vean; las distancias entre planetas son reales a escala.'
    },
    en: {
        titulo: 'Solar System',
        buscar: 'Search planet, moon, asteroid…',
        sinResultados: 'No results',
        capas: 'Layers',
        compartir: 'Share',
        ayuda: 'Help',
        vistaGeneral: 'Overview',
        enlaceCopiado: 'Link copied to clipboard',
        enlaceListo: 'Copy this link:',
        cargando: 'Loading textures…',
        tipo_estrella: 'Star', tipo_planeta: 'Planet', tipo_enano: 'Dwarf planet', tipo_luna: 'Moon',
        tipo_asteroide: 'Asteroid', tipo_cometa: 'Comet',
        etiquetas: 'Labels', orbitas: 'Orbits', lunas: 'Moons', colas: 'Comet tails',
        cinturones: 'Belts', asteroides: 'Asteroids', cometas: 'Comets',
        brilloFondo: 'Milky Way',
        hoy: 'Today', pausa: 'Pause', reanudar: 'Play', masLento: 'Slower', masRapido: 'Faster',
        haciaAtras: 'Backwards', haciaDelante: 'Forwards', elegirFecha: 'Pick a date',
        velocidades: ['Real time', '1 minute/s', '1 hour/s', '6 hours/s', '1 day/s', '1 week/s', '1 month/s', '3 months/s', '1 year/s', '10 years/s'],
        meses: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        info: 'Overview', fisica: 'Physics',
        diametro: 'Diameter', gravedad: 'Gravity', temperatura: 'Temperature', temperaturaMedia: 'Mean temperature',
        edad: 'Age', rotacion: 'Rotation', lunasFila: 'Moons', distanciaPlaneta: 'Distance to planet',
        periodoOrbital: 'Orbital period', retrograda: 'retrograde', tipoEspectral: 'Spectral type',
        semieje: 'Semi-major axis', excentricidad: 'Eccentricity', desconocido: 'unknown', dias: 'days', anios: 'years', horas: 'h',
        formaReal: 'Real shape from observations (NASA 3D Resources).',
        lunaDe: 'Moon of {0}', distanciaSol: 'Distance to the Sun',
        clase_C: 'carbonaceous', clase_S: 'stony', clase_V: 'basaltic', clase_M: 'metallic', clase_cometa: 'comet nucleus',
        kepler: 'Kepler', clasica: 'Classical', relatividad: 'Relativity',
        metodoKepler: 'Kepler’s laws', metodoEuler: 'Euler method', metodoRK4: 'Runge-Kutta 4',
        explicaKepler: 'Analytical solution of the elliptical orbit (Kepler’s equation and vis-viva).',
        explicaClasica: 'Step-by-step numerical integration of Newtonian gravity, compared with the exact solution.',
        explicaRelatividad: 'Relativistic corrections: time dilation and perihelion precession.',
        sinFisica: 'Orbital calculations are available for planets, dwarf planets, asteroids and comets.',
        solSinOrbita: 'The Sun sits at the centre of the system: it has no orbit.',
        velocidadOrbital: 'Orbital speed', errorKepler: 'Error vs. Kepler', derivaEnergia: 'Energy drift',
        masaCuerpo: 'Mass', masaSol3: 'Mass of the Sun (3rd law)', constante: 'constant', masaReposo: 'Rest mass',
        masaRelativista: 'Relativistic mass (γm)', schwarzschild: 'Schwarzschild radius / r',
        dilatacion: 'Time dilation', precesion: 'Perihelion precession', porSiglo: '″/century', sPorAnio: 's/year',
        eventos: 'Events', tour: 'Guided tour', regla: 'Measure distances', naves: 'Spacecraft',
        escalaReal: 'True-scale sizes', salirTour: 'Exit · Esc', proximos: 'Upcoming', historia: 'History',
        tipo_nave: 'Spacecraft', lanzamiento: 'Launch', distanciaSolUA: 'Distance to the Sun', velocidad: 'Speed',
        luzTarda: 'Light travel time', fueraDeRango: 'Outside the period with data', reglaInicio: 'Click two bodies to measure the distance between them',
        reglaSegundo: 'Pick the second body', minutosLuz: 'light-min', horasLuz: 'light-h', segundosLuz: 'light-s',
        escalaActivada: 'True-scale sizes: planets are tiny compared with the distances between them',
        cargandoHD: 'Loading high-resolution textures…',
        cartografia: 'Sky chart', tAlt: 'Alt', tSol: 'Sun', tVel: 'Vel', tIlum: 'Illum', tDist: 'Dist',
        arranque: ['Initialising ephemerides · J2000', 'Lunar theory · Meeus ch. 47', 'Syncing clock · {0} UTC', 'Textures · {0} / {1}', 'JPL catalogue · {0} asteroids · {1} comets · {2} spacecraft', 'System ready'],
        foto: 'Take a photo', fotoGuardada: 'Photo saved', sonido: 'Sound', sonidoActivado: 'Sound on', sonidoDesactivado: 'Sound off',
        verCielo: 'View the system from here', volverOrbita: 'Back to orbit',
        solSobre: 'Sun {0}° above the horizon', solBajo: 'Sun {0}° below the horizon', horaSolar: 'local solar time {0}',
        puntosCardinales: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
        'evento_eclipse-sol': 'Solar eclipse', 'evento_eclipse-luna': 'Lunar eclipse', evento_oposicion: 'Opposition',
        evento_cometa: 'Comet', evento_mision: 'Space mission',
        ayudaTitulo: 'How to use the simulator',
        ayudaTexto: [
            ['Drag', 'Rotate the camera'],
            ['Wheel / pinch', 'Zoom in and out'],
            ['Click a body or its name', 'Select it and fly to it'],
            ['Space', 'Pause / play'],
            ['← →', 'Slower / faster'],
            ['R', 'Reverse time'],
            ['/', 'Search'],
            ['Esc', 'Solar System overview'],
            ['T', 'Guided tour'],
            ['M', 'Measure distances'],
            ['E', 'True-scale sizes'],
            ['V', 'View the system from the selected body'],
            ['F', 'Take a photo'],
            ['S', 'Toggle sound'],
            ['L · O', 'Toggle labels · orbits']
        ],
        entendido: 'Got it',
        escalaAviso: 'Body sizes are enlarged so they can be seen; distances between planets are true to scale.'
    }
};

const leerIdioma = () => {
    try { return localStorage.getItem('idioma'); } catch (e) { return null; }
};

// Idioma guardado o, si no hay, el del navegador
export let idioma = leerIdioma() || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');

// Texto traducido; {0}, {1}… se sustituyen por los argumentos
export function t(clave, ...args) {
    const texto = TEXTOS[idioma][clave] ?? TEXTOS.es[clave] ?? clave;
    return typeof texto === 'string' ? texto.replace(/\{(\d)\}/g, (_, i) => args[i]) : texto;
}

// Elige entre una pareja [es, en] o devuelve el valor tal cual
export const tr = valor => (Array.isArray(valor) ? valor[idioma === 'es' ? 0 : 1] : valor);

export function setIdioma(nuevo) {
    idioma = nuevo;
    try { localStorage.setItem('idioma', nuevo); } catch (e) { /* sin almacenamiento */ }
    document.documentElement.lang = nuevo;
    aplicarTraducciones();
}

// Traduce los elementos marcados con data-i18n, data-i18n-placeholder, data-i18n-title
export function aplicarTraducciones() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
        el.setAttribute('aria-label', el.title);
    });
}
