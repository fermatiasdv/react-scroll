import { Fragment } from 'react'
import { WORD_FADE_STAGGER_MS } from '../config/timing.js'

// Una línea de texto (RF-04), partida en palabras como `createLabelElement` de L:scroll-styles.js.
function PanelLine({ line, variant }) {
  const words = line.text.split(' ')
  return (
    <span
      className={`fs-item fs-label fs-label-${variant}`}
      style={{ left: line.x, top: line.y, opacity: 1 }}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span
            className="fs-label-word"
            style={{ transitionDelay: `${i * WORD_FADE_STAGGER_MS}ms`, opacity: 1 }}
          >
            {word}
          </span>
        </Fragment>
      ))}
    </span>
  )
}

// Título arriba y fila de ingredientes abajo (RF-04.1). Recibe los objetos de `sceneFor`.
export default function Panel({ title, ingredientsLine }) {
  return (
    <>
      <PanelLine line={title} variant="title" />
      <PanelLine line={ingredientsLine} variant="ingredient" />
    </>
  )
}
