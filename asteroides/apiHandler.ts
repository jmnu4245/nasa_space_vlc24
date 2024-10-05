import * as fs from 'fs';

export async function fetchData(url: string, params: Record<string, string>): Promise<{ [key: string]: number }> {
    const elementos: { [key: string]: number } = {};

    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${url}?${queryString}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        console.log(data['orbit']['elements']);
        console.log(data['vi_data']['mass']);

        for (const elemento of data.orbit.elements) {
            const titulo: string = elemento.title;
            const valor: string = elemento.value;
            try {
                elementos[titulo] = parseFloat(valor);
            } catch (error) {
                console.error(`Error parsing value for ${titulo}:`, error);
            }
        }
        return elementos;

    } catch (error) {
        console.error("Error fetching data:", error);
        return {};
    }
}

function obtenerPrimerosAsteroides(n: number) {
    // Leer el archivo JSON
    const data = fs.readFileSync('asteroides_ordenado.json', 'utf8');
    const asteroides = JSON.parse(data);
    // Extraer los primeros n spkid
    const spkids = asteroides.slice(0, n).map((asteroide: { spkid: number }) => asteroide.spkid);

    return spkids;
}

function obtenerPrimerosCometas(n: number) {
    // Leer el archivo JSON
    const data = fs.readFileSync('cometas_ordenado.json', 'utf8');
    const cometas = JSON.parse(data);
    // Extraer los primeros n spkid
    const spkids = cometas.slice(0, n).map((cometa: { spkid: number }) => cometa.spkid);

    return spkids;
}

function obtenerNombresAsteroides(n: number) {
    // Leer el archivo JSON
    const data = fs.readFileSync('asteroides_ordenado.json', 'utf8');
    const asteroides = JSON.parse(data);
    // Extraer los primeros n nombres
    const nombres = asteroides.slice(0, n).map((asteroide: { name: string }) => asteroide.name);

    return nombres;
}

function obtenerNombresCometas(n: number) {
    // Leer el archivo JSON
    const data = fs.readFileSync('cometas_ordenado.json', 'utf8');
    const cometas = JSON.parse(data);
    // Extraer los primeros n nombres
    const nombres = cometas.slice(0, n).map((cometa: { name: string }) => cometa.name);

    return nombres;
}

export default { fetchData, obtenerPrimerosAsteroides, obtenerPrimerosCometas, obtenerNombresAsteroides, obtenerNombresCometas };