import { describe, expect, it } from 'vitest'
import { layoutFor as legacyLayoutFor } from '@scroll/layout'
import * as legacyConstants from '../../legacy/my-initial-store/assets/scroll-constants.js'
import { buildTitlePanelItems } from '../../legacy/my-initial-store/assets/scroll-panel.js'
import { FRAGRANCES } from '../../src/fragrance-scroll/data/fragrances.js'
import { layoutFor } from '../../src/fragrance-scroll/lib/layout.js'
import { sceneFor } from '../../src/fragrance-scroll/lib/scene.js'

// Viewports de design §4.13.
const VIEWPORTS = [
  [320, 568],
  [360, 640],
  [375, 667],
  [390, 844],
  [412, 915],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [700, 300],
]

// Las fragancias del legacy, en el orden de su `idx`.
const legacyFragrances = Object.values(legacyConstants)
  .filter((value) => value && typeof value === 'object' && !Array.isArray(value) && 'idx' in value)
  .sort((a, b) => a.idx - b.idx)

describe('sceneFor contra el legacy', () => {
  describe.each(VIEWPORTS)('viewport %i×%i', (vw, vh) => {
    const layout = layoutFor(vw, vh)
    const legacyLayout = legacyLayoutFor(vw, vh)

    it('title e ingredientsLine coinciden con buildTitlePanelItems', () => {
      FRAGRANCES.forEach((_fragrance, i) => {
        const scene = sceneFor(i, layout, FRAGRANCES)
        const [title, ingredients] = buildTitlePanelItems(legacyFragrances[i], legacyLayout)

        expect(scene.title).toEqual({ text: title.labelText, x: title.xi, y: title.yi })
        expect(scene.ingredientsLine).toEqual({
          text: ingredients.labelText,
          x: ingredients.xi,
          y: ingredients.yi,
        })
      })
    })

    // applyProductLayout y applyAlmondTestLayout no se exportan en el legacy (L:scroll-content.js):
    // los valores esperados son los de su lógica.
    it('product coincide con applyProductLayout', () => {
      FRAGRANCES.forEach((_fragrance, i) => {
        expect(sceneFor(i, layout, FRAGRANCES).product).toEqual({
          x: legacyLayout.cx,
          y: legacyLayout.cy,
          size: legacyLayout.product.size,
        })
      })
    })

    it('ingredient coincide con applyAlmondTestLayout y el estiramiento de cada fragancia', () => {
      FRAGRANCES.forEach((fragrance, i) => {
        expect(sceneFor(i, layout, FRAGRANCES).ingredient).toEqual({
          x: legacyLayout.cx,
          y: legacyLayout.cy,
          height: Math.round(legacyLayout.product.halfH * 2),
          stretch: fragrance.slug === 'painkiller' ? { scaleX: 2, scaleY: 1.2 } : null,
        })
      })
    })
  })
})

describe('sceneFor: inmutabilidad', () => {
  const layout = layoutFor(390, 844)
  const painkillerIndex = FRAGRANCES.findIndex((f) => f.slug === 'painkiller')
  const scene = sceneFor(painkillerIndex, layout, FRAGRANCES)

  it('el resultado y cada parte están congelados, y asignar lanza TypeError', () => {
    for (const part of [scene, scene.product, scene.ingredient, scene.ingredient.stretch, scene.title, scene.ingredientsLine]) {
      expect(Object.isFrozen(part)).toBe(true)
    }
    expect(() => {
      scene.title.x = 0
    }).toThrow(TypeError)
  })

  it('no comparte ni congela el objeto de estiramiento de FRAGRANCES', () => {
    expect(scene.ingredient.stretch).not.toBe(FRAGRANCES[painkillerIndex].ingredientStretch)
    expect(Object.isFrozen(FRAGRANCES[painkillerIndex].ingredientStretch)).toBe(false)
  })

  it('llamarla dos veces da el mismo resultado', () => {
    expect(sceneFor(painkillerIndex, layout, FRAGRANCES)).toEqual(scene)
  })
})
