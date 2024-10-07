"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.read_celestial_bodies = read_celestial_bodies;
var CelestialBody_1 = require("./CelestialBody");
var fs = require('fs');
function read_celestial_bodies(url, n) {
    var celestialBodies = [];
    // Leer el archivo JSON
    var data = fs.readFileSync(url, 'utf8');
    // Parsear el contenido del archivo
    var bodies = JSON.parse(data);
    // Recorrer cada objeto del array
    bodies.slice(0, n).forEach(function (body) {
        var astro = new CelestialBody_1.CelestialBody(body.spkid, body.full_name, body.e, body.a, body.q, body.i, body.om, body.w, body.ma, body.tp, body.n);
        celestialBodies.push(astro);
    });
    return celestialBodies;
}
