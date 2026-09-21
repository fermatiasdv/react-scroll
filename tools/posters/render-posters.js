// AJUSTE-11: herramienta que genera los pósters de la botella. Ver docs/ajustes.md.
//
// Página de desarrollo (RF-10.4): con el mismo BottleRig del desplegado renderiza cada fragancia de
// frente (yaw 0) sobre fondo transparente y descarga `<slug-sin-guiones>.webp`. El cuadro es
// cuadrado, del mismo lado que el canvas del desplegado, así el póster se superpone sin diferencia
// (RF-10.2). Los archivos se guardan a mano en `public/fragrance-scroll/posters/`.
import { DEFAULT_ASSETS } from '../../src/fragrance-scroll/config/assets.js'
import { FRAGRANCES } from '../../src/fragrance-scroll/data/fragrances.js'
import { BottleRig } from '../../src/fragrance-scroll/three/BottleRig.js'

const POSTER_SIZE = 1024 // px de alto (y de ancho: es el cuadro del canvas)
const WEBP_QUALITY = 0.95
const DOWNLOAD_GAP_MS = 300 // entre descargas, para que el navegador no las agrupe ni las bloquee

const canvas = document.getElementById('canvas')
const posterImg = document.getElementById('poster')
const stage = document.getElementById('stage')
const statusEl = document.getElementById('status')
const listEl = document.getElementById('list')
const downloadAllButton = document.getElementById('download-all')

// Igual que las etiquetas de `assets.js`: los nombres de archivo van sin guiones bajos.
const fileName = (fragrance) => `${fragrance.slug.replaceAll('_', '')}.webp`
// Igual que ExpandedView: la etiqueta se resuelve por slug y cae en `default`.
const labelUrl = (fragrance) => DEFAULT_ASSETS.labels[fragrance.slug] ?? DEFAULT_ASSETS.labels.default
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const setStatus = (text) => {
  statusEl.textContent = text
}

let rig = null
let current = 0
let busy = false

// Renderiza la fragancia de frente y devuelve el WebP. `toBlob` se llama en la misma tarea que el
// dibujo: el buffer de WebGL sólo es válido hasta que el navegador compone el frame.
function renderBlob(fragrance) {
  return rig.setLabel(labelUrl(fragrance)).then(() => {
    rig.setYaw(0)
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.type === 'image/webp') resolve(blob)
          else reject(new Error('el navegador no generó un WebP'))
        },
        'image/webp',
        WEBP_QUALITY,
      )
    })
  })
}

function save(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// Deja el canvas y el póster guardado (si ya está en `assets.posters`) de la fragancia elegida.
async function preview(index) {
  current = index
  const fragrance = FRAGRANCES[index]
  await rig.setLabel(labelUrl(fragrance))
  rig.setYaw(0)
  const src = DEFAULT_ASSETS.posters[fragrance.slug]
  posterImg.hidden = !src
  if (src) posterImg.src = src
  listEl.querySelectorAll('li').forEach((li, i) => li.classList.toggle('current', i === index))
  setStatus(
    src
      ? `Viendo ${fragrance.name}.`
      : `Viendo ${fragrance.name}. Todavía no hay póster guardado en assets.posters para comparar.`,
  )
}

function setBusy(value) {
  busy = value
  downloadAllButton.disabled = value
  document.querySelectorAll('#list button').forEach((button) => {
    button.disabled = value
  })
}

async function downloadOne(index) {
  const fragrance = FRAGRANCES[index]
  setStatus(`Generando ${fileName(fragrance)}…`)
  save(await renderBlob(fragrance), fileName(fragrance))
  setStatus(`Descargado ${fileName(fragrance)}.`)
}

// Corre una acción exclusiva y, al terminar, vuelve a dejar el canvas en la fragancia elegida.
async function run(action) {
  if (busy) return
  setBusy(true)
  try {
    await action()
    await preview(current)
  } catch (error) {
    setStatus(`Error: ${error.message}`)
  } finally {
    setBusy(false)
  }
}

function buildList() {
  FRAGRANCES.forEach((fragrance, index) => {
    const item = document.createElement('li')
    const name = document.createElement('span')
    name.textContent = `${index + 1}. ${fragrance.name}`
    const view = document.createElement('button')
    view.type = 'button'
    view.textContent = 'Ver'
    view.addEventListener('click', () => run(() => preview(index)))
    const download = document.createElement('button')
    download.type = 'button'
    download.textContent = `Descargar ${fileName(fragrance)}`
    download.addEventListener('click', () => run(() => downloadOne(index)))
    item.append(name, view, download)
    listEl.appendChild(item)
  })
}

async function downloadAll() {
  for (let i = 0; i < FRAGRANCES.length; i += 1) {
    await downloadOne(i)
    await sleep(DOWNLOAD_GAP_MS)
  }
  setStatus(`Descargados los ${FRAGRANCES.length} pósters. Guardalos en public/fragrance-scroll/posters/.`)
}

async function init() {
  buildList()
  downloadAllButton.addEventListener('click', () => run(downloadAll))
  document.querySelectorAll('input[name="view"]').forEach((input) => {
    input.addEventListener('change', () => {
      stage.dataset.view = input.value
    })
  })

  setStatus('Cargando la botella…')
  rig = await BottleRig.create(canvas, {
    modelUrl: DEFAULT_ASSETS.model,
    size: POSTER_SIZE,
    pixelRatio: 1,
    labelUrl: labelUrl(FRAGRANCES[0]),
  })
  setBusy(false)
  await preview(0)
}

setBusy(true)
init().catch((error) => setStatus(`Error: ${error.message}`))
