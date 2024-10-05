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


