import { t, tr, idioma, setIdioma, aplicarTraducciones } from './i18n.js';
import PanelCalculos from './panelCalculos.js';
import { decodificar } from './hud.js';
import { julianToDate, dateToJulian } from './julianthings.js';

const $ = id => document.getElementById(id);
const guardar = (clave, valor) => { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } };
const leer = clave => { try { return localStorage.getItem(clave); } catch (e) { return null; } };

// Velocidades disponibles, en días simulados por segundo real
export const VELOCIDADES = [1 / 86400, 60 / 86400, 1 / 24, 0.25, 1, 7, 30.44, 91.31, 365.25, 3652.5];
const VELOCIDAD_INICIAL = 4; // 1 día/s

const escribiendo = e => e.target.closest('input, textarea, select') && e.target.type !== 'range' && e.target.type !== 'checkbox';

/**
 * Interfaz de usuario: buscador, ficha, capas, navegación rápida, control del tiempo, ayuda y atajos.
 * `app` expone las acciones de la simulación (ver main.js).
 */
export function crearUI(app) {
    const panel = new PanelCalculos($('resultados'));
    let generarFicha = null; // función que devuelve el contenido de la ficha en el idioma actual
    let cuerpoFicha = null;  // cuerpo con órbita para la pestaña Física (o null)
    let indiceVelocidad = Number(leer('velocidad') ?? VELOCIDAD_INICIAL);
    if (!(indiceVelocidad >= 0 && indiceVelocidad < VELOCIDADES.length)) indiceVelocidad = VELOCIDAD_INICIAL;
    let sentido = 1;
    let pausado = false;
    let ultimoTick = 0;

    // ---------- Aviso flotante ----------
    let temporizadorAviso = null;
    function avisar(mensaje, duracion = 2500) {
        const aviso = $('aviso');
        aviso.textContent = mensaje;
        aviso.classList.add('visible');
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(() => aviso.classList.remove('visible'), duracion);
    }

    // ---------- Buscador con sugerencias ----------
    const buscador = $('buscador');
    const sugerencias = $('sugerencias');
    let resultados = [];
    let resaltado = 0;

    function pintarSugerencias() {
        const texto = buscador.value.trim();
        if (!texto) {
            sugerencias.hidden = true;
            return;
        }
        resultados = app.buscar(texto).slice(0, 8);
        resaltado = Math.min(resaltado, Math.max(0, resultados.length - 1));
        sugerencias.innerHTML = resultados.length
            ? resultados.map((r, i) => `<li role="option" data-i="${i}" aria-selected="${i === resaltado}"><span>${r.nombre}</span><small>${t(`tipo_${r.tipo}`)}</small></li>`).join('')
            : `<li class="vacio">${t('sinResultados')}</li>`;
        sugerencias.hidden = false;
    }

    function elegirResultado(i) {
        const r = resultados[i];
        if (!r) return;
        app.seleccionar(r.id);
        buscador.value = '';
        sugerencias.hidden = true;
        buscador.blur();
    }

    buscador.addEventListener('input', () => { resaltado = 0; pintarSugerencias(); });
    buscador.addEventListener('focus', pintarSugerencias);
    buscador.addEventListener('blur', () => setTimeout(() => { sugerencias.hidden = true; }, 150));
    buscador.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const n = resultados.length;
            if (n) resaltado = (resaltado + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
            pintarSugerencias();
        } else if (e.key === 'Enter') {
            elegirResultado(resaltado);
        } else if (e.key === 'Escape') {
            buscador.value = '';
            buscador.blur();
        }
    });
    sugerencias.addEventListener('mousedown', e => {
        const li = e.target.closest('li[data-i]');
        if (li) elegirResultado(Number(li.dataset.i));
    });

    // ---------- Ficha ----------
    const ficha = $('ficha');
    let pestaña = 'info';

    function cambiarPestaña(nueva) {
        pestaña = nueva;
        document.querySelectorAll('.pestaña').forEach(b => b.classList.toggle('activa', b.dataset.pestaña === nueva));
        $('ficha-info').hidden = nueva !== 'info';
        $('ficha-fisica').hidden = nueva !== 'fisica';
        if (nueva === 'fisica') panel.actualizar(app.getTiempo());
    }
    document.querySelectorAll('.pestaña').forEach(b => b.addEventListener('click', () => cambiarPestaña(b.dataset.pestaña)));

    function pintarFicha() {
        if (!generarFicha) return;
        const f = generarFicha();
        $('ficha-tipo').textContent = f.tipo;
        // El nombre se "decodifica" al cambiar de objeto; en los repintados periódicos se deja quieto
        if ($('ficha-nombre').dataset.nombre !== f.nombre) {
            $('ficha-nombre').dataset.nombre = f.nombre;
            decodificar($('ficha-nombre'), f.nombre);
        }
        $('ficha-info').innerHTML = (f.texto ? `<p>${f.texto}</p>` : '') +
            f.filas.map(([k, v]) => `<div class="fila"><span>${k}</span><b>${v}</b></div>`).join('') +
            (f.nota ? `<p class="nota">${f.nota}</p>` : '');
        const conFisica = Boolean(cuerpoFicha);
        const botonFisica = document.querySelector('.pestaña[data-pestaña="fisica"]');
        botonFisica.disabled = !conFisica;
        if (!conFisica && pestaña === 'fisica') cambiarPestaña('info');
    }

    let fichaViva = false;   // la ficha se repinta periódicamente (datos que cambian: naves)
    function mostrarFicha(generador, cuerpo, { vivo = false, cielo = false } = {}) {
        generarFicha = generador;
        cuerpoFicha = cuerpo;
        fichaViva = vivo;
        $('ficha-cielo').hidden = !cielo;
        panel.reiniciar(cuerpo, app.getTiempo());
        pintarFicha();
        ficha.hidden = false;
        $('panel-capas').hidden = true;
        $('btn-capas').classList.remove('activo');
        if (pestaña === 'fisica') panel.actualizar(app.getTiempo());
    }

    function ocultarFicha() {
        generarFicha = null;
        ficha.hidden = true;
    }
    $('ficha-cerrar').addEventListener('click', () => app.vistaGeneral());
    $('ficha-cielo').addEventListener('click', () => app.verCielo());

    // ---------- Foto, sonido y vista desde la superficie ----------
    $('btn-foto').addEventListener('click', () => app.hacerFoto());
    $('btn-sonido').addEventListener('click', () => app.alternarSonido());
    $('hud-salir').addEventListener('click', () => app.salirSuperficie());
    function setSonido(activo) {
        $('btn-sonido').innerHTML = `<svg><use href="#${activo ? 'i-sonido' : 'i-silencio'}"/></svg>`;
        $('btn-sonido').classList.toggle('apagado', !activo);
    }
    // Un clic suave en cualquier botón de la interfaz
    document.addEventListener('click', e => { if (e.target.closest('button, .etiqueta, .evento')) app.sonidoClic(); }, true);

    // Brújula: marcas cada 5° y puntos cardinales cada 45°, repetidas para poder girar sin cortes
    const PX_POR_GRADO = 4;
    function pintarBrujula() {
        let html = '';
        for (let g = -360; g <= 720; g += 5) {
            const x = g * PX_POR_GRADO;
            const normal = ((g % 360) + 360) % 360;
            html += `<span class="${normal % 45 === 0 ? 'mayor' : ''}" style="left:${x}px"></span>`;
            if (normal % 45 === 0) html += `<b style="left:${x}px">${t('puntosCardinales')[normal / 45]}</b>`;
            else if (normal % 15 === 0) html += `<b style="left:${x}px;opacity:.45;font-weight:500">${normal}</b>`;
        }
        $('hud-escala').innerHTML = html;
    }
    function setModoSuperficie(activo) {
        document.body.classList.toggle('modo-superficie', activo);
        $('hud-superficie').hidden = !activo;
        if (activo) {
            pintarBrujula();
            abrirPanel(null);
        }
    }
    function actualizarHUD({ mundo, lugar, lat, lon, altSol, rumbo, horaSolar }) {
        const titulo = lugar ? `${lugar} · ${mundo}` : mundo;
        if ($('hud-mundo').dataset.titulo !== titulo) {
            $('hud-mundo').dataset.titulo = titulo;
            decodificar($('hud-mundo'), titulo, 900);
        }
        const fmtCoord = (v, pos, neg) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;
        $('hud-coordenadas').textContent = `${fmtCoord(lat, 'N', 'S')}   ${fmtCoord(lon, 'E', idioma === 'es' ? 'O' : 'W')}` +
            (horaSolar ? ` · ${t('horaSolar', horaSolar)}` : '');
        $('hud-sol').textContent = altSol >= 0 ? t('solSobre', Math.round(altSol)) : t('solBajo', Math.round(-altSol));
        $('hud-escala').style.transform = `translateX(${-rumbo * PX_POR_GRADO}px)`;
    }

    // Método de cálculo
    function explicarMetodo(metodo) {
        $('explicacion-metodo').textContent = t({ kepler: 'explicaKepler', clasica: 'explicaClasica', relatividad: 'explicaRelatividad' }[metodo]);
    }
    const integradoresMarcados = () => [...document.querySelectorAll('#integradores input:checked')].map(i => i.value);
    document.querySelectorAll('.segmentado button').forEach(b => b.addEventListener('click', () => {
        const botones = [...document.querySelectorAll('.segmentado button')];
        botones.forEach(x => x.classList.toggle('activo', x === b));
        document.querySelector('.segmentado').style.setProperty('--indice', botones.indexOf(b));
        $('integradores').hidden = b.dataset.metodo !== 'clasica';
        explicarMetodo(b.dataset.metodo);
        panel.setMetodo(b.dataset.metodo, integradoresMarcados());
        panel.actualizar(app.getTiempo());
    }));
    document.querySelectorAll('#integradores input').forEach(i => i.addEventListener('change', () => {
        if (!integradoresMarcados().length) i.checked = true; // siempre al menos un método
        panel.setMetodo('clasica', integradoresMarcados());
        panel.actualizar(app.getTiempo());
    }));
    explicarMetodo('kepler');

    // ---------- Paneles laterales (capas y eventos) ----------
    const PANELES = { capas: $('panel-capas'), eventos: $('panel-eventos') };
    function abrirPanel(nombre) {
        for (const [clave, panelLateral] of Object.entries(PANELES)) {
            const abrir = clave === nombre && panelLateral.hidden;
            panelLateral.hidden = !abrir;
            $(`btn-${clave}`).classList.toggle('activo', abrir);
            if (abrir && clave === 'eventos') pintarEventos();
        }
        // En el móvil la ficha y los paneles comparten el espacio inferior
        const algunoAbierto = Object.values(PANELES).some(p => !p.hidden);
        if (window.innerWidth <= 700) ficha.hidden = algunoAbierto || !generarFicha;
    }
    $('btn-capas').addEventListener('click', e => { e.stopPropagation(); abrirPanel('capas'); });
    $('btn-eventos').addEventListener('click', e => { e.stopPropagation(); abrirPanel('eventos'); });
    document.addEventListener('pointerdown', e => {
        if (e.target.closest('.panel-lateral, #btn-capas, #btn-eventos')) return;
        if (Object.values(PANELES).some(p => !p.hidden)) abrirPanel(null);
    });

    // ---------- Eventos astronómicos ----------
    function fechaCorta(jd) {
        const d = new Date((jd - 2440587.5) * 86400000);
        return `${d.getUTCDate()} ${t('meses')[d.getUTCMonth()]}<br>${d.getUTCFullYear()}`;
    }
    function pintarEventos() {
        const ahora = dateToJulian(new Date());
        const eventos = app.eventos();
        const fila = e => `<button class="evento" data-i="${eventos.indexOf(e)}"><time>${fechaCorta(e.jd)}</time>` +
            `<strong>${tr(e.titulo)}</strong><small>${t(`evento_${e.tipo}`)}</small></button>`;
        const proximos = eventos.filter(e => e.jd >= ahora);
        const pasados = eventos.filter(e => e.jd < ahora).reverse();
        $('lista-eventos').innerHTML =
            `<div class="rotulo eventos-seccion">${t('proximos')}</div>${proximos.map(fila).join('')}` +
            `<div class="rotulo eventos-seccion">${t('historia')}</div>${pasados.map(fila).join('')}`;
        $('lista-eventos').querySelectorAll('.evento').forEach(b => b.addEventListener('click', () => {
            app.irAEvento(eventos[Number(b.dataset.i)]);
            abrirPanel(null);
            if (!pausado) alternarPausa();
        }));
    }

    // ---------- Regla y recorrido ----------
    function setReglaActiva(activa) {
        $('btn-regla').classList.toggle('activo', activa);
        document.body.classList.toggle('midiendo', activa);
    }
    $('btn-regla').addEventListener('click', () => app.alternarRegla());
    $('btn-tour').addEventListener('click', () => app.iniciarTour());

    // ---------- Capas ----------
    function ponerCapa(input) {
        const clave = input.dataset.capa;
        const valor = input.type === 'checkbox' ? input.checked : Number(input.value);
        app.setCapa(clave, valor);
        const salida = $(`valor-${clave}`);
        if (salida) salida.textContent = valor;
    }
    document.querySelectorAll('[data-capa]').forEach(input => input.addEventListener('input', () => ponerCapa(input)));
    const brilloGuardado = leer('brilloFondo');
    if (brilloGuardado !== null) document.querySelector('[data-capa="fondo"]').value = brilloGuardado;
    ponerCapa(document.querySelector('[data-capa="fondo"]'));

    function configurarDeslizador(clave, maximo, valor) {
        const input = document.querySelector(`[data-capa="${clave}"]`);
        input.max = maximo;
        input.value = valor;
        $(`valor-${clave}`).textContent = valor;
        input.style.setProperty('--pct', `${(100 * valor) / (maximo || 1)}%`);
    }

    function alternarCapa(clave) {
        const input = document.querySelector(`[data-capa="${clave}"]`);
        input.checked = !input.checked;
        ponerCapa(input);
    }

    // ---------- Selector de astros en arco ----------
    // Planetas en el anillo interior y planetas enanos en el exterior, en un cuarto de círculo
    // alrededor de la esquina; el arco se despliega al acercar el cursor (o al tocar el centro).
    const arco = $('arco');
    let idActivo = null;
    let idBajoCursor = null;
    function pintarNavegacion() {
        arco.querySelectorAll('.arco-astro:not(#arco-centro)').forEach(b => b.remove());
        const anillos = [app.navegacion.filter(n => n.anillo === 1), app.navegacion.filter(n => n.anillo === 2)];
        anillos.forEach((items, k) => items.forEach((n, i) => {
            const b = document.createElement('button');
            b.className = `arco-astro anillo${k + 1}`;
            b.dataset.id = n.id;
            b.style.backgroundImage = `url('${n.textura}')`;
            // Ángulos de 180° (izquierda) a 270° (arriba), con un pequeño margen en los extremos
            const a = 184 + (82 * i) / Math.max(1, items.length - 1);
            b.style.setProperty('--a', `${a}deg`);
            b.style.setProperty('--retraso', `${(k * 0.04 + i * 0.018).toFixed(3)}s`);
            b.setAttribute('aria-label', n.nombre());
            b.addEventListener('click', () => app.seleccionar(n.id));
            b.addEventListener('pointerenter', () => { idBajoCursor = n.id; pintarNombreArco(); });
            b.addEventListener('pointerleave', () => { idBajoCursor = null; pintarNombreArco(); });
            arco.appendChild(b);
        }));
        marcarNavegacion(idActivo);
    }
    function pintarNombreArco() {
        const id = idBajoCursor ?? idActivo;
        const n = app.navegacion.find(x => x.id === id) ?? (id === 'vista-general' ? { nombre: () => t('vistaGeneral') } : null);
        $('arco-nombre').textContent = n ? n.nombre() : '';
    }
    function marcarNavegacion(id) {
        idActivo = id;
        arco.querySelectorAll('.arco-astro').forEach(b => b.classList.toggle('activo', b.dataset.id === id));
        pintarNombreArco();
    }
    $('arco-centro').addEventListener('click', e => {
        // En pantallas táctiles el primer toque despliega el arco
        if (!arco.classList.contains('abierto') && e.pointerType !== 'mouse') {
            arco.classList.add('abierto');
            return;
        }
        app.vistaGeneral();
    });
    $('arco-centro').addEventListener('pointerenter', () => { idBajoCursor = 'vista-general'; pintarNombreArco(); });
    $('arco-centro').addEventListener('pointerleave', () => { idBajoCursor = null; pintarNombreArco(); });
    document.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse' && !e.target.closest('#arco')) arco.classList.remove('abierto');
    });

    // ---------- Control del tiempo ----------
    function aplicarVelocidad() {
        guardar('velocidad', indiceVelocidad);
        app.setVelocidad(sentido * VELOCIDADES[indiceVelocidad]);
        app.setPausado(pausado);
        const etiqueta = $('velocidad');
        etiqueta.textContent = (sentido < 0 ? '−' : '') + t('velocidades')[indiceVelocidad];
        etiqueta.classList.toggle('atras', sentido < 0);
        $('btn-sentido').classList.toggle('atras', sentido < 0);
        $('btn-sentido').title = t(sentido < 0 ? 'haciaDelante' : 'haciaAtras');
        $('btn-play').innerHTML = `<svg><use href="#${pausado ? 'i-play' : 'i-pausa'}"/></svg>`;
        $('btn-play').title = t(pausado ? 'reanudar' : 'pausa');
        $('btn-lento').disabled = indiceVelocidad === 0;
        $('btn-rapido').disabled = indiceVelocidad === VELOCIDADES.length - 1;
    }
    const cambiarVelocidad = paso => {
        indiceVelocidad = Math.max(0, Math.min(VELOCIDADES.length - 1, indiceVelocidad + paso));
        aplicarVelocidad();
    };
    const alternarPausa = () => { pausado = !pausado; aplicarVelocidad(); };
    const invertir = () => { sentido = -sentido; aplicarVelocidad(); };
    $('btn-play').addEventListener('click', alternarPausa);
    $('btn-lento').addEventListener('click', () => cambiarVelocidad(-1));
    $('btn-rapido').addEventListener('click', () => cambiarVelocidad(1));
    $('btn-sentido').addEventListener('click', invertir);
    $('btn-hoy').addEventListener('click', () => {
        app.setTiempo(dateToJulian(new Date()));
        panel.reiniciar(panel.cuerpo, app.getTiempo());
    });
    $('btn-fecha').addEventListener('click', () => {
        const input = $('fecha-input');
        const d = new Date((app.getTiempo() - 2440587.5) * 86400000);
        if (!Number.isNaN(d.getTime())) input.value = d.toISOString().slice(0, 10);
        try { input.showPicker(); } catch (e) { input.focus(); input.click(); }
    });
    $('fecha-input').addEventListener('change', e => {
        if (!e.target.value) return;
        app.setTiempo(dateToJulian(new Date(`${e.target.value}T12:00:00Z`)));
        panel.reiniciar(panel.cuerpo, app.getTiempo());
    });

    function formatearFecha(jd) {
        const d = new Date((jd - 2440587.5) * 86400000);
        if (Number.isNaN(d.getTime())) return julianToDate(jd);
        const año = d.getUTCFullYear();
        const hora = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        return `${d.getUTCDate()} ${t('meses')[d.getUTCMonth()]} ${año < 0 ? `${-año + 1} a. C.` : año} · ${hora}`;
    }

    // ---------- Ayuda ----------
    function pintarAyuda() {
        $('ayuda-lista').innerHTML = t('ayudaTexto').map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    }
    const abrirAyuda = () => { pintarAyuda(); $('ayuda').hidden = false; $('ayuda-cerrar').focus(); };
    const cerrarAyuda = () => { $('ayuda').hidden = true; guardar('ayudaVista', '1'); };
    $('btn-ayuda').addEventListener('click', abrirAyuda);
    $('ayuda-cerrar').addEventListener('click', cerrarAyuda);
    $('ayuda').addEventListener('click', e => { if (e.target.id === 'ayuda') cerrarAyuda(); });

    // ---------- Compartir ----------
    $('btn-compartir').addEventListener('click', async () => {
        const url = app.urlActual();
        try {
            await navigator.clipboard.writeText(url);
            avisar(t('enlaceCopiado'));
        } catch (e) {
            avisar(`${t('enlaceListo')} ${url}`, 8000);
        }
    });

    // ---------- Idioma ----------
    function pintarIdioma() {
        $('btn-idioma').textContent = idioma === 'es' ? 'EN' : 'ES';
        aplicarTraducciones();
        pintarFicha();
        pintarNavegacion();
        pintarAyuda();
        if (!PANELES.eventos.hidden) pintarEventos();
        if (document.body.classList.contains('modo-superficie')) pintarBrujula();
        explicarMetodo(document.querySelector('.segmentado button.activo').dataset.metodo);
        aplicarVelocidad();
        if (pestaña === 'fisica') panel.actualizar(app.getTiempo());
    }
    $('btn-idioma').addEventListener('click', () => {
        setIdioma(idioma === 'es' ? 'en' : 'es');
        pintarIdioma();
        app.alCambiarIdioma();
    });

    // ---------- Atajos de teclado ----------
    window.addEventListener('keydown', e => {
        if (escribiendo(e) || e.ctrlKey || e.metaKey || e.altKey) return;
        if (!$('ayuda').hidden) {
            if (e.key === 'Escape' || e.key === 'Enter') cerrarAyuda();
            return;
        }
        switch (e.key) {
            case ' ': e.preventDefault(); alternarPausa(); break;
            case 'ArrowRight': cambiarVelocidad(1); break;
            case 'ArrowLeft': cambiarVelocidad(-1); break;
            case 'r': case 'R': invertir(); break;
            case '/': e.preventDefault(); buscador.focus(); break;
            case 'Escape': if (!app.salirSuperficie() && !app.cancelarRegla()) app.vistaGeneral(); break;
            case 'v': case 'V': app.verCielo(); break;
            case 'f': case 'F': app.hacerFoto(); break;
            case 's': case 'S': app.alternarSonido(); break;
            case 't': case 'T': app.iniciarTour(); break;
            case 'm': case 'M': app.alternarRegla(); break;
            case 'e': case 'E': alternarCapa('escalaReal'); break;
            case 'l': case 'L': alternarCapa('etiquetas'); break;
            case 'o': case 'O': alternarCapa('orbitas'); break;
            case '?': case 'h': case 'H': abrirAyuda(); break;
            default: return;
        }
    });

    // ---------- Luz que sigue al cursor ----------
    // Paneles y botones se iluminan suavemente donde está el puntero, con más intensidad cuanto más cerca,
    // y las miniaturas del dock se amplían al acercarse (como el Dock de macOS).
    const SELECTOR_REFLEJO = '.panel, .acciones, .buscador, .boton-icono:not(.principal), .fecha, .boton-texto-plano';
    const ALCANCE = 140;   // px a los que empieza a notarse la luz
    const ALCANCE_DOCK = 70;
    let cursor = null;
    let pendiente = false;

    function iluminar() {
        pendiente = false;
        if (!cursor) return;
        for (const el of document.querySelectorAll(SELECTOR_REFLEJO)) {
            el.classList.add('reflejo');
            const r = el.getBoundingClientRect();
            if (!r.width) continue;
            const dx = Math.max(r.left - cursor.x, 0, cursor.x - r.right);
            const dy = Math.max(r.top - cursor.y, 0, cursor.y - r.bottom);
            const luz = Math.max(0, 1 - Math.hypot(dx, dy) / ALCANCE);
            el.style.setProperty('--luz', luz.toFixed(3));
            if (luz > 0) {
                el.style.setProperty('--mx', `${cursor.x - r.left}px`);
                el.style.setProperty('--my', `${cursor.y - r.top}px`);
            }
        }
        const centro = $('arco-centro').getBoundingClientRect();
        const dCentro = Math.hypot(cursor.x - (centro.left + centro.width / 2), cursor.y - (centro.top + centro.height / 2));
        arco.classList.toggle('abierto', dCentro < (arco.classList.contains('abierto') ? 330 : 170));
        for (const el of arco.querySelectorAll('.arco-astro')) {
            const r = el.getBoundingClientRect();
            const d = Math.hypot(cursor.x - (r.left + r.width / 2), cursor.y - (r.top + r.height / 2));
            el.style.setProperty('--escala', (1 + 0.55 * Math.max(0, 1 - d / ALCANCE_DOCK) ** 2).toFixed(3));
        }
    }
    document.addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return; // en pantallas táctiles no hay cursor que siga
        cursor = { x: e.clientX, y: e.clientY };
        if (!pendiente) { pendiente = true; requestAnimationFrame(iluminar); }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
        cursor = { x: -9999, y: -9999 };
        requestAnimationFrame(iluminar);
    });

    // Deslizadores: la pista se rellena con un degradado hasta el valor
    const pintarPista = input => {
        const pct = ((input.value - input.min) / ((input.max - input.min) || 1)) * 100;
        input.style.setProperty('--pct', `${pct}%`);
    };
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.addEventListener('input', () => pintarPista(input));
        pintarPista(input);
    });

    // ---------- Arranque ----------
    document.documentElement.lang = idioma;
    pintarIdioma();
    if (!leer('ayudaVista')) setTimeout(abrirAyuda, 1200);

    return {
        setSonido,
        setModoSuperficie,
        actualizarHUD,
        mostrarFicha,
        ocultarFicha,
        marcarNavegacion,
        configurarDeslizador,
        avisar,
        // Llamar en cada fotograma: reloj y resultados de física (estos, 4 veces por segundo)
        tick(tiempo) {
            $('fecha').textContent = formatearFecha(tiempo);
            $('dia-juliano').textContent = `JD ${tiempo.toFixed(3)}`;
            const ahora = performance.now();
            if (!ficha.hidden && ahora - ultimoTick > 250) {
                if (pestaña === 'fisica') panel.actualizar(tiempo);
                else if (fichaViva) pintarFicha();
                ultimoTick = ahora;
            }
        },
        reiniciarFisica() { panel.reiniciar(panel.cuerpo, app.getTiempo()); },
        setReglaActiva,
        // Pone un interruptor de Capas sin pasar por el usuario (p. ej. escala real en los sobrevuelos)
        fijarCapa(clave, valor) {
            const input = document.querySelector(`[data-capa="${clave}"]`);
            if (input.checked !== valor) { input.checked = valor; ponerCapa(input); }
        },
        setVelocidadIndice(indice) {
            indiceVelocidad = Math.max(0, Math.min(VELOCIDADES.length - 1, indice));
            sentido = 1;
            pausado = false;
            aplicarVelocidad();
        },
        setVelocidadDesdeURL(indice, signo) {
            if (indice >= 0 && indice < VELOCIDADES.length) indiceVelocidad = indice;
            sentido = signo < 0 ? -1 : 1;
            aplicarVelocidad();
        },
        get estadoVelocidad() { return { indice: indiceVelocidad, sentido, pausado }; }
    };
}
