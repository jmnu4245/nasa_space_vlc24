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

- **Sol, planetas y planetas enanos** (Ceres, Plutón, Eris, Makemake y Haumea) con su eje de rotación real, y **11 lunas** con texturas de las misiones espaciales. La Tierra gira según el tiempo sidéreo y la Luna sigue la teoría lunar de Meeus, así que los **eclipses ocurren de verdad** en su fecha: la sombra de la Luna sobre la Tierra y la Luna rojiza dentro de la sombra terrestre.
- **Texturas en alta resolución** (NASA: Blue Marble, Black Marble, LRO, Viking, MESSENGER, Hubble) que se descargan solo al acercarse a la Tierra, la Luna, Mercurio, Marte, Júpiter o Plutón.
- **Naves espaciales** con su trayectoria real (JPL Horizons): Voyager 1 y 2, New Horizons, Parker Solar Probe y James Webb.
- **Eventos astronómicos**: eclipses, oposiciones, perihelios de cometas y sobrevuelos históricos. Al pulsar uno, la simulación viaja a esa fecha y encuadra la escena.
- **Recorrido guiado** en modo cine por todo el Sistema Solar.
- **Escala real** de tamaños y **regla** para medir la distancia entre dos objetos (km, UA y tiempo luz).
- **Cielo desde la superficie**: vista en primera persona desde Valencia (o desde Jezero en Marte, la base del Apolo 11 en la Luna…), con el cielo diurno, los crepúsculos y la noche según la altura real del Sol, los atardeceres azules de Marte y el cielo siempre cubierto de Venus y Titán.
- **Fotos** en alta resolución de la vista actual, sin interfaz y con un pie con el nombre y la fecha.
- **Sonido ambiental** generado en tiempo real: zumbido del espacio, rugido del Sol al acercarse, viento al moverse alrededor de un planeta con atmósfera y efectos al seleccionar, volar y hacer fotos.
- **Asteroides y cometas:** 89 asteroides y 31 cometas del JPL, con colas de iones y polvo; Vesta, Bennu, Kleopatra, Geographos y Mithra con su forma real. Cinturones de asteroides y de Kuiper.
- **Ficha de cada objeto** con información y una pestaña de **Física** (Kepler, mecánica clásica con Euler y Runge-Kutta 4, y relatividad).
- **Interfaz**: selector de astros en arco, control del tiempo tipo reproductor, buscador, enlaces para compartir, español e inglés, atajos de teclado (pulsa `?`) y diseño adaptado al móvil.

## Tecnologías utilizadas

- HTML, CSS y JavaScript (módulos ES)
- [three.js](https://threejs.org/) 0.169 (cargado desde CDN con un *import map*, no hace falta instalar nada)
- Datos de asteroides y cometas del JPL Small-Body Database y trayectorias de naves de JPL Horizons
- Efemérides de la Luna y tiempo sidéreo según *Astronomical Algorithms* (Jean Meeus)

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
- Texturas de alta resolución (`texturas/hd/`), dominio público: Tierra *Blue Marble Next Generation* y *Black Marble 2016* y nubes (NASA Earth Observatory), Luna *CGI Moon Kit* (NASA SVS, LRO), Marte *Viking MDIM 2.1* (USGS), Mercurio *MESSENGER MDIS* (NASA/JHUAPL), Júpiter *Hubble OPAL 2019* (NASA/ESA) y Plutón (New Horizons).
- Modelos de forma de Vesta, Bennu, Kleopatra, Geographos y Mithra: [NASA 3D Resources](https://science.nasa.gov/3d-resources/) (dominio público), simplificados para la web.
- Órbitas, tipos espectrales, albedos y ejes de rotación de los asteroides: [JPL Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html).
- Los anillos de Saturno, el resto de asteroides, los cometas y las lunas sin textura propia usan texturas generadas por código.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

