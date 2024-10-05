import * as fs from 'fs';
import apiHandler from './apiHandler';

import { fetchData } from './apiHandler';
import { CelestialBody} from './operations';

const apiUrl = "https://ssd-api.jpl.nasa.gov/sbdb.api";
const numero_asteroides = 10;
const numero_cometas = 10;
const spkids_asteroides = apiHandler.obtenerPrimerosAsteroides(numero_asteroides)
const spkids_cometas = apiHandler.obtenerPrimerosCometas(numero_cometas)
const nombres_asteroides = apiHandler.obtenerNombresAsteroides(numero_asteroides)
const nombres_cometas = apiHandler.obtenerNombresCometas(numero_cometas)


let celestialBodyAsteroidPairs: [CelestialBody, [number, number, number]][] = [];
for (let i = 0; i < numero_asteroides; i++) {
    fetchData(apiUrl, { "sstr": spkids_asteroides[i].toString() }).then((elementos) => {
        const e: number = elementos['eccentricity'];
        const a: number = elementos['semi-major axis'];
        const p: number = elementos['perihelion distance'];
        const I: number = elementos['inclination; angle with respect to x-y ecliptic plane'];
        const W: number = elementos['longitude of the ascending node'];
        const w: number = elementos['argument of perihelion'];
        const M: number = elementos['mean anomaly'];
        const t0: number = elementos['time of perihelion passage'];
        const n: number = elementos['mean motion'];

        let asteroid = new CelestialBody(spkids_asteroides[i],nombres_asteroides[i],e, a, p, I, W, w, M, t0, n);
        celestialBodyAsteroidPairs.push([asteroid, asteroid.xyz_orbita_plano_ecliptica(40000)]);
    });

    let celestialBodyCometPairs: [CelestialBody, [number, number, number]][] = [];
    for (let i = 0; i < numero_cometas; i++) {
        fetchData(apiUrl, { "sstr": spkids_cometas[i].toString() }).then((elementos) => {
            const e: number = elementos['eccentricity'];
            const a: number = elementos['semi-major axis'];
            const p: number = elementos['perihelion distance'];
            const I: number = elementos['inclination; angle with respect to x-y ecliptic plane'];
            const W: number = elementos['longitude of the ascending node'];
            const w: number = elementos['argument of perihelion'];
            const M: number = elementos['mean anomaly'];
            const t0: number = elementos['time of perihelion passage'];
            const n: number = elementos['mean motion'];

            let comet = new CelestialBody(spkids_cometas[i], nombres_cometas[i], e, a, p, I, W, w, M, t0, n);
            celestialBodyCometPairs.push([comet, comet.xyz_orbita_plano_ecliptica(40000)]);
        });
    }
    console.log(celestialBodyAsteroidPairs);
    console.log(celestialBodyCometPairs);
}





