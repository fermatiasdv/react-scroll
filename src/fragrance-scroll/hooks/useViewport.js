import { useEffect, useState } from 'react'

// Tamaño del viewport (RF-03.5). Devuelve `null` en el servidor y en el primer render del cliente,
// así el HTML hidrata igual (RNF-02); después devuelve `{ width, height }`. Ante un `resize` se
// actualiza a lo sumo una vez por frame, como `onResize` de L:scroll-motor.js.
export function useViewport() {
  const [viewport, setViewport] = useState(null)

  useEffect(() => {
    let frame = null

    // Como `viewportSize` de L:scroll-viewport.js: el ancho descuenta la barra de scroll.
    const measure = () => {
      const width = document.documentElement.clientWidth
      const height = window.innerHeight
      // Mismo objeto si no cambió nada, para no re-renderizar.
      setViewport((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }))
    }

    const onResize = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        measure()
      })
    }

    measure()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  return viewport
}
