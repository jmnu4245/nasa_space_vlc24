import * as THREE from 'three';
import { añadirSombras } from './sombras.js';
import { SCALE_SIZE, ANILLOS_SATURNO } from './datos.js';

const cargador = new THREE.TextureLoader();
export function cargarTextura(archivo, color = true) {
    const textura = cargador.load(`../texturas/${archivo}`);
    if (color) textura.colorSpace = THREE.SRGBColorSpace;
    textura.anisotropy = 4;
    return textura;
}

// Halo atmosférico: brillo en el borde del planeta (efecto Fresnel), solo en la cara de día
export function crearAtmosfera(radio, color, intensidad = 1) {
    const material = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uIntensidad: { value: intensidad } },
        vertexShader: `
            #include <common>
            #include <logdepthbuf_pars_vertex>
            varying vec3 vNormal;
            varying vec3 vPosVista;
            varying vec3 vNormalMundo;
            varying vec3 vPosMundo;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vNormalMundo = normalize(mat3(modelMatrix) * normal);
                vPosMundo = (modelMatrix * vec4(position, 1.0)).xyz;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vPosVista = mv.xyz;
                gl_Position = projectionMatrix * mv;
                #include <logdepthbuf_vertex>
            }`,
        fragmentShader: `
            #include <logdepthbuf_pars_fragment>
            uniform vec3 uColor;
            uniform float uIntensidad;
            varying vec3 vNormal;
            varying vec3 vPosVista;
            varying vec3 vNormalMundo;
            varying vec3 vPosMundo;
            void main() {
                #include <logdepthbuf_fragment>
                float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(-vPosVista))), 2.5);
                float dia = smoothstep(-0.25, 0.4, dot(normalize(vNormalMundo), normalize(-vPosMundo)));
                gl_FragColor = vec4(uColor * fresnel * dia * uIntensidad, 1.0);
            }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });
    return new THREE.Mesh(new THREE.SphereGeometry(radio * 1.035, 64, 64), material);
}

// Tierra: relieve, océanos brillantes, luces de ciudades de noche y capa de nubes
export function decorarTierra(tierra, oclusores) {
    const material = new THREE.MeshStandardMaterial({
        map: tierra.esfera.material.map,
        normalMap: cargarTextura('tierra_normal.jpg', false),
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughnessMap: cargarTextura('tierra_rugosidad.jpg', false),
        metalness: 0,
        emissiveMap: cargarTextura('tierra_noche.jpg'),
        emissive: new THREE.Color(1, 0.85, 0.6),
        emissiveIntensity: 1.5
    });
    // Las luces nocturnas solo se ven en la cara que no mira al Sol
    añadirSombras(material, oclusores, null, shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
            vec3 solVista = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            float nl = dot(normalize(vNormal), normalize(solVista + vViewPosition));
            totalEmissiveRadiance *= texture2D(emissiveMap, vEmissiveMapUv).rgb * smoothstep(0.1, -0.2, nl);`);
    }, 'tierra');
    tierra.esfera.material = material;

    const nubes = new THREE.Mesh(
        new THREE.SphereGeometry(tierra.tamaño * 1.008, 64, 64),
        new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: cargarTextura('tierra_nubes.jpg', false), transparent: true, depthWrite: false })
    );
    añadirSombras(nubes.material, oclusores, null, null, 'nubes');
    tierra.esfera.add(nubes);
    tierra.nubes = nubes;
    tierra.mesh.add(crearAtmosfera(tierra.tamaño, 0x4d8dff, 1.6));
}

// Anillos de Saturno con textura radial y sombra del planeta sobre ellos
export function crearAnillos(saturno) {
    const interior = ANILLOS_SATURNO.interior * SCALE_SIZE;
    const exterior = ANILLOS_SATURNO.exterior * SCALE_SIZE;
    const geometry = new THREE.RingGeometry(interior, exterior, 256, 1);
    // Coordenada u = posición radial, para mapear el perfil de anillos
    const pos = geometry.attributes.position, uv = geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const r = Math.hypot(pos.getX(i), pos.getY(i));
        uv.setXY(i, (r - interior) / (exterior - interior), 0.5);
    }
    // Textura radial (Solar System Scope): u = 0 en el radio interior y u = 1 en el exterior
    const mapa = cargarTextura('2k_saturn_ring_alpha.png');
    // Algo de luz propia: cerca de los equinoccios de Saturno el Sol los ilumina casi de canto
    const material = new THREE.MeshStandardMaterial({
        map: mapa, emissiveMap: mapa, emissive: 0xffffff, emissiveIntensity: 0.25,
        transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1
    });
    añadirSombras(material, [{ objeto: saturno.mesh, radio: saturno.tamaño }], null, null, 'anillos');
    const anillo = new THREE.Mesh(geometry, material);
    anillo.rotation.x = -Math.PI / 2; // al plano ecuatorial (perpendicular al eje del planeta)
    saturno.mesh.add(anillo);
    return { objeto: saturno.mesh, interior, exterior, mapa };
}
