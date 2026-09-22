// Sección de relleno (RF-13.1, AJUSTE-05): sólo para el sandbox, simula el resto de la home
// alrededor del bloque colapsado. Equivalente a las `.fake-section` del POC de `labs`.
export default function FillerSection({ eyebrow, title, className }) {
  return (
    <section className={`filler-section ${className}`}>
      <p className="filler-section-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
    </section>
  )
}
