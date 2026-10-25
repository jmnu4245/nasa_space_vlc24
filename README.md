# NASA Space Challenge VLC 2024

Este es el repositorio del proyecto **nasa\_space\_vlc24**, desarrollado para la actividad **NASA Space Challenge VLC 2024**.

## Acceso a la página

Puedes acceder al proyecto a través del siguiente enlace:
[Acceder a la página](https://jmnu4245.github.io/nasa_space_vlc24/src/)

## Contribuidores

El proyecto ha sido desarrollado por:

- **Pablo Torrente Simón**
- **Daniel Galindo Goñi**
- **Juan Manuel Flores de la Cruz**

## Descripción

Planetario interactivo que muestra el Sistema Solar con las posiciones reales de los astros para cualquier fecha. Funciones:

- **Sol, planetas y planetas enanos** (Ceres, Plutón, Eris, Makemake y Haumea) con su eje de rotación real, y **11 lunas** con texturas de las misiones espaciales: Luna, Fobos, Deimos, Ío, Europa, Ganímedes, Calisto, Encélado, Titán, Tritón y Caronte.
- **Aspecto realista:** halo del Sol, atmósferas, Tierra con nubes, relieve, océanos brillantes y luces de ciudades de noche, sombras de los anillos de Saturno y eclipses entre planetas y lunas, y la Vía Láctea de fondo.
- **Asteroides y cometas:** 89 asteroides y 31 cometas del JPL. Los cometas tienen cola de iones y de polvo que crece al acercarse al Sol. Al seleccionar uno se dibuja su órbita y aparece su roca: Vesta, Bennu, Kleopatra, Geographos y Mithra con su forma real; el resto con una forma única y el color de su tipo espectral, girando con su periodo real.
- **Cinturones** de asteroides (con los huecos de Kirkwood) y de Kuiper.
- **Navegación:** buscador con sugerencias, barra de acceso rápido a planetas y planetas enanos, clic en un astro o en su nombre, y vuelo suave de la cámara hasta el objetivo.
- **Ficha de cada objeto** con información y una pestaña de **Física**:
  - *Leyes de Kepler* (solución analítica, vis-viva y 3.ª ley).
  - *Mecánica clásica*: integración numérica con Euler y Runge-Kutta 4, comparada con Kepler (error, deriva de energía y periodo medido).
  - *Relatividad*: factor γ, dilatación temporal, masa relativista y precesión del perihelio (≈ 43″/siglo en Mercurio).
- **Control del tiempo** tipo reproductor: pausa, de tiempo real a 10 años por segundo, hacia delante o hacia atrás, selector de fecha y botón "Hoy".
- **Enlaces para compartir** con la fecha, la velocidad y el objeto seleccionado.
- **Español e inglés**, atajos de teclado (pulsa `?`), y diseño adaptado al móvil.

## Tecnologías utilizadas

- HTML, CSS y JavaScript (módulos ES)
- [three.js](https://threejs.org/) 0.169 (cargado desde CDN con un *import map*, no hace falta instalar nada)
- Datos de asteroides y cometas del JPL Small-Body Database

## Ejecución en local

Al usar módulos ES, el navegador no deja abrir `index.html` con doble clic: hay que servir la carpeta del proyecto con cualquier servidor estático.

```sh
git clone https://github.com/jmnu4245/nasa_space_vlc24.git
cd nasa_space_vlc24
npm start          # o: python3 -m http.server 8000
```

Después abre <http://localhost:8000/src/>.

## Publicar en GitHub Pages (gratis)

1. Sube el repositorio a GitHub.
2. En **Settings → Pages**, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
3. La web quedará en `https://<usuario>.github.io/nasa_space_vlc24/src/`.

No hay paso de compilación: todo son archivos estáticos.

## Créditos de las texturas

- Texturas de la Tierra (noche, nubes, relieve, océanos) y de la Luna: ejemplos de [three.js](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets) (licencia MIT).
- Anillos de Saturno, Ceres, Eris, Makemake y Haumea: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0). Las de Eris, Makemake y Haumea son recreaciones artísticas: no hay imágenes detalladas de esos mundos.
- Plutón, Caronte, Tritón, Ío, Europa, Calisto, Encélado y Fobos: mapas de la NASA, el JPL y el USGS (dominio público), vía [Wikimedia Commons](https://commons.wikimedia.org/). Las zonas que las sondas no fotografiaron se han rellenado con un tono medio.
- Ganímedes: mapa de Björn Jónsson a partir de imágenes de Voyager y Galileo, vía Wikimedia Commons.
- Modelos de forma de Vesta, Bennu, Kleopatra, Geographos y Mithra: [NASA 3D Resources](https://science.nasa.gov/3d-resources/) (dominio público), simplificados para la web.
- Órbitas, tipos espectrales, albedos y ejes de rotación de los asteroides: [JPL Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html).
- Los anillos de Saturno, el resto de asteroides, los cometas y las lunas sin textura propia usan texturas generadas por código.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

