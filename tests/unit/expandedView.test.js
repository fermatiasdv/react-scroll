import { describe, expect, it } from 'vitest'
import { isReplayExcluded } from '../../src/fragrance-scroll/components/ExpandedView.jsx'

describe('isReplayExcluded (RF-07.6)', () => {
  // Simula un elemento cuyo `closest` encuentra un ancestro que matchee alguno de los selectores.
  const inside = (...matches) => ({
    closest: (selector) => (matches.some((m) => selector.split(',').map((s) => s.trim()).includes(m)) ? {} : null),
  })

  it.each(['.fs-image-product', '.fs-close-button'])('excluye un click dentro de %s', (selector) => {
    expect(isReplayExcluded(inside(selector))).toBe(true)
  })

  it('no excluye el resto de la pantalla', () => {
    expect(isReplayExcluded(inside())).toBe(false)
  })

  it('no rompe con un target que no es un elemento', () => {
    expect(isReplayExcluded(null)).toBe(false)
    expect(isReplayExcluded(undefined)).toBe(false)
    expect(isReplayExcluded({})).toBe(false)
  })
})
