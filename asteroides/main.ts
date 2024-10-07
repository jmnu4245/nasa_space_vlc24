import { CelestialBody } from './CelestialBody';
import {read_celestial_bodies} from './readData';



const lista_de_asteroides:CelestialBody[]= read_celestial_bodies('asteroids2_ordenado.json',3) ;  //  introducir el número de cometas

const lista_de_xyz_asteroides: [number, number, number][] = [];

for (let i = 0; i < lista_de_asteroides.length; i++) {
    lista_de_xyz_asteroides[i] = lista_de_asteroides[i].xyz_orbita_plano_ecliptica(34);  //  introducir el tiempo
  }



const lista_de_cometas:CelestialBody[]= read_celestial_bodies('comets2_ordenado.json',3) ;  //  introducir el número de cometas

const lista_de_xyz_cometas: [number, number, number][] = [];

for (let i = 0; i < lista_de_cometas.length; i++) {
    lista_de_xyz_cometas[i] = lista_de_cometas[i].xyz_orbita_plano_ecliptica(34);  //  introducir el tiempo
  }

  console.log(lista_de_xyz_cometas);
  console.log(lista_de_xyz_asteroides);




