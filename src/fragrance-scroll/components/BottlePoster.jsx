// Póster de la botella (RF-10.2): llena el cuadro que lo contiene, que se posiciona como el canvas.
const FILL = { display: 'block', width: '100%', height: '100%' }

export default function BottlePoster({ src }) {
  if (src) return <img src={src} alt="" style={FILL} />

  // AJUSTE-11: placeholder hasta que existan los pósters. Ver docs/ajustes.md.
  return <div style={{ ...FILL, border: '2px dashed rgb(255 255 255 / 0.6)' }} />
}
