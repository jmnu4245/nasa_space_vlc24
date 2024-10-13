"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var apiHandler_1 = require("./apiHandler");
var apiHandler_2 = require("./apiHandler");
var operations_1 = require("./operations");
var apiUrl = "https://ssd-api.jpl.nasa.gov/sbdb.api";
var numero_asteroides = 4;
var numero_cometas = 0;
var spkids_asteroides = apiHandler_1.default.obtenerPrimerosAsteroides(numero_asteroides);
var spkids_cometas = apiHandler_1.default.obtenerPrimerosCometas(numero_cometas);
var nombres_asteroides = apiHandler_1.default.obtenerNombresAsteroides(numero_asteroides);
var nombres_cometas = apiHandler_1.default.obtenerNombresCometas(numero_cometas);
var celestialBodyAsteroidPairs = [];
var _loop_1 = function (i) {
    (0, apiHandler_2.fetchData)(apiUrl, { "sstr": spkids_asteroides[i].toString() }).then(function (elementos) {
        var e = elementos['eccentricity'];
        var a = elementos['semi-major axis'];
        var p = elementos['perihelion distance'];
        var I = elementos['inclination; angle with respect to x-y ecliptic plane'];
        var W = elementos['longitude of the ascending node'];
        var w = elementos['argument of perihelion'];
        var M = elementos['mean anomaly'];
        var t0 = elementos['time of perihelion passage'];
        var n = elementos['mean motion'];
        var asteroid = new operations_1.CelestialBody(spkids_asteroides[i], nombres_asteroides[i], e, a, p, I, W, w, M, t0, n);
        celestialBodyAsteroidPairs.push([asteroid, asteroid.xyz_orbita_plano_ecliptica(40000)]);
    });
    var celestialBodyCometPairs = [];
    var _loop_2 = function (i_1) {
        (0, apiHandler_2.fetchData)(apiUrl, { "sstr": spkids_cometas[i_1].toString() }).then(function (elementos) {
            var e = elementos['eccentricity'];
            var a = elementos['semi-major axis'];
            var p = elementos['perihelion distance'];
            var I = elementos['inclination; angle with respect to x-y ecliptic plane'];
            var W = elementos['longitude of the ascending node'];
            var w = elementos['argument of perihelion'];
            var M = elementos['mean anomaly'];
            var t0 = elementos['time of perihelion passage'];
            var n = elementos['mean motion'];
            var comet = new operations_1.CelestialBody(spkids_cometas[i_1], nombres_cometas[i_1], e, a, p, I, W, w, M, t0, n);
            celestialBodyCometPairs.push([comet, comet.xyz_orbita_plano_ecliptica(40000)]);
        });
    };
    for (var i_1 = 0; i_1 < numero_cometas; i_1++) {
        _loop_2(i_1);
    }
    console.log(celestialBodyAsteroidPairs);
};
for (var i = 0; i < numero_asteroides; i++) {
    _loop_1(i);
}
