import { CelestialBody } from './operations';
const fs = require('fs');

function read_celestial_bodies(url:string , n:number){
    let celestialBodies: CelestialBody[] = [];
    // Leer el archivo JSON
    const data = fs.readFileSync(url, 'utf8');
    // Parsear el contenido del archivo
    const bodies = JSON.parse(data);

    // Recorrer cada objeto del array
    bodies.slice(0,n).forEach((body: { spkid:string; full_name:string; e:number; a:number; q:number; i:number; om:number; w:number; ma:number; tp:number; n:number}) => {
        const astro:CelestialBody = new CelestialBody (body.spkid, body.full_name, body.e, body.a, body.q, body.i, body.om, body.w, body.ma, body.tp, body.n);
        //console.log (astro);
        celestialBodies.push(astro);
        console.log(celestialBodies)
        return celestialBodies;
    });  
}

const datos:CelestialBody[]|void = read_celestial_bodies('comets2_ordenado.json',2) ;
console.log(datos);
