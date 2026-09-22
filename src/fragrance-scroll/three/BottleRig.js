// Botella 3D (RF-05, D-01, D-02): port de L:scroll-bottle.js como una clase imperativa.
// Materiales, luces, cámara, tone mapping, geometría de la etiqueta y constantes: literales del
// legacy. Diferencias (design §4.10): sin pool de renderers (D-01: hay uno solo por montaje), sin
// giros ni yaw pendientes (`create` es async y devuelve el rig ya con el modelo cargado), y three
// llega por `loadThree()` en vez de un import estático (RNF-02): por eso los colores y los
// objetos de three se arman adentro de funciones y las constantes de módulo son números.
import { easeInCubic, easeInOutCubic, easeOutCubic, SPIN_DURATION_MS, SPIN_REVEAL_FRACTION } from '../config/timing.js'
import { PRODUCT_CONTENT_X, PRODUCT_CONTENT_Y } from '../lib/layout.js'
import { loadThree } from './loadThree.js'

// ---------------------------------------------------------------------------
// Colores / materiales
// ---------------------------------------------------------------------------

// Ámbar del vidrio: color de superficie + color/distancia de atenuación (Beer-Lambert).
const GLASS_COLOR = [0.36, 0.17, 0.04]
const GLASS_ATTENUATION_COLOR = [1.0, 0.66, 0.14]
const GLASS_ATTENUATION_DISTANCE = 0.32

// Pared interior opaca contra la que refracta el vidrio.
const INNER_WALL_COLOR = [0.2, 0.075, 0.015]

// Dorado de tapa y pico.
const GOLD_COLOR = [0.74, 0.55, 0.21]
const GOLD_NOZZLE_COLOR = [0.90, 0.70, 0.32]

// Tubo de succión: opaco, oscuro.
const TUBE_COLOR = [0.13, 0.07, 0.018]

// ---------------------------------------------------------------------------
// Etiqueta: cáscara curva pegada al vidrio (medidas del propio modelo)
// ---------------------------------------------------------------------------

// Semiejes de la sección del cuerpo en las unidades propias del GLB.
const BODY_HALF_X = 0.0284
const BODY_HALF_Z = 0.0158

// La etiqueta queda apenas afuera del vidrio, como una calcomanía real.
const LABEL_OUTSET = 1.012

// Alto de la etiqueta y su corrimiento vertical (unidades del GLB), y medio-ancho angular.
const LABEL_HALF_HEIGHT = 0.047 / 2
const LABEL_CENTER_Y = 0.00155
const LABEL_HALF_PHI = Math.asin(0.0237 / BODY_HALF_X)

// Segmentos de la cáscara curva de la etiqueta.
const LABEL_SEGMENTS = 32

// Estudio de luz: paneles [color, intensidad, ancho, alto, posición] que se cocinan a environment map.
const STUDIO_PANELS = [
  [0xfff1dc, 12, 6, 8, [-5, 6, 6]],
  [0xff9a3c, 9, 5, 5, [6, 3, -6]],
  [0xff7a1a, 5, 4, 6, [-6, -2, -5]],
  [0x8a4a20, 1.4, 10, 4, [0, -7, 4]],
  [0xfff6ea, 18, 1.2, 6, [2, 8, 1]],
  [0xffe2b8, 7, 1.6, 8, [-4, 0.5, 7]],
  [0xffc98a, 4, 0.9, 6, [4.5, 1, 5]],
]

// Mapa de las curvas que puede pedir spin() por nombre.
const EASINGS = { in: easeInCubic, out: easeOutCubic, inOut: easeInOutCubic }

// AJUSTE-02: hover tilt, sólo para desarrollo. Ver docs/ajustes.md.
// Ángulo (en grados) de inclinación al pasar el mouse sobre la botella y duración de la animación.
const HOVER_TILT_ANGLE_DEG = 20
const HOVER_TILT_DURATION_MS = 300
const HOVER_TILT_ANGLE_RAD = HOVER_TILT_ANGLE_DEG * (Math.PI / 180)

// ---------------------------------------------------------------------------
// Etiqueta: geometría y material (cacheados, compartidos entre rigs)
// ---------------------------------------------------------------------------

