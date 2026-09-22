// Precarga (RF-11). AJUSTE-12: arranca al terminar de cargar la página, no cuando el bloque
// colapsado entra en pantalla (a diferencia del legacy, con `IntersectionObserver`). Ver
// docs/ajustes.md. Con el colapsado montado, después del `load` y en un momento libre, se
// descarga por adelantado todo lo que va a necesitar el desplegado, en este orden:
//   1. el módulo de three.js,
//   2. el GLB (sólo la descarga: llena la caché HTTP, no lo parsea — ver el porqué más abajo),
//   3. las 10 etiquetas,
//   4. los fondos y las imágenes de ingrediente, en prioridad baja.
// Si `navigator.connection?.saveData` es true, no se precarga nada (RF-11.2). Cada paso ignora sus
// propios errores; nada de esto bloquea ni retrasa el render del colapsado (RF-11.3). Nada toca
// `window`/`document`/`navigator` a nivel de módulo (RNF-02): todo queda dentro de las funciones.
import { loadThree } from '../three/loadThree.js'

// Llama a `cb` después del evento `load` (o enseguida si ya pasó) y, adentro de eso, en un momento
// libre del hilo principal.
function onLoadThenIdle(cb) {
  const idle = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(cb)
    else setTimeout(cb, 0)
  }
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}

// Precarga una imagen sin agregarla al DOM. Falla en silencio (RF-11.3).
function preloadImage(url, priority) {
  try {
    const img = new Image()
    img.fetchPriority = priority
    img.decoding = 'async'
    img.src = url
  } catch {
    // Sin Image (entorno raro) o URL inválida: no pasa nada, la carga normal reintenta.
  }
}

/**
 * Programa la precarga de todo lo que necesita el modo desplegado (RF-11). Se llama una vez al
 * montar el colapsado.
 * @param {object} assets - `DEFAULT_ASSETS` (o el que reciba `FragranceScroll` por props).
 */
export function schedulePreload(assets) {
  onLoadThenIdle(() => {
    try {
      if (navigator.connection?.saveData) return
    } catch {
      // Sin `navigator.connection`: se sigue como si no hubiera ahorro de datos activado.
    }

    // Encadenado (no en paralelo) para que las peticiones salgan en este orden de prioridad; cada
    // paso atrapa sus propios errores, así uno que falle no cancela los que siguen (RF-11.3).
    loadThree()
      .catch(() => {})
      // El GLB parseado y cacheado (`getMasterModel`) es privado de `BottleRig.js`, fuera de los
      // archivos permitidos de esta tarea. AJUSTE-12 ya asume que entre pantallas sólo se comparte
      // la caché HTTP, así que alcanza con la descarga: cuando se abra el desplegado, `BottleRig`
      // vuelve a pedir el archivo, pero ya lo tiene en caché.
      .then(() => fetch(assets.model).catch(() => {}))
      .then(() => {
        Object.values(assets.labels).forEach((url) => preloadImage(url, 'auto'))
      })
      .catch(() => {})
      .then(() => {
        assets.backgrounds.forEach((url) => preloadImage(url, 'low'))
        Object.values(assets.ingredients).forEach((url) => preloadImage(url, 'low'))
      })
      .catch(() => {})
  })
}
