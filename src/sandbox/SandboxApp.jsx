import { DEFAULT_ASSETS, FRAGRANCES, FragranceScroll } from '../fragrance-scroll/index.js'

// Selector de desarrollo: `?i=0..9` elige la fragancia. Un valor inválido o ausente da la primera.
function initialSlugFromUrl() {
  const i = Number(new URLSearchParams(window.location.search).get('i'))
  return FRAGRANCES[i]?.slug
}

export default function SandboxApp() {
  return (
    <FragranceScroll
      assets={DEFAULT_ASSETS}
      fragrances={FRAGRANCES}
      initialSlug={initialSlugFromUrl()}
    />
  )
}
