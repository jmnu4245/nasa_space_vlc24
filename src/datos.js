// Constantes de escala y datos físicos de la simulación
export const SCALE_DISTANCE = 50;       // unidades de escena por UA
export const SCALE_SIZE = 0.00001436;   // unidades de escena por km (tamaños y órbitas de lunas)
export const J2000 = 2451545.0;         // día juliano de la época J2000

// Elementos orbitales medios en J2000 (a en UA, ángulos en grados, rotacion en días, masa en kg).
// L = longitud media, varpi = longitud del perihelio, periodo = periodo sidéreo en días.
export const PLANETAS = [
    { nombre: 'Sol', en: 'Sun', radio: 696340, textura: 'textura_sol.jpg', color: 0xffe59e, masa: 1.98847e30, rotacion: 25.38 },
    { nombre: 'Mercurio', en: 'Mercury', radio: 2439.7, textura: 'textura_mercurio.jpg', color: 0xc2c2c2, masa: 3.3011e23, rotacion: 58.6,
      e: 0.20563593, a: 0.38709927, I: 7.00497902, Omega: 48.33076593, varpi: 77.45779628, L: 252.25032350, periodo: 87.969 },
    { nombre: 'Venus', en: 'Venus', radio: 6051.8, textura: 'textura_venus.jpg', color: 0xffd5a0, masa: 4.8675e24, rotacion: -243, // retrógrada
      e: 0.00677672, a: 0.72333566, I: 3.39467605, Omega: 76.67984255, varpi: 131.60246718, L: 181.97909950, periodo: 224.701 },
    { nombre: 'Tierra', en: 'Earth', radio: 6371.0, textura: 'textura_tierra.jpg', color: 0xa3c1e0, masa: 5.9724e24, rotacion: 1,
      e: 0.01671123, a: 1.00000261, I: -0.00001531, Omega: 0, varpi: 102.93768193, L: 100.46457166, periodo: 365.256 },
    { nombre: 'Marte', en: 'Mars', radio: 3389.5, textura: 'textura_marte.jpg', color: 0xffb3b3, masa: 6.4171e23, rotacion: 1.03,
      e: 0.09339410, a: 1.52371034, I: 1.84969142, Omega: 49.55953891, varpi: -23.94362959, L: -4.55343205, periodo: 686.98 },
    { nombre: 'Júpiter', en: 'Jupiter', radio: 69911, textura: 'textura_jupiter.jpg', color: 0xffd5a0, masa: 1.8982e27, rotacion: 0.41,
      e: 0.04838624, a: 5.20288700, I: 1.30439695, Omega: 100.47390909, varpi: 14.72847983, L: 34.39644051, periodo: 4332.59 },
    { nombre: 'Saturno', en: 'Saturn', radio: 58232, textura: 'textura_saturno.jpg', color: 0xffe59e, masa: 5.6834e26, rotacion: 0.45,
      e: 0.05386179, a: 9.53667594, I: 2.48599187, Omega: 113.66242448, varpi: 92.59887831, L: 49.95424423, periodo: 10759.22 },
    { nombre: 'Urano', en: 'Uranus', radio: 25362, textura: 'textura_urano.jpg', color: 0xb3e0e0, masa: 8.6810e25, rotacion: -0.72, // retrógrada
      e: 0.04725744, a: 19.18916464, I: 0.77263783, Omega: 74.01692503, varpi: 170.95427630, L: 313.23810451, periodo: 30685.49 },
    { nombre: 'Neptuno', en: 'Neptune', radio: 24622, textura: 'textura_neptuno.jpg', color: 0xa3c1e0, masa: 1.02413e26, rotacion: 0.67,
      e: 0.00859048, a: 30.06992276, I: 1.77004347, Omega: 131.78422574, varpi: 44.96476227, L: -55.12002969, periodo: 60190.03 }
];

