// Efemérides precisas para la Tierra y la Luna (Jean Meeus, "Astronomical Algorithms", caps. 12 y 47)
import { J2000 } from './datos.js';

const RAD = Math.PI / 180;
const norm = g => ((g % 360) + 360) % 360;

// Tiempo sidéreo medio de Greenwich (grados): ángulo entre el equinoccio y el meridiano de Greenwich
export function gmst(jd) {
    const T = (jd - J2000) / 36525;
    return norm(280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * T * T - T * T * T / 38710000);
}

// Términos periódicos de la longitud (Σl, 1e-6 °) y la distancia (Σr, 1e-3 km): [D, M, M', F, Σl, Σr]
const TERMINOS_LR = [
    [0, 0, 1, 0, 6288774, -20905355], [2, 0, -1, 0, 1274027, -3699111], [2, 0, 0, 0, 658314, -2955968],
    [0, 0, 2, 0, 213618, -569925], [0, 1, 0, 0, -185116, 48888], [0, 0, 0, 2, -114332, -3149],
    [2, 0, -2, 0, 58793, 246158], [2, -1, -1, 0, 57066, -152138], [2, 0, 1, 0, 53322, -170733],
    [2, -1, 0, 0, 45758, -204586], [0, 1, -1, 0, -40923, -129620], [1, 0, 0, 0, -34720, 108743],
    [0, 1, 1, 0, -30383, 104755], [2, 0, 0, -2, 15327, 10321], [0, 0, 1, 2, -12528, 0],
    [0, 0, 1, -2, 10980, 79661], [4, 0, -1, 0, 10675, -34782], [0, 0, 3, 0, 10034, -23210],
    [4, 0, -2, 0, 8548, -21636], [2, 1, -1, 0, -7888, 24208], [2, 1, 0, 0, -6766, 30824],
    [1, 0, -1, 0, -5163, -8379], [1, 1, 0, 0, 4987, -16675], [2, -1, 1, 0, 4036, -12831],
    [2, 0, 2, 0, 3994, -10445], [4, 0, 0, 0, 3861, -11650], [2, 0, -3, 0, 3665, 14403],
    [0, 1, -2, 0, -2689, -7003], [2, 0, -1, 2, -2602, 0], [2, -1, -2, 0, 2390, 10056]
];
// Términos de la latitud (Σb, 1e-6 °): [D, M, M', F, Σb]
const TERMINOS_B = [
    [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693], [2, 0, 0, -1, 173237],
    [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271], [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198],
    [2, 0, 1, -1, 9266], [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
    [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463]
];

/**
 * Posición geocéntrica de la Luna referida a la eclíptica J2000.
 * @returns {{lon: number, lat: number, dist: number}} longitud y latitud en grados, distancia en km
 */
export function lunaGeocentrica(jd) {
    const T = (jd - J2000) / 36525;
    const Lp = 218.3164477 + 481267.88123421 * T;
    const D = 297.8501921 + 445267.1114034 * T;
    const M = 357.5291092 + 35999.0502909 * T;
    const Mp = 134.9633964 + 477198.8675055 * T;
    const F = 93.2720950 + 483202.0175233 * T;
    const E = 1 - 0.002516 * T; // excentricidad de la órbita terrestre (afecta a los términos con M)
    const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.290 * T, A3 = 313.45 + 481266.484 * T;

    let sl = 0, sr = 0, sb = 0;
    for (const [d, m, mp, f, l, r] of TERMINOS_LR) {
        const arg = (d * D + m * M + mp * Mp + f * F) * RAD;
        const e = E ** Math.abs(m);
        sl += l * e * Math.sin(arg);
        sr += r * e * Math.cos(arg);
    }
    for (const [d, m, mp, f, b] of TERMINOS_B) {
        sb += b * E ** Math.abs(m) * Math.sin((d * D + m * M + mp * Mp + f * F) * RAD);
    }
    sl += 3958 * Math.sin(A1 * RAD) + 1962 * Math.sin((Lp - F) * RAD) + 318 * Math.sin(A2 * RAD);
    sb += -2235 * Math.sin(Lp * RAD) + 382 * Math.sin(A3 * RAD) + 175 * Math.sin((A1 - F) * RAD) +
          175 * Math.sin((A1 + F) * RAD) + 127 * Math.sin((Lp - Mp) * RAD) - 115 * Math.sin((Lp + Mp) * RAD);

    // Meeus da la longitud referida al equinoccio de la fecha: se pasa a J2000 restando la precesión
    const lon = norm(Lp + sl / 1e6 - 1.3969713 * T);
    return { lon, lat: sb / 1e6, dist: 385000.56 + sr / 1000 };
}
