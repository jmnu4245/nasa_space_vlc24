const MS_POR_DIA = 86400000;
const JD_UNIX = 2440587.5; // día juliano de 1970-01-01 00:00 UTC

// Día juliano (con fracción) de un objeto Date
export function dateToJulian(fecha) {
    return fecha.getTime() / MS_POR_DIA + JD_UNIX;
}

export function calcularDiaJulianoActual() {
    return dateToJulian(new Date());
}

// Día juliano de una fecha "YYYY-MM-DD" (a las 00:00 UTC)
export function inputToJulian(valor) {
    return dateToJulian(new Date(`${valor}T00:00:00Z`));
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