// Polo norte de rotación de cada cuerpo (ascensión recta y declinación J2000 en grados, IAU)
export const POLOS = [
    [286.13, 63.87],   // Sol
    [281.01, 61.42],   // Mercurio
    [272.76, 67.16],   // Venus
    [0, 90],           // Tierra
    [317.68, 52.89],   // Marte
    [268.05, 64.49],   // Júpiter
    [40.59, 83.54],    // Saturno
    [257.31, -15.18],  // Urano
    [299.36, 43.46]    // Neptuno
];

// Radios que cubre la textura de los anillos de Saturno (km): del anillo C al F
export const ANILLOS_SATURNO = { interior: 69760, exterior: 140900 };

// Planetas enanos: elementos keplerianos de la JPL Small-Body Database (w = argumento del perihelio,
// tp = paso por el perihelio, n = movimiento medio en grados/día). ejes: forma elipsoidal (Haumea).
export const ENANOS = [
    { nombre: 'Ceres', en: 'Ceres', radio: 469.7, textura: 'ceres_fictional.jpg', color: 0xbbb4a8, masa: 9.38e20, rotacion: 0.3781, polo: [291.42, 66.76],
      e: 0.0796923, a: 2.7655526, i: 10.5880278, om: 80.2486268, w: 73.2942145, tp: 2461599.8414666, n: 0.2143044506 },
    { nombre: 'Plutón', en: 'Pluto', radio: 1188.3, textura: 'textura_pluton.jpg', color: 0xd8b48c, masa: 1.303e22, rotacion: -6.387, polo: [132.99, -6.16],
      e: 0.2518379, a: 39.5886294, i: 17.1477114, om: 110.2923841, w: 113.7090015, tp: 2447812.0941600, n: 0.003956838956 },
    { nombre: 'Eris', en: 'Eris', radio: 1163, textura: 'eris_fictional.jpg', color: 0xd0d0d0, masa: 1.66e22, rotacion: 15.79,
      e: 0.4382385, a: 67.9339469, i: 43.9258279, om: 36.0047704, w: 150.7949235, tp: 2545407.7168470, n: 0.001760247771 },
    { nombre: 'Makemake', en: 'Makemake', radio: 715, textura: 'makemake_fictional.jpg', color: 0xc89070, masa: 3.1e21, rotacion: 0.9511,
      e: 0.1588890, a: 45.5709332, i: 29.0278560, om: 79.2948338, w: 297.0922733, tp: 2408158.6940986, n: 0.003203850120 },
    { nombre: 'Haumea', en: 'Haumea', radio: 816, textura: 'haumea_fictional.jpg', color: 0xe0e0e0, masa: 4.006e21, rotacion: 0.16314, ejes: [1.29, 0.66, 1.03],
      e: 0.1944430, a: 43.0602902, i: 28.2084739, om: 121.7860561, w: 240.6905473, tp: 2500416.5996153, n: 0.003488097732 }
];

