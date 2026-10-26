import * as THREE from 'three';

// Etiquetas HTML con el nombre de cada objeto, proyectadas sobre la pantalla
export default class Etiquetas {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.items = [];
        this.visibles = true;
        this.filtro = null; // filtro global opcional: filtro(objeto3d) → visible
        this.v = new THREE.Vector3();
    }

    /**
     * @param {string|Function} nombre - texto o función que lo devuelve (para cambiar de idioma)
     * @param {{position: THREE.Vector3}} objeto3d - objeto cuya posición sigue la etiqueta
     * @param {Function} [alClick] - acción al pulsar la etiqueta
     * @param {Function} [visibleSi] - visibleSi(camera) permite ocultarla según la cámara
     * @param {boolean} [secundaria] - estilo más discreto (lunas, asteroides)
     */
    añadir(nombre, objeto3d, alClick = null, visibleSi = null, secundaria = false) {
        const el = document.createElement('div');
        el.className = 'etiqueta';
        if (secundaria) el.classList.add('secundaria');
        if (alClick) {
            el.classList.add('clicable');
            el.addEventListener('click', alClick);
        }
        const item = { el, objeto3d, visibleSi, nombre };
        el.textContent = typeof nombre === 'function' ? nombre() : nombre;
        this.contenedor.appendChild(el);
        this.items.push(item);
    }

    actualizarTextos() {
        for (const { el, nombre } of this.items) {
            if (typeof nombre === 'function') el.textContent = nombre();
        }
    }

    // Resalta la etiqueta del objeto al que se acerca el cursor
    marcarCerca(objeto3d) {
        if (objeto3d === this.cerca) return;
        this.cerca = objeto3d;
        for (const { el, objeto3d: o } of this.items) el.classList.toggle('cerca', o === objeto3d);
    }

    marcarSeleccionado(objeto3d) {
        for (const { el, objeto3d: o } of this.items) el.classList.toggle('seleccionada', o === objeto3d);
    }

    setVisibles(visibles) {
        this.visibles = visibles;
        this.contenedor.style.display = visibles ? '' : 'none';
    }

    actualizar(camera) {
        if (!this.visibles) return;
        const ancho = window.innerWidth, alto = window.innerHeight;
        for (const { el, objeto3d, visibleSi } of this.items) {
            this.v.copy(objeto3d.position).project(camera);
            const visible = this.v.z < 1 && Math.abs(this.v.x) < 1.1 && Math.abs(this.v.y) < 1.1 && (!visibleSi || visibleSi(camera)) &&
                (!this.filtro || this.filtro(objeto3d));
            if (el.hidden === visible) el.hidden = !visible;
            if (visible) el.style.transform = `translate(${(this.v.x * 0.5 + 0.5) * ancho}px, ${(-this.v.y * 0.5 + 0.5) * alto}px) translate(-50%, calc(-100% - 8px))`;
        }
    }
}
