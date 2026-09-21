import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as legacy from '../../legacy/my-initial-store/assets/scroll-constants.js'
import { DEFAULT_ASSETS } from '../../src/fragrance-scroll/config/assets.js'
import { FRAGRANCES } from '../../src/fragrance-scroll/data/fragrances.js'

// Las fragancias del legacy, en el orden de su `idx`.
const legacyFragrances = Object.values(legacy)
  .filter((value) => value && typeof value === 'object' && !Array.isArray(value) && 'idx' in value)
  .sort((a, b) => a.idx - b.idx)

// La misma expresión que `slugify` de L:scroll-content.js.
const legacySlug = (name) => name.trim().toLowerCase().replace(/[\s-]+/g, '_')

describe('FRAGRANCES', () => {
  it('tiene las 10 fragancias del legacy, en el mismo orden y con los mismos nombres', () => {
    expect(legacyFragrances).toHaveLength(10)
    expect(FRAGRANCES).toHaveLength(10)
    expect(FRAGRANCES.map((f) => f.name)).toEqual(legacyFragrances.map((f) => f.nombre))
  })

  it('cada fragancia tiene 3 ingredientes, iguales a los del legacy', () => {
    FRAGRANCES.forEach((fragrance, i) => {
      expect(fragrance.ingredients).toHaveLength(3)
      expect(fragrance.ingredients).toEqual(legacyFragrances[i].ingredientes.map((ing) => ing.nombre))
    })
  })

  it('el slug de cada fragancia coincide con el cálculo del legacy', () => {
    expect(FRAGRANCES.map((f) => f.slug)).toEqual(FRAGRANCES.map((f) => legacySlug(f.name)))
    expect(new Set(FRAGRANCES.map((f) => f.slug)).size).toBe(10)
  })

  it('sólo Painkiller lleva estiramiento de la imagen de ingrediente', () => {
    for (const fragrance of FRAGRANCES) {
      expect(fragrance.ingredientStretch).toEqual(
        fragrance.slug === 'painkiller' ? { scaleX: 2, scaleY: 1.2 } : null,
      )
    }
  })
})

describe('DEFAULT_ASSETS', () => {
  it('cada slug tiene imagen de ingrediente y etiqueta (Painkiller cae en default)', () => {
    for (const { slug } of FRAGRANCES) {
      expect(DEFAULT_ASSETS.ingredients[slug]).toBeTypeOf('string')
      const label = DEFAULT_ASSETS.labels[slug] ?? DEFAULT_ASSETS.labels.default
      expect(label).toBeTypeOf('string')
    }
    expect(DEFAULT_ASSETS.labels.painkiller).toBeUndefined()
    expect(DEFAULT_ASSETS.labels.painkiller ?? DEFAULT_ASSETS.labels.default).toBe(
      DEFAULT_ASSETS.labels.default,
    )
  })

  it('tiene 4 fondos, en el orden bg-1.jpg, bg-2.webp, bg-3.webp, bg-4.webp', () => {
    expect(DEFAULT_ASSETS.backgrounds.map((url) => url.split('/').pop())).toEqual([
      'bg-1.jpg',
      'bg-2.webp',
      'bg-3.webp',
      'bg-4.webp',
    ])
  })

  it('cada archivo referenciado existe en public/', () => {
    const urls = [
      DEFAULT_ASSETS.model,
      ...Object.values(DEFAULT_ASSETS.labels),
      ...DEFAULT_ASSETS.backgrounds,
      ...Object.values(DEFAULT_ASSETS.ingredients),
      ...Object.values(DEFAULT_ASSETS.posters),
    ]
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      const file = fileURLToPath(new URL(`../../public${url}`, import.meta.url))
      expect(existsSync(file), `no existe ${url}`).toBe(true)
    }
  })
})