// Lunas con órbita circular (distancia en km, periodo en días; negativo = retrógrada).
// Orbitan en el plano ecuatorial de su planeta, salvo la Luna (inclinada 5,1° sobre la eclíptica).
// ejes: forma elipsoidal (eje Y = eje de giro) para las lunas irregulares.
export const LUNAS = [
    { nombre: 'Luna', en: 'Moon', planeta: 'Tierra', distancia: 384400, periodo: 27.3217, radio: 1737.4, color: 0xaaaaaa, textura: 'textura_luna.jpg', inclinacionEcliptica: 5.145 },
    { nombre: 'Fobos', en: 'Phobos', planeta: 'Marte', distancia: 9376, periodo: 0.31891, radio: 11.08, color: 0x8a7f74, textura: 'textura_fobos.jpg', ejes: [1.17, 0.82, 1.03] },
    { nombre: 'Deimos', en: 'Deimos', planeta: 'Marte', distancia: 23463, periodo: 1.26244, radio: 6.2, color: 0x9a8e80, ejes: [1.21, 0.8, 0.95] },
    { nombre: 'Ío', en: 'Io', planeta: 'Júpiter', distancia: 421700, periodo: 1.769, radio: 1821.6, color: 0xe0c060, textura: 'textura_io.jpg' },
    { nombre: 'Europa', en: 'Europa', planeta: 'Júpiter', distancia: 671034, periodo: 3.551, radio: 1560.8, color: 0xc8b89a, textura: 'textura_europa.jpg' },
    { nombre: 'Ganímedes', en: 'Ganymede', planeta: 'Júpiter', distancia: 1070412, periodo: 7.155, radio: 2634.1, color: 0x9a8f85, textura: 'textura_ganimedes.jpg' },
    { nombre: 'Calisto', en: 'Callisto', planeta: 'Júpiter', distancia: 1882709, periodo: 16.689, radio: 2410.3, color: 0x6b5f55, textura: 'textura_calisto.jpg' },
    { nombre: 'Encélado', en: 'Enceladus', planeta: 'Saturno', distancia: 238042, periodo: 1.370, radio: 252.1, color: 0xf0f4f8, textura: 'textura_encelado.jpg' },
    { nombre: 'Titán', en: 'Titan', planeta: 'Saturno', distancia: 1221870, periodo: 15.945, radio: 2574.7, color: 0xd8a050, atmosfera: 0xffb050 },
    { nombre: 'Tritón', en: 'Triton', planeta: 'Neptuno', distancia: 354759, periodo: -5.877, radio: 1353.4, color: 0xc0c0d0, textura: 'textura_triton.jpg' },
    { nombre: 'Caronte', en: 'Charon', planeta: 'Plutón', distancia: 19591, periodo: 6.387, radio: 606, color: 0x9a9590, textura: 'textura_caronte.jpg' }
];

