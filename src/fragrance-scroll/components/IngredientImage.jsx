import { useEffect, useRef, useState } from 'react'

// Razón ancho/alto natural de la imagen, o null si todavía no cargó.
function naturalRatio(img) {
  return img && img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null
}

// Imagen fija de ingrediente (RF-03.4), como `createImageElement` de L:scroll-styles.js: el alto
// es el de la botella y el ancho sale del aspect ratio real. Con `stretch` (Painkiller) el ancho
// se calcula con la razón natural de la imagen; hasta medirla queda en `auto`.
export default function IngredientImage({ src, x, y, height, stretch }) {
  const imgRef = useRef(null)
  // Se guarda junto con su `src`, para no arrastrar la razón de otra imagen.
  const [measured, setMeasured] = useState(null)

  const measure = () => {
    const ratio = naturalRatio(imgRef.current)
    if (ratio) setMeasured({ src, ratio })
  }

  // La imagen puede estar ya cargada al hidratar, y entonces `onLoad` no dispara.
  useEffect(() => {
    const ratio = stretch ? naturalRatio(imgRef.current) : null
    if (ratio) setMeasured({ src, ratio })
  }, [src, stretch])

  const style = { left: x, top: y, opacity: 1, height, width: 'auto', maxWidth: 'none', maxHeight: 'none' }
  if (stretch) {
    const { scaleX = 1, scaleY = 1 } = stretch
    style.height = height * scaleY
    if (measured?.src === src) style.width = height * measured.ratio * scaleX
  }

  return (
    <img
      ref={imgRef}
      className="fs-item fs-image"
      src={src}
      alt=""
      style={style}
      onLoad={stretch ? measure : undefined}
    />
  )
}