function buildLabelGeometry(THREE) {
  const a = BODY_HALF_X * LABEL_OUTSET
  const b = BODY_HALF_Z * LABEL_OUTSET
  const pos = []
  const uvs = []
  const idx = []
  for (let i = 0; i <= LABEL_SEGMENTS; i += 1) {
    const t = i / LABEL_SEGMENTS
    const phi = (t - 0.5) * 2 * LABEL_HALF_PHI
    const x = a * Math.sin(phi)
    const z = b * Math.cos(phi)
    pos.push(x, LABEL_CENTER_Y - LABEL_HALF_HEIGHT, z, x, LABEL_CENTER_Y + LABEL_HALF_HEIGHT, z)
    uvs.push(t, 0, t, 1)
  }
  for (let i = 0; i < LABEL_SEGMENTS; i += 1) {
    const k = i * 2
    idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(idx)
  geometry.computeVertexNormals()
  return geometry
}

// Siempre la misma forma: se calcula una sola vez y se comparte.
let cachedLabelGeometry = null
function getLabelGeometry(THREE) {
  if (!cachedLabelGeometry) cachedLabelGeometry = buildLabelGeometry(THREE)
  return cachedLabelGeometry
}

// Material de etiqueta por URL (textura + resto de propiedades), con la promesa `ready` que se
// resuelve cuando la textura terminó de cargar (o falló). Cambiar de fragancia reusa lo ya cargado.
const labelCache = new Map()

function getLabelEntry(THREE, labelUrl) {
  let entry = labelCache.get(labelUrl)
  if (!entry) {
    let resolveReady
    const ready = new Promise((resolve) => {
      resolveReady = resolve
    })
    const texture = new THREE.TextureLoader().load(labelUrl, resolveReady, undefined, resolveReady)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.05,
      envMapIntensity: 1.2,
    })
    entry = { material, ready }
    labelCache.set(labelUrl, entry)
  }
  return entry
}

// ---------------------------------------------------------------------------
// Estudio de luz (PMREM sobre paneles emisivos)
// ---------------------------------------------------------------------------

// Cocina los paneles a environment map con PMREMGenerator: reflejos cálidos y una franja de luz
// vertical, sin HDRI externo.
function makeStudioEnvironment(THREE, renderer) {
  const envScene = new THREE.Scene()

  STUDIO_PANELS.forEach(([color, intensity, w, h, pos]) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      }),
    )
    mesh.position.set(...pos)
    mesh.lookAt(0, 0, 0)
    envScene.add(mesh)
  })

  const pmrem = new THREE.PMREMGenerator(renderer)
  const target = pmrem.fromScene(envScene, 0.08)
  pmrem.dispose()

  envScene.traverse((obj) => {
    if (obj.isMesh) {
      obj.geometry.dispose()
      obj.material.dispose()
    }
  })

  return target
}

// ---------------------------------------------------------------------------
// Modelo maestro (una sola carga por URL)
// ---------------------------------------------------------------------------

