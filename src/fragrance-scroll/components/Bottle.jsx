import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { COLLAPSE_TO_CENTER_MS } from '../config/timing.js'
import { BottleRig } from '../three/BottleRig.js'
import BottlePoster from './BottlePoster.jsx'

// AJUSTE-03: link de prueba a Google. Ver docs/ajustes.md.
const FRAGRANCE_QUERY_PARAM = 'fragrance'

// AJUSTE-03: link de prueba a Google. Ver docs/ajustes.md.
// Destino del link sobre la botella (RF-05.6). Es el único lugar donde se resuelve la URL.
function bottleLinkHref(slug) {
  const url = new URL('https://www.google.com/')
  if (slug) url.searchParams.set(FRAGRANCE_QUERY_PARAM, slug)
  return url.toString()
}

const FILL = { display: 'block', width: '100%', height: '100%' }
const POSTER_LAYER = { position: 'absolute', inset: 0 }

// Botella de la pantalla desplegada (RF-05.3, D-01): un solo canvas y un solo BottleRig por montaje.
// Cambiar de fragancia sólo cambia la textura de la etiqueta (`labelUrl`), sin recrear nada. El
// póster (RF-10.3) queda encima del canvas hasta que éste pintó su primer frame. Es el link de la
// botella (`.fs-image-product`), posicionado y dimensionado como el póster (RF-10.2).
//
// Por `ref` expone los giros de la transición (RF-07): medio giro de frente a espaldas al salir
// (`spinOut`, easeInCubic) y de espaldas a frente al entrar (`swapAndSpinIn`, easeOutCubic), con la
// misma duración para que la velocidad angular coincida en el empalme y no haya frenazo.
//
// Carga inicial (RF-07.5): apenas el canvas pinta su primer frame, y cada vez que cambia `introKey`
// (el rearmado por resize), da una vuelta completa de frente a frente. Al 80% del giro llama a
// `onIntroReveal(introKey)`, que es cuando aparece el ingrediente.
const Bottle = forwardRef(function Bottle(
  { x, y, size, slug, name, modelUrl, labelUrl, posterSrc, introKey, onIntroReveal },
  ref,
) {
  const hostRef = useRef(null)
  const rigRef = useRef(null)
  const latest = useRef({ labelUrl, size, introKey })
  const onIntroRevealRef = useRef(onIntroReveal)
  // Modelo para el que el canvas ya pintó su primer frame; si cambia el modelo, vuelve el póster.
  const [readyModelUrl, setReadyModelUrl] = useState(null)
  const ready = readyModelUrl === modelUrl

  useImperativeHandle(ref, () => ({
    // t = 0: de frente a espaldas.
    spinOut() {
      rigRef.current?.spin({ from: 0, to: Math.PI, durationMs: COLLAPSE_TO_CENTER_MS, easing: 'in' })
    },
    // t = 500: la etiqueta cambia con la botella de espaldas y termina el giro hasta quedar de frente.
    // No espera a la textura: el giro tiene que empalmar con el de salida; la etiqueta recién se ve
    // pasados los 270°.
    swapAndSpinIn(nextLabelUrl) {
      const rig = rigRef.current
      if (!rig) return
      rig.setLabel(nextLabelUrl)
      rig.spin({ from: Math.PI, to: Math.PI * 2, durationMs: COLLAPSE_TO_CENTER_MS, easing: 'out' })
    },
    // Transición cancelada (RF-07.4): corta el giro y deja la botella de frente.
    cancelSpin() {
      rigRef.current?.setYaw(0)
    },
  }), [])

  // Va antes que el efecto de creación, así al montar ya tiene los valores vigentes.
  useEffect(() => {
    latest.current = { labelUrl, size, introKey }
    onIntroRevealRef.current = onIntroReveal
  })

  useEffect(() => {
    // El canvas se crea acá y no en el JSX: `dispose()` deja su contexto WebGL perdido, y el
    // StrictMode monta el efecto dos veces sobre el mismo nodo. Así cada montaje recibe uno limpio.
    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    hostRef.current.appendChild(canvas)

    let cancelled = false
    let rig = null

    // La creación se difiere un microtask: si el cleanup corre enseguida (StrictMode), no se llega
    // a crear un renderer que habría que descartar.
    Promise.resolve()
      .then(() => {
        if (cancelled) return null
        const initial = latest.current
        return BottleRig.create(canvas, {
          modelUrl,
          size: Math.round(initial.size),
          labelUrl: initial.labelUrl,
        }).then((created) => ({ created, initial }))
      })
      .then((result) => {
        if (!result) return
        if (cancelled) {
          result.created.dispose()
          return
        }
        rig = result.created
        rigRef.current = rig
        // Lo que haya cambiado mientras cargaba.
        const current = latest.current
        if (current.labelUrl !== result.initial.labelUrl) rig.setLabel(current.labelUrl)
        if (Math.round(current.size) !== Math.round(result.initial.size)) rig.setSize(Math.round(current.size))
        rig.onFirstFrame(() => {
          if (!cancelled) setReadyModelUrl(modelUrl)
        })
      })
      .catch(() => {
        // Sin WebGL o con el modelo sin cargar, el póster se queda en su lugar y el ingrediente no
        // espera a un giro que no va a ocurrir.
        if (!cancelled) onIntroRevealRef.current?.(latest.current.introKey)
      })

    return () => {
      cancelled = true
      rigRef.current = null
      if (rig) rig.dispose()
      canvas.remove()
    }
  }, [modelUrl])

  useEffect(() => {
    rigRef.current?.setLabel(labelUrl)
  }, [labelUrl])

  // Giro de carga (RF-07.5): defaults del rig, o sea una vuelta de SPIN_DURATION_MS con easeInOutCubic
  // y `onReveal` al SPIN_REVEAL_FRACTION. Una transición lo cancela con `spinOut`.
  useEffect(() => {
    if (!ready) return
    rigRef.current?.spin({ onReveal: () => onIntroRevealRef.current?.(introKey) })
  }, [ready, introKey])

  useEffect(() => {
    rigRef.current?.setSize(Math.round(size))
  }, [size])

  return (
    <a
      className="fs-item fs-image fs-image-product"
      href={bottleLinkHref(slug)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      style={{ left: x, top: y, width: size, height: size, opacity: 1 }}
    >
      <div ref={hostRef} style={FILL} />
      {!ready && (
        <div style={POSTER_LAYER}>
          <BottlePoster src={posterSrc} />
        </div>
      )}
    </a>
  )
})

export default Bottle
