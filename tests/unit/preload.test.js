import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ASSETS } from '../../src/fragrance-scroll/config/assets.js'
import { loadThree } from '../../src/fragrance-scroll/three/loadThree.js'
import { schedulePreload } from '../../src/fragrance-scroll/lib/preload.js'

vi.mock('../../src/fragrance-scroll/three/loadThree.js', () => ({
  loadThree: vi.fn(),
}))

// `document`/`window`/`navigator`/`fetch`/`Image` no existen en el entorno `node` de Vitest: se
// simulan los mínimos que usa `preload.js`.
function fakeWindow() {
  const listeners = new Map()
  return {
    addEventListener: (type, cb) => listeners.set(type, cb),
    fireLoad: () => listeners.get('load')?.(),
  }
}

function fakeImage() {
  const created = []
  class FakeImage {
    set src(url) {
      created.push({ url, fetchPriority: this.fetchPriority, decoding: this.decoding })
    }
  }
  return { FakeImage, created }
}

// Corre la microtask/idle callback ya encolada (setTimeout(cb, 0) o el callback pasado a
// `requestIdleCallback`) y deja que la cadena de promesas de `schedulePreload` se resuelva.
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('schedulePreload (RF-11)', () => {
  it('con saveData activado no precarga nada', async () => {
    vi.stubGlobal('document', { readyState: 'complete' })
    vi.stubGlobal('window', fakeWindow())
    vi.stubGlobal('navigator', { connection: { saveData: true } })
    vi.stubGlobal('fetch', vi.fn())
    const { FakeImage, created } = fakeImage()
    vi.stubGlobal('Image', FakeImage)

    schedulePreload(DEFAULT_ASSETS)
    await flush()

    expect(loadThree).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(created).toHaveLength(0)
  })

  it('sin saveData precarga three, el GLB, las 10 etiquetas y el resto en prioridad baja', async () => {
    vi.stubGlobal('document', { readyState: 'complete' })
    vi.stubGlobal('window', fakeWindow())
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}))
    const { FakeImage, created } = fakeImage()
    vi.stubGlobal('Image', FakeImage)
    loadThree.mockResolvedValue({ THREE: {}, GLTFLoader: class {} })

    schedulePreload(DEFAULT_ASSETS)
    await flush()

    expect(loadThree).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(DEFAULT_ASSETS.model)

    const labelUrls = Object.values(DEFAULT_ASSETS.labels)
    const backgroundUrls = DEFAULT_ASSETS.backgrounds
    const ingredientUrls = Object.values(DEFAULT_ASSETS.ingredients)
    expect(created).toHaveLength(labelUrls.length + backgroundUrls.length + ingredientUrls.length)

    labelUrls.forEach((url) => {
      const entry = created.find((c) => c.url === url)
      expect(entry, url).toBeTruthy()
      expect(entry.fetchPriority).toBe('auto')
    })
    ;[...backgroundUrls, ...ingredientUrls].forEach((url) => {
      const entry = created.find((c) => c.url === url)
      expect(entry, url).toBeTruthy()
      expect(entry.fetchPriority).toBe('low')
    })
  })

  it('sin navigator.connection, se sigue como si no hubiera saveData', async () => {
    vi.stubGlobal('document', { readyState: 'complete' })
    vi.stubGlobal('window', fakeWindow())
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}))
    const { FakeImage } = fakeImage()
    vi.stubGlobal('Image', FakeImage)
    loadThree.mockResolvedValue({ THREE: {}, GLTFLoader: class {} })

    schedulePreload(DEFAULT_ASSETS)
    await flush()

    expect(loadThree).toHaveBeenCalledTimes(1)
  })

  it('si document ya está en `complete`, no espera al evento load', async () => {
    vi.stubGlobal('document', { readyState: 'complete' })
    const win = fakeWindow()
    vi.stubGlobal('window', win)
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}))
    const { FakeImage } = fakeImage()
    vi.stubGlobal('Image', FakeImage)
    loadThree.mockResolvedValue({ THREE: {}, GLTFLoader: class {} })

    schedulePreload(DEFAULT_ASSETS)
    await flush()

    expect(loadThree).toHaveBeenCalledTimes(1)
  })

  it('si la página todavía no cargó, espera al evento load antes de precargar', async () => {
    vi.stubGlobal('document', { readyState: 'loading' })
    const win = fakeWindow()
    vi.stubGlobal('window', win)
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}))
    const { FakeImage } = fakeImage()
    vi.stubGlobal('Image', FakeImage)
    loadThree.mockResolvedValue({ THREE: {}, GLTFLoader: class {} })

    schedulePreload(DEFAULT_ASSETS)
    await flush()
    expect(loadThree).not.toHaveBeenCalled()

    win.fireLoad()
    await flush()
    expect(loadThree).toHaveBeenCalledTimes(1)
  })

  it('sin requestIdleCallback, usa setTimeout como fallback', async () => {
    vi.stubGlobal('document', { readyState: 'complete' })
    vi.stubGlobal('window', fakeWindow())
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}))
    const { FakeImage } = fakeImage()
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('requestIdleCallback', undefined)
    loadThree.mockResolvedValue({ THREE: {}, GLTFLoader: class {} })

    schedulePreload(DEFAULT_ASSETS)
    await flush()

    expect(loadThree).toHaveBeenCalledTimes(1)
  })

  it('si loadThree falla, igual se precargan las etiquetas, los fondos y los ingredientes', async () => {
    vi.stubGlobal('document', { readyState: 'complete' })
    vi.stubGlobal('window', fakeWindow())
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}))
    const { FakeImage, created } = fakeImage()
    vi.stubGlobal('Image', FakeImage)
    loadThree.mockRejectedValue(new Error('sin red'))

    expect(() => schedulePreload(DEFAULT_ASSETS)).not.toThrow()
    await flush()

    expect(fetch).toHaveBeenCalledWith(DEFAULT_ASSETS.model)
    const labelUrls = Object.values(DEFAULT_ASSETS.labels)
    expect(created.length).toBeGreaterThanOrEqual(labelUrls.length)
  })

  it('si fetch del GLB falla, igual se precargan las etiquetas, los fondos y los ingredientes', async () => {
    vi.stubGlobal('document', { readyState: 'complete' })
    vi.stubGlobal('window', fakeWindow())
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const { FakeImage, created } = fakeImage()
    vi.stubGlobal('Image', FakeImage)
    loadThree.mockResolvedValue({ THREE: {}, GLTFLoader: class {} })

    expect(() => schedulePreload(DEFAULT_ASSETS)).not.toThrow()
    await flush()

    const labelUrls = Object.values(DEFAULT_ASSETS.labels)
    expect(created.length).toBeGreaterThanOrEqual(labelUrls.length)
  })
})
