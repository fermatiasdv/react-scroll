import { useState } from 'react'
import { DEFAULT_ASSETS, FRAGRANCES, FragranceScroll, localStorageStorage } from '../fragrance-scroll/index.js'
import FillerSection from './FillerSection.jsx'
import './sandbox.css'

// Selector de desarrollo: `?i=0..9` arranca directo en el desplegado con esa fragancia. Un valor
// inválido o ausente arranca en el colapsado.
function initialViewFromUrl() {
  const i = new URLSearchParams(window.location.search).get('i')
  const slug = i === null || i.trim() === '' ? undefined : FRAGRANCES[Number(i)]?.slug
  return slug ? { mode: 'expanded', slug } : { mode: 'collapsed', slug: undefined }
}

export default function SandboxApp() {
  // AJUSTE-04: simulación de abrir y volver de la pantalla desplegada. Ver docs/ajustes.md.
  const [view, setView] = useState(initialViewFromUrl)

  // AJUSTE-04: en Tapcart será `screen/open`. Ver docs/ajustes.md.
  const openExpanded = (slug) => setView({ mode: 'expanded', slug })
  // AJUSTE-04: en Tapcart será `go/back`. Ver docs/ajustes.md.
  const closeExpanded = () => setView({ mode: 'collapsed', slug: undefined })

  return (
    <>
      {/* Secciones de relleno (RF-13.1, AJUSTE-05): sólo simulan la home alrededor del bloque; no
          son parte del componente reutilizable. */}
      <FillerSection
        className="filler-section-before-1"
        eyebrow="Sección de prueba — página externa"
        title="Sección fake antes del scroll — 1 de 2"
      />
      <FillerSection
        className="filler-section-before-2"
        eyebrow="Sección de prueba — página externa"
        title="Sección fake antes del scroll — 2 de 2"
      />
      <FragranceScroll
        mode={view.mode}
        assets={DEFAULT_ASSETS}
        fragrances={FRAGRANCES}
        initialSlug={view.slug}
        // AJUSTE-11: la última vista se guarda en localStorage. Ver docs/ajustes.md.
        storage={localStorageStorage}
        onOpenExpanded={openExpanded}
        onCloseExpanded={closeExpanded}
      />
      <FillerSection
        className="filler-section-after"
        eyebrow="Sección de prueba — página externa"
        title="Sección fake después del scroll"
      />
    </>
  )
}