// Fichas informativas (español / inglés) por nombre del cuerpo
const f = (tipo, texto, datos) => ({ tipo, texto, datos });
export const FICHAS = {
    'Sol': f(['Estrella (enana amarilla G2V)', 'Star (G2V yellow dwarf)'],
        ['Contiene el 99,86 % de la masa del Sistema Solar. En su núcleo, la fusión de hidrógeno en helio produce la energía que ilumina a todos los planetas.',
         'It holds 99.86% of the Solar System’s mass. Hydrogen fusion in its core produces the energy that lights every planet.'],
        [['diametro', '1 392 700 km'], ['temperatura', '5 500 °C'], ['edad', ['4 600 millones de años', '4.6 billion years']], ['rotacion', ['25,4 días (ecuador)', '25.4 days (equator)']]]),
    'Mercurio': f(['Planeta rocoso', 'Rocky planet'],
        ['El planeta más pequeño y cercano al Sol. Casi sin atmósfera, pasa de noches gélidas a días abrasadores.',
         'The smallest planet and the closest to the Sun. With almost no atmosphere, it swings from freezing nights to scorching days.'],
        [['diametro', '4 879 km'], ['gravedad', '3,7 m/s²'], ['temperatura', '−180 / 430 °C'], ['lunas', '0']]),
    'Venus': f(['Planeta rocoso', 'Rocky planet'],
        ['Su densa atmósfera de CO₂ provoca un efecto invernadero extremo: es el planeta más caliente. Gira al revés que casi todos los demás.',
         'Its thick CO₂ atmosphere causes a runaway greenhouse effect, making it the hottest planet. It spins backwards compared with most others.'],
        [['diametro', '12 104 km'], ['gravedad', '8,87 m/s²'], ['temperatura', '465 °C'], ['lunas', '0']]),
    'Tierra': f(['Planeta rocoso', 'Rocky planet'],
        ['El único lugar conocido con vida. El 71 % de su superficie está cubierto por océanos de agua líquida.',
         'The only known place with life. Liquid water oceans cover 71% of its surface.'],
        [['diametro', '12 742 km'], ['gravedad', '9,81 m/s²'], ['temperaturaMedia', '15 °C'], ['lunas', '1']]),
    'Marte': f(['Planeta rocoso', 'Rocky planet'],
        ['El planeta rojo debe su color al óxido de hierro. Alberga el Olympus Mons, el mayor volcán conocido del Sistema Solar.',
         'The red planet owes its colour to iron oxide. It is home to Olympus Mons, the largest known volcano in the Solar System.'],
        [['diametro', '6 779 km'], ['gravedad', '3,71 m/s²'], ['temperaturaMedia', '−63 °C'], ['lunas', ['2 (Fobos y Deimos)', '2 (Phobos and Deimos)']]]),
    'Júpiter': f(['Gigante gaseoso', 'Gas giant'],
        ['El mayor planeta: cabrían 1 300 Tierras en su interior. Su Gran Mancha Roja es una tormenta más grande que la Tierra.',
         'The largest planet: 1,300 Earths would fit inside. Its Great Red Spot is a storm bigger than Earth.'],
        [['diametro', '139 820 km'], ['gravedad', '24,79 m/s²'], ['temperatura', '−110 °C'], ['lunas', ['más de 90', 'over 90']]]),
    'Saturno': f(['Gigante gaseoso', 'Gas giant'],
        ['Famoso por sus anillos de hielo y roca. Es tan poco denso que flotaría en el agua.',
         'Famous for its rings of ice and rock. It is so light that it would float in water.'],
        [['diametro', '116 460 km'], ['gravedad', '10,44 m/s²'], ['temperatura', '−140 °C'], ['lunas', ['más de 270', 'over 270']]]),
    'Urano': f(['Gigante helado', 'Ice giant'],
        ['Su eje está inclinado 98°, así que gira prácticamente tumbado y cada polo pasa 42 años de día continuo.',
         'Its axis is tilted 98°, so it spins on its side and each pole gets 42 years of continuous daylight.'],
        [['diametro', '50 724 km'], ['gravedad', '8,69 m/s²'], ['temperatura', '−195 °C'], ['lunas', ['más de 25', 'over 25']]]),
    'Neptuno': f(['Gigante helado', 'Ice giant'],
        ['El planeta más lejano. En él soplan los vientos más rápidos del Sistema Solar, de más de 2 000 km/h.',
         'The farthest planet. It has the fastest winds in the Solar System, over 2,000 km/h.'],
        [['diametro', '49 244 km'], ['gravedad', '11,15 m/s²'], ['temperatura', '−200 °C'], ['lunas', '16']]),
    'Ceres': f(['Planeta enano (cinturón de asteroides)', 'Dwarf planet (asteroid belt)'],
        ['El mayor objeto del cinturón de asteroides. La sonda Dawn descubrió en sus cráteres manchas brillantes de sales.',
         'The largest object in the asteroid belt. The Dawn probe found bright salt deposits inside its craters.'],
        [['diametro', '939 km'], ['gravedad', '0,28 m/s²'], ['temperatura', '−105 °C'], ['lunas', '0']]),
    'Plutón': f(['Planeta enano (cinturón de Kuiper)', 'Dwarf planet (Kuiper belt)'],
        ['Fue el noveno planeta hasta 2006. New Horizons reveló en 2015 una enorme llanura de hielo de nitrógeno con forma de corazón.',
         'It was the ninth planet until 2006. In 2015 New Horizons revealed a huge heart-shaped plain of nitrogen ice.'],
        [['diametro', '2 377 km'], ['gravedad', '0,62 m/s²'], ['temperatura', '−230 °C'], ['lunas', '5']]),
    'Eris': f(['Planeta enano (disco disperso)', 'Dwarf planet (scattered disc)'],
        ['Casi del tamaño de Plutón pero más masiva. Su descubrimiento en 2005 llevó a redefinir qué es un planeta.',
         'Almost as large as Pluto but more massive. Its discovery in 2005 led to the redefinition of what a planet is.'],
        [['diametro', '2 326 km'], ['temperatura', '−240 °C'], ['lunas', '1 (Disnomia)']]),
    'Makemake': f(['Planeta enano (cinturón de Kuiper)', 'Dwarf planet (Kuiper belt)'],
        ['Uno de los objetos más brillantes del cinturón de Kuiper, cubierto de hielo de metano rojizo.',
         'One of the brightest Kuiper belt objects, covered in reddish methane ice.'],
        [['diametro', '1 430 km'], ['temperatura', '−240 °C'], ['lunas', '1']]),
    'Haumea': f(['Planeta enano (cinturón de Kuiper)', 'Dwarf planet (Kuiper belt)'],
        ['Gira tan deprisa (cada 3,9 horas) que se ha estirado hasta parecer un balón de rugby. Tiene un anillo.',
         'It spins so fast (every 3.9 hours) that it has stretched into a rugby-ball shape. It has a ring.'],
        [['diametro', '2 100 × 1 680 × 1 074 km'], ['temperatura', '−241 °C'], ['lunas', '2']]),
    'Luna': f(['Satélite de la Tierra', 'Earth’s satellite'],
        ['Siempre nos muestra la misma cara. Es el único otro mundo que ha pisado el ser humano.',
         'It always shows us the same face. It is the only other world humans have walked on.'], []),
    'Fobos': f(['Satélite de Marte', 'Moon of Mars'],
        ['Probablemente un asteroide capturado. Se acerca a Marte poco a poco y acabará despedazándose en un anillo.',
         'Probably a captured asteroid. It is slowly spiralling in towards Mars and will eventually break up into a ring.'], []),
    'Deimos': f(['Satélite de Marte', 'Moon of Mars'],
        ['La más pequeña y lejana de las dos lunas de Marte, de superficie lisa cubierta de polvo.',
         'The smaller and more distant of Mars’s two moons, with a smooth, dusty surface.'], []),
    'Ío': f(['Satélite de Júpiter', 'Moon of Jupiter'],
        ['El mundo con más actividad volcánica del Sistema Solar, calentado por las mareas de Júpiter.',
         'The most volcanically active world in the Solar System, heated by Jupiter’s tides.'], []),
    'Europa': f(['Satélite de Júpiter', 'Moon of Jupiter'],
        ['Bajo su corteza de hielo esconde un océano de agua salada: uno de los mejores lugares para buscar vida.',
         'Beneath its icy crust lies a salty ocean, one of the best places to search for life.'], []),
    'Ganímedes': f(['Satélite de Júpiter', 'Moon of Jupiter'],
        ['La mayor luna del Sistema Solar, más grande que Mercurio, y la única con campo magnético propio.',
         'The largest moon in the Solar System, bigger than Mercury, and the only one with its own magnetic field.'], []),
    'Calisto': f(['Satélite de Júpiter', 'Moon of Jupiter'],
        ['Una de las superficies más antiguas y llenas de cráteres del Sistema Solar.',
         'One of the oldest and most heavily cratered surfaces in the Solar System.'], []),
    'Encélado': f(['Satélite de Saturno', 'Moon of Saturn'],
        ['Expulsa chorros de agua desde su polo sur, procedentes de un océano subterráneo.',
         'It sprays jets of water from its south pole, fed by an underground ocean.'], []),
    'Titán': f(['Satélite de Saturno', 'Moon of Saturn'],
        ['Tiene una atmósfera densa y anaranjada, y lagos de metano líquido. La sonda Huygens aterrizó en él en 2005.',
         'It has a thick orange atmosphere and lakes of liquid methane. The Huygens probe landed on it in 2005.'], []),
    'Tritón': f(['Satélite de Neptuno', 'Moon of Neptune'],
        ['Gira en sentido contrario a Neptuno, señal de que fue capturado. Tiene géiseres de nitrógeno.',
         'It orbits backwards relative to Neptune’s spin, a sign that it was captured. It has nitrogen geysers.'], []),
    'Caronte': f(['Satélite de Plutón', 'Moon of Pluto'],
        ['Es tan grande respecto a Plutón que ambos giran alrededor de un punto situado entre los dos.',
         'It is so large compared with Pluto that the two orbit a point in the space between them.'], [])
};
