import { BACKGROUND_TRANSITION_MS, LABEL_TRANSITION_MS, WORD_FADE_MS } from '../config/timing.js'
import { useViewport } from '../hooks/useViewport.js'
import { layoutFor } from '../lib/layout.js'
import { sceneFor } from '../lib/scene.js'
import { indexFromSlug } from '../lib/slug.js'
import Background from './Background.jsx'
import Bottle from './Bottle.jsx'
import CloseButton from './CloseButton.jsx'
import IngredientImage from './IngredientImage.jsx'
import Panel from './Panel.jsx'

// Pantalla del modo desplegado (RF-03, RF-04), por ahora sin navegación: una sola fragancia.
export default function ExpandedView({ assets, fragrances, initialSlug, onCloseExpanded }) {
  const viewport = useViewport()
  const index = indexFromSlug(fragrances, initialSlug)
  const fragrance = fragrances[index]

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
        />
        <Panel title={scene.title} ingredientsLine={scene.ingredientsLine} />
        <Bottle
          x={scene.product.x}
          y={scene.product.y}
          size={scene.product.size}
          slug={fragrance.slug}
          name={fragrance.name}
          modelUrl={assets.model}
          labelUrl={assets.labels[fragrance.slug] ?? assets.labels.default}
          posterSrc={assets.posters[fragrance.slug]}
        />
      </>
    )
  }

  return (
    <div className="fs-stage" style={style}>
      <Background src={assets.backgrounds[index % assets.backgrounds.length]} />
      <div className="fs-overlay" aria-hidden="true" />
      <div className="fs-content" aria-hidden="true">
        {items}
      </div>
      <CloseButton onClick={onCloseExpanded} />
    </div>
  )
}
