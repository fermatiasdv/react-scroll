import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSETS, FRAGRANCES, FragranceScroll } from '../../src/fragrance-scroll/index.js'

const render = (initialSlug, fragrances = FRAGRANCES) =>
  renderToString(
    <FragranceScroll assets={DEFAULT_ASSETS} fragrances={fragrances} initialSlug={initialSlug} />,
  )

// React escapa las comillas del `url("...")` del estilo inline.
const backgroundOf = (i) =>
  `url(&quot;${DEFAULT_ASSETS.backgrounds[i % DEFAULT_ASSETS.backgrounds.length]}&quot;)`

describe('SSR del modo desplegado (RNF-02)', () => {
  it('corre en un entorno de servidor, sin window ni document', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  it.each(FRAGRANCES.map((fragrance, i) => [fragrance.slug, i]))(
    '%s: renderiza sin lanzar, con su fondo y el botón de cerrar',
    (slug, i) => {
      const html = render(slug)
      expect(html).toContain('fs-stage')
      expect(html).toContain(backgroundOf(i))
      expect(html).toContain('aria-label="Close"')
    },
  )

  it('el primer render no depende del viewport: no trae ítems posicionados', () => {
    const html = render('painkiller')
    expect(html).not.toContain('fs-item')
    expect(html).not.toContain('fs-label-title')
    expect(html).not.toContain('fs-image-product')
  })

  // Con dos fragancias, el índice 0 y el 1 tienen fondos distintos (bg-1 y bg-2), así que se
  // distingue caer en la primera de caer en cualquier otra.
  it.each([undefined, '', 'no_existe'])('el slug %j cae en la primera fragancia (RF-12.1)', (slug) => {
    const html = render(slug, [FRAGRANCES[3], FRAGRANCES[4]])
    expect(html).toContain(backgroundOf(0))
    expect(html).not.toContain(backgroundOf(1))
  })

  it('es determinista: dos renders con las mismas props dan el mismo HTML', () => {
    expect(render('glitterati')).toBe(render('glitterati'))
  })
})
