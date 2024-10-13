import read_celestial_bodies from './readData.js'


var lista_de_asteroides = read_celestial_bodies('asteroids2_ordenado.json', 3); //  introducir el número de cometas
var lista_de_xyz_asteroides = [];
for (var i = 0; i < lista_de_asteroides.length; i++) {
    lista_de_xyz_asteroides[i] = lista_de_asteroides[i].xyz_orbita_plano_ecliptica(34); //  introducir el tiempo
}
var lista_de_cometas = readData_1.read_celestial_bodies('comets2_ordenado.json', 3); //  introducir el número de cometas
var lista_de_xyz_cometas = [];
for (var i = 0; i < lista_de_cometas.length; i++) {
    lista_de_xyz_cometas[i] = lista_de_cometas[i].xyz_orbita_plano_ecliptica(34); //  introducir el tiempo
}