// Carga el GLB, reemplaza sus materiales (vidrio con transmission real) y mide la caja del
// resultado para calibrarlo contra layout.js sin tocar el GLB. La etiqueta no va acá: cada rig
// arma la suya sobre su clone.
function loadMasterModel(THREE, GLTFLoader, modelUrl) {
  const loader = new GLTFLoader()
  return loader.loadAsync(modelUrl).then((gltf) => {
    const model = gltf.scene

    model.traverse((obj) => {
      if (!obj.isMesh) return
      const materialName = obj.material?.name || ''

      if (materialName.includes('Bottle body')) {
        // Vidrio con transmission real + atenuación (Beer-Lambert). El normal map horneado del
        // GLB (el grabado "BROWN SUGAR BABE") se conserva tal cual.
        const embossNormal = obj.material.normalMap
        const embossScale = obj.material.normalScale ? obj.material.normalScale.clone() : new THREE.Vector2(1, 1)
        obj.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(...GLASS_COLOR),
          metalness: 0,
          roughness: 0.03,
          transmission: 1.0,
          // thickness 0: sin desplazamiento de refracción en espacio de pantalla, así el vidrio no
          // muestrea un píxel vecino del buffer de transmisión (duplicaba la etiqueta como manchas
          // fantasma alrededor de sus bordes con thickness > 0).
          thickness: 0.0,
          ior: 1.5,
          attenuationColor: new THREE.Color(...GLASS_ATTENUATION_COLOR),
          attenuationDistance: GLASS_ATTENUATION_DISTANCE,
          normalMap: embossNormal,
          normalScale: embossScale,
          clearcoat: 0.5,
          clearcoatRoughness: 0.04,
          envMapIntensity: 1.1,
          specularIntensity: 1.2,
          // FrontSide: con DoubleSide la pared lejana del vidrio se dibuja otra vez encima de lo
          // ya transmitido, embarrando el tubo/etiqueta de atrás.
          side: THREE.FrontSide,
        })
        // Pared interior opaca: sin esto, la transmisión muestrea el canvas transparente y el
        // vidrio lee fino/vacío en vez de lleno.
        const innerWall = new THREE.Mesh(obj.geometry, new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(...INNER_WALL_COLOR),
          metalness: 0,
          roughness: 0.12,
          clearcoat: 0.4,
          clearcoatRoughness: 0.1,
          envMapIntensity: 0.7,
          side: THREE.BackSide,
        }))
        obj.add(innerWall)
      } else if (materialName === 'Cap' || materialName.includes('Nozzle')) {
        const isNozzle = materialName.includes('Nozzle')
        obj.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(...(isNozzle ? GOLD_NOZZLE_COLOR : GOLD_COLOR)),
          metalness: 1,
          roughness: isNozzle ? 0.2 : 0.24,
          envMapIntensity: 1.5,
        })
      } else if (obj.name === 'Tube_EXPORT' || materialName === 'Material.002') {
        obj.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(...TUBE_COLOR),
          roughness: 0.45,
          metalness: 0.05,
        })
      }
    })

    // Medir y centrar: el GLB no viene centrado en su propio origen (el pie del vidrio arranca por
    // debajo de 0), así que se mide la caja real y cada rig aplica su escala (ver buildBottleGroup).
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    model.position.sub(center)

    return { model, naturalHeight: size.y, naturalHalfWidth: size.x / 2 }
  })
}

// Promesa por URL. Si falla se descarta, así la próxima llamada reintenta (RF-11.3).
const modelCache = new Map()

function getMasterModel(THREE, GLTFLoader, modelUrl) {
  let promise = modelCache.get(modelUrl)
  if (!promise) {
    promise = loadMasterModel(THREE, GLTFLoader, modelUrl)
    modelCache.set(modelUrl, promise)
    promise.catch(() => {
      if (modelCache.get(modelUrl) === promise) modelCache.delete(modelUrl)
    })
  }
  return promise
}

