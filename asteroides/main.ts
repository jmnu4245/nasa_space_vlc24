import * as fs from 'fs';

import { fetchData } from './apiHandler';
import { CelestialBody} from './operations';

const apiUrl = "https://ssd-api.jpl.nasa.gov/sbdb.api";
const params = {
    "sstr": "2015 AB",
    "no-orbit": "0",
    "discovery": "false",
    "ca-data": "0",
    "phys-par": "1", 
    'vi-data': '1'
};
 
// Llamar a la función y manejar el resultado
fetchData(apiUrl, params).then((elementos) => {
    const e: number = elementos['eccentricity'];
    const a: number = elementos['semi-major axis'];
    const p: number = elementos['perihelion distance'];
    const I: number = elementos['inclination; angle with respect to x-y ecliptic plane'];
    const W: number = elementos['longitude of the ascending node'];
    const w: number = elementos['argument of perihelion'];
    const M: number = elementos['mean anomaly'];
    const t0: number = elementos['time of perihelion passage'];
    const n: number = elementos['mean motion'];
    const n_degPerDay: number = n / 365.6;
    const e_deg: number = e * 180 / Math.PI;


    const cordenadas_orbita_R3 = asteroid.xyz_orbita_plano_ecliptica(345);
    console.log('Cordenadas 3D: ' + cordenadas_orbita_R3 + ' UA');
});



const asteroid = new CelestialBody(
    '1',
    'Asteroide 2023',
    0.1,
    2.5,
    1.2,
    10,
    30,
    20,
    0,
    2459125.5,
    0.1,
    0.5,
    5,
    false
);


