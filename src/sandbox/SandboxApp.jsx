import { useState } from 'react'
import { DEFAULT_ASSETS, FRAGRANCES, FragranceScroll } from '../fragrance-scroll/index.js'

// Selector de desarrollo: `?i=0..9` elige la fragancia inicial. Un valor inválido o ausente da la primera.
function initialSlugFromUrl() {
  const i = Number(new URLSearchParams(window.location.search).get('i'))
  return FRAGRANCES[i]?.slug
}

// Selector de desarrollo para cambiar de fragancia sin recargar (hasta que T-4.1 traiga la navegación).
const SELECT_STYLE = { position: 'fixed', top: '1.5rem', left: '1.5rem', zIndex: 1000, font: 'inherit' }

export default function SandboxApp() {
  const [slug, setSlug] = useState(() => initialSlugFromUrl() ?? FRAGRANCES[0].slug)

  return (
    <>
      <select
        aria-label="Fragancia (desarrollo)"
        style={SELECT_STYLE}
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      >
        {FRAGRANCES.map((fragrance) => (
          <option key={fragrance.slug} value={fragrance.slug}>
            {fragrance.name}
          </option>
        ))}
      </select>
      <FragranceScroll assets={DEFAULT_ASSETS} fragrances={FRAGRANCES} initialSlug={slug} />
    </>
  )
}