// Clona el modelo maestro (comparte geometrías/materiales/texturas, sólo clona la jerarquía) y lo
// envuelve en un grupo escalado para que mida exactamente lo que layout.js espera, angostándolo si
// hace falta (nunca ensanchándolo) para no pasarse del ancho reservado a los ingredientes.
function buildBottleGroup(THREE, master, labelMesh) {
  const height = PRODUCT_CONTENT_Y * 2
  const maxRadius = PRODUCT_CONTENT_X
  const clone = master.model.clone(true)
  clone.add(labelMesh)
  const scale = height / master.naturalHeight
  const projectedHalfWidth = master.naturalHalfWidth * scale
  const xzScale = projectedHalfWidth > maxRadius ? scale * (maxRadius / projectedHalfWidth) : scale

  const group = new THREE.Group()
  group.add(clone)
  group.scale.set(xzScale, scale, xzScale)
  return group
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export class BottleRig {
  #THREE
  #canvas
  #renderer
  #envTarget
  #scene
  #camera
  #group
  #labelMesh
  #labelUrl
  #spin = null
  #disposed = false
  #firstFrameDone = false
  #firstFrameCallbacks = []
  #firstFrameHandle = null
  #compiled // Promise (nunca rechaza): los shaders de la botella ya están compilados

  // AJUSTE-02: hover tilt, sólo para desarrollo. Ver docs/ajustes.md.
  #isHovered = false
  #tiltAngle = 0 // ángulo actualmente aplicado (rad)
  #tiltTarget = 0 // ángulo hacia el que se está animando (rad)
  #tiltFrame = null

  /**
   * Monta la botella en un canvas. La cámara es ORTOGRÁFICA con frustum -1..1 en los dos ejes: el
   * cuadro visible coincide con el cuadro cuadrado del canvas, así que un objeto de tamaño N en
   * unidades de mundo ocupa la fracción N/2 del cuadro (la botella mide lo que layout.js cree).
   *
   * Se resuelve cuando three y el GLB están cargados, el renderer creado y los shaders compilados
   * (sin bloquear el hilo principal, ver el constructor); la textura de la etiqueta puede seguir
   * cargando (ver onFirstFrame). Rechaza si falla la carga o el WebGL.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   * @param {string} options.modelUrl - URL del GLB (assets.model).
   * @param {number} options.size - Lado del canvas en px (cuadrado).
   * @param {number} [options.pixelRatio] - devicePixelRatio a usar.
   * @param {string} options.labelUrl - URL de la etiqueta inicial (ya resuelta por slug).
   * @returns {Promise<BottleRig>}
   */
  static async create(canvas, { modelUrl, size, pixelRatio, labelUrl }) {
    const { THREE, GLTFLoader } = await loadThree()
    const master = await getMasterModel(THREE, GLTFLoader, modelUrl)
    // Un frame de espera antes de crear el renderer (contexto WebGL + PMREM, síncronos). Con three
    // y el GLB ya en caché (segunda apertura en adelante) todo lo anterior se resuelve en
    // microtasks pegados al montaje, y sin esta espera el bloqueo corre antes de que se pinte el
    // póster (RF-10.3). Dos rAF, no uno: el primero corre antes del paint de su frame; recién el
    // segundo llega con el póster ya pintado.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const rig = new BottleRig(THREE, canvas, master, {
      size,
      pixelRatio: pixelRatio ?? (window.devicePixelRatio || 1),
      labelUrl,
    })
    await rig.#compiled
    return rig
  }

  constructor(THREE, canvas, master, { size, pixelRatio, labelUrl }) {
    this.#THREE = THREE
    this.#canvas = canvas
    this.#labelUrl = labelUrl

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(size, size, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.outputColorSpace = THREE.SRGBColorSpace
    this.#renderer = renderer
    this.#envTarget = makeStudioEnvironment(THREE, renderer)

    const scene = new THREE.Scene()
    scene.environment = this.#envTarget.texture
    this.#scene = scene

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.set(0, 0, 3)
    camera.lookAt(0, 0, 0)
    this.#camera = camera

    // Un poco de inclinación: se ve la botella apenas desde arriba, como en la foto de producto.
    const pivot = new THREE.Group()
    pivot.rotation.x = -0.06
    scene.add(pivot)

    // Luces directas: el environment hace el grueso del trabajo, esto agrega los destellos duros.
    const key = new THREE.DirectionalLight(0xffe6c4, 2.6)
    key.position.set(-3, 4, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xff8a2a, 2.0)
    rim.position.set(3.5, 1.5, -3)
    scene.add(rim)
    scene.add(new THREE.AmbientLight(0x40200c, 1.0))

    const label = getLabelEntry(THREE, labelUrl)
    this.#labelMesh = new THREE.Mesh(getLabelGeometry(THREE), label.material)
    this.#group = buildBottleGroup(THREE, master, this.#labelMesh)
    pivot.add(this.#group)

    // AJUSTE-02: hover tilt, sólo para desarrollo. Ver docs/ajustes.md.
    canvas.addEventListener('mouseenter', this.#handleMouseEnter)
    canvas.addEventListener('mousemove', this.#handleMouseMove)
    canvas.addEventListener('mouseleave', this.#handleMouseLeave)

    // Los shaders se compilan de forma asíncrona (KHR_parallel_shader_compile), para que el primer
    // dibujo no bloquee el hilo principal. Si la compilación falla, se compilan en el primer dibujo.
    this.#compiled = renderer.compileAsync(scene, camera).then(
      () => {},
      () => {},
    )
    // Primer dibujo ya con el modelo puesto. La etiqueta carga de forma asíncrona: cuando termina se
    // redibuja, y recién ahí cuenta como primer frame (RF-10.3).
    this.#compiled.then(() => {
      if (this.#disposed) return
      this.#draw()
      label.ready.then(() => {
        if (this.#disposed) return
        this.#draw()
        // Dos frames, no uno: el canvas tiene que haberse compuesto al menos una vez antes de que
        // el póster se quite, o entre uno y otro puede verse el hueco (RF-10.3).
        this.#firstFrameHandle = requestAnimationFrame(() => {
          this.#firstFrameHandle = requestAnimationFrame(() => {
            this.#firstFrameHandle = null
            this.#firstFrameDone = true
            const callbacks = this.#firstFrameCallbacks
            this.#firstFrameCallbacks = []
            callbacks.forEach((cb) => cb())
          })
        })
      })
    })
  }

  #draw() {
    if (this.#disposed) return
    this.#renderer.render(this.#scene, this.#camera)
  }

  /** Cambia el lado del canvas (px) y redibuja. */
  setSize(size) {
    if (this.#disposed) return
    this.#renderer.setSize(size, size, false)
    this.#draw()
  }

  /**
   * Cambia la etiqueta de la botella (RF-05.2). Las texturas se cachean por URL. La etiqueta nueva
   * se pone recién cuando su textura terminó de cargar, para no mostrar una etiqueta vacía. La
   * Promise se resuelve cuando ya está puesta y dibujada.
   * @param {string} url
   * @returns {Promise<void>}
   */
  setLabel(url) {
    if (this.#disposed) return Promise.resolve()
    this.#labelUrl = url
    const { material, ready } = getLabelEntry(this.#THREE, url)
    return ready.then(() => {
      if (this.#disposed || this.#labelUrl !== url) return
      this.#labelMesh.material = material
      this.#draw()
    })
  }

  /** Fija el ángulo (yaw, en radianes) sin animación y cancela el giro en curso. */
  setYaw(rad) {
    if (this.#disposed) return
    this.#stopSpin()
    this.#group.rotation.y = rad
    this.#draw()
  }

  /**
   * Gira la botella de `from` a `to` (radianes) y la deja ahí. Sin opciones: una vuelta completa de
   * frente a frente, con easeInOutCubic en SPIN_DURATION_MS. `easing` es 'in', 'out' o 'inOut'
   * (RF-05.4): 'in' seguido de 'out', con la misma duración, da la misma curva que 'inOut' partida
   * al medio, sin frenazo en el empalme. `onReveal` se dispara una vez, al `revealFraction` de la
   * duración, mientras la botella sigue girando.
   *
   * La Promise se resuelve con `true` al completar y con `false` si otro spin, `setYaw` o
   * `dispose` lo cancela.
   * @returns {Promise<boolean>}
   */
  spin({
    from = 0,
    to = from + Math.PI * 2,
    durationMs = SPIN_DURATION_MS,
    easing = 'inOut',
    onReveal,
    revealFraction = SPIN_REVEAL_FRACTION,
  } = {}) {
    if (this.#disposed) return Promise.resolve(false)
    this.#stopSpin()
    return new Promise((resolve) => {
      const ease = EASINGS[easing] || EASINGS.inOut
      const start = performance.now()
      const revealAtMs = durationMs * revealFraction
      let revealFired = false
      const state = { frame: null, resolve }
      this.#spin = state
      const step = (now) => {
        if (this.#spin !== state) return
        // Math.max en 0: el timestamp de un rAF puede ser ligeramente anterior al `start` capturado
        // con performance.now() (pasa en el primer giro, cuando el primer draw compila shaders y
        // ese trabajo cae entre los dos). Sin el clamp, `elapsed` da negativo y la botella se
        // inclina un instante al revés.
        const elapsed = Math.max(0, now - start)
        const t = Math.min(1, elapsed / durationMs)
        this.#group.rotation.y = from + ease(t) * (to - from)
        this.#draw()
        if (!revealFired && onReveal && elapsed >= revealAtMs) {
          revealFired = true
          onReveal()
          if (this.#spin !== state) return
        }
        if (t < 1) {
          state.frame = requestAnimationFrame(step)
        } else {
          this.#group.rotation.y = to
          this.#draw()
          this.#spin = null
          resolve(true)
        }
      }
      state.frame = requestAnimationFrame(step)
    })
  }

  #stopSpin() {
    if (!this.#spin) return
    const { frame, resolve } = this.#spin
    this.#spin = null
    cancelAnimationFrame(frame)
    resolve(false)
  }

  /**
   * Llama a `cb` cuando el canvas pintó su primer frame con el modelo y la etiqueta ya cargados
   * (RF-10.3): a partir de ahí el póster puede reemplazarse sin parpadeo. Si ya ocurrió, llama a
   * `cb` enseguida.
   */
  onFirstFrame(cb) {
    if (this.#disposed) return
    if (this.#firstFrameDone) {
      cb()
      return
    }
    this.#firstFrameCallbacks.push(cb)
  }

  // AJUSTE-02: hover tilt, sólo para desarrollo. Ver docs/ajustes.md.
  // Anima `#tiltAngle` (y lo aplica a `rotation.x`) desde su valor actual hasta `target`.
  #animateTiltTo(target) {
    if (this.#tiltTarget === target && this.#tiltFrame !== null) return
    this.#tiltTarget = target
    if (this.#tiltFrame !== null) cancelAnimationFrame(this.#tiltFrame)
    const startAngle = this.#tiltAngle
    const start = performance.now()
    const step = (now) => {
      if (this.#disposed) {
        this.#tiltFrame = null
        return
      }
      const elapsed = Math.max(0, now - start)
      const t = Math.min(1, elapsed / HOVER_TILT_DURATION_MS)
      this.#tiltAngle = startAngle + (this.#tiltTarget - startAngle) * easeInOutCubic(t)
      this.#group.rotation.x = this.#tiltAngle
      this.#draw()
      this.#tiltFrame = t < 1 ? requestAnimationFrame(step) : null
    }
    this.#tiltFrame = requestAnimationFrame(step)
  }

  // AJUSTE-02: hover tilt, sólo para desarrollo. Ver docs/ajustes.md.
  // Mouse en la mitad de arriba del canvas: la parte de abajo va hacia adelante; en la de abajo,
  // al revés.
  #handleMouseMove = (e) => {
    if (this.#disposed) return
    const rect = this.#canvas.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    this.#animateTiltTo(relativeY < rect.height / 2 ? -HOVER_TILT_ANGLE_RAD : HOVER_TILT_ANGLE_RAD)
  }

  #handleMouseEnter = (e) => {
    if (this.#isHovered) return
    this.#isHovered = true
    this.#handleMouseMove(e)
  }

  #handleMouseLeave = () => {
    if (!this.#isHovered) return
    this.#isHovered = false
    this.#animateTiltTo(0) // vuelve suave a la posición inicial
  }

  /**
   * Libera el renderer y el environment de esta botella (D-01). Las geometrías, materiales y
   * texturas del modelo y de las etiquetas son compartidas y viven toda la página: no se disponen.
   * Ojo: deja el contexto WebGL del canvas perdido, así que un canvas no se puede reusar después.
   */
  dispose() {
    if (this.#disposed) return
    this.#stopSpin()
    this.#disposed = true
    if (this.#tiltFrame !== null) cancelAnimationFrame(this.#tiltFrame)
    this.#tiltFrame = null
    if (this.#firstFrameHandle !== null) cancelAnimationFrame(this.#firstFrameHandle)
    this.#firstFrameHandle = null
    this.#firstFrameCallbacks = []
    // AJUSTE-02: hover tilt, sólo para desarrollo. Ver docs/ajustes.md.
    this.#canvas.removeEventListener('mouseenter', this.#handleMouseEnter)
    this.#canvas.removeEventListener('mousemove', this.#handleMouseMove)
    this.#canvas.removeEventListener('mouseleave', this.#handleMouseLeave)
    this.#isHovered = false
    this.#envTarget.dispose()
    this.#renderer.dispose()
    this.#renderer.forceContextLoss()
  }
}
