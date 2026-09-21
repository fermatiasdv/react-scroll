import { describe, expect, it } from 'vitest'
import * as legacy from '@scroll/layout'
import * as current from '../../src/fragrance-scroll/lib/layout.js'

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

const EXPORTED_CONSTANTS = [
  'PRODUCT_CONTENT_X',
  'PRODUCT_CONTENT_Y',
  'PRODUCT_VIEWPORT_HEIGHT_FRACTION_STACK',
  'PRODUCT_VIEWPORT_HEIGHT_FRACTION_COLUMN',
  'INGREDIENT_LINE_COUNT',
]

describe('layout.js contra el legacy', () => {
  it('exporta los mismos nombres que el legacy', () => {
    expect(Object.keys(current).sort()).toEqual(Object.keys(legacy).sort())
  })

  it.each(EXPORTED_CONSTANTS)('la constante %s vale lo mismo que en el legacy', (name) => {
    expect(current[name]).toBeTypeOf('number')
    expect(current[name]).toBe(legacy[name])
  })

  describe.each(VIEWPORTS)('viewport %i×%i', (vw, vh) => {
    it('layoutFor devuelve lo mismo que el legacy', () => {
      expect(current.layoutFor(vw, vh)).toEqual(legacy.layoutFor(vw, vh))
    })

    it('panelLineY devuelve lo mismo que el legacy en las líneas 0 a 3', () => {
      const currentLayout = current.layoutFor(vw, vh)
      const legacyLayout = legacy.layoutFor(vw, vh)
      for (let line = 0; line <= 3; line += 1) {
        expect(current.panelLineY(line, currentLayout)).toBe(legacy.panelLineY(line, legacyLayout))
      }
    })
  })
})
