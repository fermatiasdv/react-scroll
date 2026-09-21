import { useEffect, useRef } from 'react'
import { BACKGROUND_TRANSITION_MS, LABEL_TRANSITION_MS, WORD_FADE_MS } from '../config/timing.js'
import { useNavigation } from '../hooks/useNavigation.js'
import { useViewport } from '../hooks/useViewport.js'
import { layoutFor } from '../lib/layout.js'
import { sceneFor } from '../lib/scene.js'
import { indexFromSlug } from '../lib/slug.js'
import Background from './Background.jsx'
import Bottle from './Bottle.jsx'
import CloseButton from './CloseButton.jsx'
import IngredientImage from './IngredientImage.jsx'
import Panel from './Panel.jsx'

// Pantalla del modo desplegado (RF-03, RF-04, RF-06, RF-07). La coreografía de la transición se
// deriva de `navigation.phase` (design §4.11), con COLLAPSE_TO_CENTER_MS como única constante:
//  - t = 0 (`leaving`): la botella gira de frente a espaldas, el ingrediente sale (fade y zoom) y el
//    fondo hace el crossfade hacia el de la fragancia destino. El panel no se mueve todavía.
//  - t = 500 (`entering`, el índice ya cambió): la etiqueta cambia con la botella de espaldas y ésta
//    termina el giro; entran el ingrediente y el panel nuevos (el panel viejo se desmonta).
export default function ExpandedView({ assets, fragrances, initialSlug, onCloseExpanded }) {
  const viewport = useViewport()
  const navigation = useNavigation({
    initialIndex: indexFromSlug(fragrances, initialSlug),
    count: fragrances.length,
    onClose: onCloseExpanded,
  })
  const index = navigation.index
  const fragrance = fragrances[index]
  const { phase } = navigation
  const bottleRef = useRef(null)
  const previousPhase = useRef(phase)
  const labelUrl = assets.labels[fragrance.slug] ?? assets.labels.default
  // El fondo cruza hacia el destino desde t = 0, antes de que cambie el índice.
  const backgroundIndex = navigation.pendingIndex ?? index

  useEffect(() => {
    const previous = previousPhase.current
    previousPhase.current = phase
    if (previous === phase) return // sólo cambió la etiqueta (reinicio), no hay transición
    if (phase === 'leaving') bottleRef.current?.spinOut()
    else if (phase === 'entering') bottleRef.current?.swapAndSpinIn(labelUrl)
    // De `leaving` directo a `idle` es una transición cancelada (RF-07.4): ✕ o reinicio.
    else if (previous === 'leaving') bottleRef.current?.cancelSpin()
  }, [phase, labelUrl])

  const style = {
    '--fs-label-transition-ms': `${LABEL_TRANSITION_MS}ms`,
    '--fs-background-transition-ms': `${BACKGROUND_TRANSITION_MS}ms`,
    '--fs-word-fade-ms': `${WORD_FADE_MS}ms`,
  }

  // Hasta tener el viewport (servidor y primer render) sólo se muestra lo que no depende del layout.
  let items = null
  if (viewport) {
    const layout = layoutFor(viewport.width, viewport.height)
    const scene = sceneFor(index, layout, fragrances)
    style['--fs-title-font-size'] = `${layout.titleFontSizePx}px`
    style['--fs-ingredient-font-size'] = `${layout.ingredientFontSizePx}px`

    // La botella va última en el DOM, así queda al frente de la imagen de ingrediente.
    items = (
      <>
        <IngredientImage
          src={assets.ingredients[fragrance.slug]}
          x={scene.ingredient.x}
          y={scene.ingredient.y}
          height={scene.ingredient.height}
          stretch={scene.ingredient.stretch}
          hidden={phase === 'leaving'}
        />
        <Panel
          key={index}
          title={scene.title}
          ingredientsLine={scene.ingredientsLine}
          enterDirection={phase === 'entering' ? navigation.direction : null}
        />
        <Bottle
          ref={bottleRef}
          x={scene.product.x}
          y={scene.product.y}
          size={scene.product.size}
          slug={fragrance.slug}
          name={fragrance.name}
          modelUrl={assets.model}
          labelUrl={labelUrl}
          posterSrc={assets.posters[fragrance.slug]}
        />
      </>
    )
  }

  return (
    <div className="fs-stage" style={style}>
      <Background src={assets.backgrounds[backgroundIndex % assets.backgrounds.length]} />
      <div className="fs-overlay" aria-hidden="true" />
      <div className="fs-content" aria-hidden="true">
        {items}
      </div>
      <CloseButton onClick={navigation.close} />
    </div>
  )
}
