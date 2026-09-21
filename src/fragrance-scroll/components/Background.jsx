import { useState } from 'react'

// Capa de fondo (RF-02.3, RF-07.1): dos nodos que se turnan los roles de entrante y saliente, como
// `transitionBackground` de L:scroll-styles.js. Cuando cambia `src`, el nodo inactivo (que ya está en
// opacidad 0) toma la imagen nueva y sube a 1 mientras el otro baja a 0: se anima sólo `opacity`, nunca
// `transform`. La duración sale de --fs-background-transition-ms (ver .fs-bg).
export default function Background({ src }) {
  const [state, setState] = useState({ srcs: [src, null], active: 0 })

  let current = state
  if (src !== state.srcs[state.active]) {
    const next = 1 - state.active
    const srcs = [...state.srcs]
    srcs[next] = src
    current = { srcs, active: next }
    setState(current)
  }

  return (
    <div className="fs-bg-layer" aria-hidden="true">
      {current.srcs.map((source, i) => (
        <div
          key={i}
          className="fs-bg"
          style={{
            backgroundImage: source ? `url("${source}")` : undefined,
            opacity: i === current.active ? 1 : 0,
          }}
        />
      ))}
    </div>
  )
}
