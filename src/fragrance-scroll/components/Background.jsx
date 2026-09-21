// Capa de fondo (RF-02.3). Un solo nodo por ahora, ya visible y sin transición.
export default function Background({ src }) {
  return (
    <div className="fs-bg-layer" aria-hidden="true">
      <div className="fs-bg" style={{ backgroundImage: `url("${src}")`, opacity: 1 }} />
    </div>
  )
}
