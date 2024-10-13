import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
export function calcularDiaJulianoActual() {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // Los meses comienzan en 0
    const dia = fechaActual.getDate();
  
    // Algoritmo para calcular el día juliano
    const A = Math.floor((14 - mes) / 12);
    const Y = anio + 4800 - A;
    const M = mes + 12 * A - 3;
  
    const diaJuliano = dia + Math.floor((153 * M + 2) / 5) + (365 * Y) + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
    return diaJuliano;
  }
  export function julianToDate(diaJuliano) {
    // Constantes del calendario juliano
    let j = diaJuliano + 0.5;
    let z = Math.floor(j);
    let f = j - z;
  
    let A;
    if (z < 2299161) {
        A = z;
    } else {
        let alpha = Math.floor((z - 1867216.25) / 36524.25);
        A = z + 1 + alpha - Math.floor(alpha / 4);
    }
  
    let B = A + 1524;
    let C = Math.floor((B - 122.1) / 365.25);
    let D = Math.floor(365.25 * C);
    let E = Math.floor((B - D) / 30.6001);
  
    // Cálculo del día, mes y año
    let dia = B - D - Math.floor(30.6001 * E) + f;
    let mes = (E < 14) ? E - 1 : E - 13;
    let año = (mes > 2) ? C - 4716 : C - 4715;
  
    // Nombres abreviados de los meses
    const mesesAbreviados = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    
    // Formatear el resultado en "Día Mes (abreviado) Año"
    return `${Math.floor(dia)} ${mesesAbreviados[mes - 1]} ${año}`;
  }