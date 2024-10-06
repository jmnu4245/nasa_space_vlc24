//main2.ts

import { CelestialBody } from './CelestialBody';
import {read_celestial_bodies} from './readData';


const lista_de_cometas:CelestialBody[]= read_celestial_bodies('comets2_ordenado.json',3) ;
//console.log(lista_de_CelestialBodies);

const lista_de_xyz_cometas: [number, number, number][] = [];

for (let i = 0; i < lista_de_cometas.length; i++) {
    //console.log(lista_de_cometas[i]);
    lista_de_xyz_cometas[i] = lista_de_cometas[i].xyz_orbita_plano_ecliptica(34);
  }

  console.log(lista_de_xyz_cometas);