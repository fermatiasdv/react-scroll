// Única vía de acceso a three.js (RNF-02, D-02): import() dinámico, sólo en el cliente.
// La Promise se cachea a nivel de módulo; si falla se descarta, así la próxima llamada reintenta
// (RF-11.3: la precarga ignora sus errores y la carga normal del desplegado reintenta).

let threePromise = null

/**
 * @returns {Promise<{ THREE: typeof import('three'), GLTFLoader: typeof import('three/examples/jsm/loaders/GLTFLoader.js').GLTFLoader }>}
 */
export function loadThree() {
  if (!threePromise) {
    threePromise = Promise.all([
      import('three'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
    ]).then(([THREE, { GLTFLoader }]) => ({ THREE, GLTFLoader }))
    threePromise.catch(() => {
      threePromise = null
    })
  }
  return threePromise
}
