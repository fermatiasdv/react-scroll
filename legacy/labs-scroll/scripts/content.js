/** Arma CONFIG.content a partir de las Fragancia<Nombre> de constants.js. */
import {
  FraganciaRebellious,
  FraganciaForbiddenFlower,
  FraganciaWonderOfTheWorld,
  FraganciaPainkiller,
  FraganciaJaggedEdge,
  FraganciaCrimsonDesert,
  FraganciaGlitterati,
  FraganciaEcstasy,
  FraganciaEpicurean,
  FraganciaLondonLegend,
} from './constants.js';
import { buildTitlePanelItems } from './panel.js';
import { layoutFor, panelLineY, INGREDIENT_LINE_COUNT } from './layout.js';

/** Todas las fragancias mapeadas, en el orden del listado original (idx 1 a 10). */
const ALL_FRAGRANCIAS = [
  FraganciaRebellious,
  FraganciaForbiddenFlower,
  FraganciaWonderOfTheWorld,
  FraganciaPainkiller,
  FraganciaJaggedEdge,
  FraganciaCrimsonDesert,
  FraganciaGlitterati,
  FraganciaEcstasy,
  FraganciaEpicurean,
  FraganciaLondonLegend,
];

/** boxClass disponibles (ver index.html), asignadas cíclicamente por orden de idx. */
const BOX_CLASSES = ['box-blue', 'box-red', 'box-green', 'box-orange', 'box-violet'];

/** Fondos de imagen reales, indexados por posición (0 = primera caja); reemplazan a boxClass cuando están definidos. */
const BOX_BACKGROUNDS = ['assets/backgrounds/1.jpg',"assets/backgrounds/BG1.png","assets/backgrounds/BG3.png", "assets/backgrounds/BG4.png" ];

/**
 * Caja de prueba, agregada al final de todo (ver buildContent): mismo producto/botella y misma
 * animación de siempre, pero en vez de "explotar" varias imágenes de ingrediente como una caja
 * normal (ver buildFraganciaBox), muestra un único asset fijo como reemplazo directo de los
 * ingredientes tradicionales. Pedido del usuario 2026-09-10: "esta debe aparecer como el reemplazo
 * de los ingredientes tradicionales... debe cumplir con los tiempos de salida, por ej. no tendrá ni
 * la traslación" (ver buildAlmondTestItem/applyAlmondTestLayout, más abajo, sobre cómo se logra
 * eso).
 *
 * Ronda 3 (mismo día, después): el asset cambió de una animación webp de una sola almendra
 * (almonds_1s_transparent.webp) a esta imagen estática (almendrasdistribuidas.png) — dos grupos de
 * almendras ya distribuidos a los costados izquierdo y derecho, con un hueco vacío al medio.
 * Pedido del usuario: "reemplazala por [esta imagen]... debe quedar la imágen centrada en la
 * botella. Está preparada para que ningún ingrediente quede por encima" — el hueco vacío al medio
 * de la imagen es justo del ancho de la botella, así que centrándola sin rotar ni desplazar (igual
 * que antes) la botella cae en ese hueco y las almendras quedan flanqueándola a los costados, sin
 * que ninguna se superponga a su silueta. Por eso esta ronda también SACÓ la rotación fija de 35°
 * de la ronda 2 (ver ALMOND_TEST_ROTATION_DEG, ya no existe): esa imagen anterior (una sola
 * almendra) se rotaba a propósito por variedad, pero esta nueva imagen ya viene compuesta y
 * simétrica — rotarla correría el hueco vacío del centro y algún grupo de almendras terminaría
 * tapado por la botella o mucho más lejos que el otro, exactamente lo que el usuario pidió evitar.
 */
// const ALMOND_TEST_IMAGE = './assets/ingredients/recortadas/ForbiddenFlower3.png';
const ALMOND_TEST_IMAGE = './assets/ingredients/recortadas/pruebapaint.png';

/** Título mostrado en el panel de la caja de prueba. */
const ALMOND_TEST_TITLE = 'Prueba — Almendra';

/** Texto de la fila de ingredientes del panel de la caja de prueba. */
const ALMOND_TEST_INGREDIENT_LABEL = 'Almendra';

/** Slug de URL de la caja de prueba (ver fragranceSlug en las cajas normales). */
const ALMOND_TEST_SLUG = 'almond_test';

/**
 * Fragancias REALES cuya explosión de imágenes de ingrediente (ver buildFraganciaBox) se reemplaza
 * por un único asset fijo, con el mismo mecanismo que la caja de prueba de arriba: sin traslación,
 * con fade+zoom in/out, sizeado al alto real de la botella (ver buildFixedIngredientItem,
 * applyAlmondTestLayout — reusada tal cual, es agnóstica a qué imagen le llega). El panel de título
 * + fila de ingredientes (buildTitlePanelItems) no se toca: sigue mostrando el nombre de la
 * fragancia y sus ingredientes de siempre, sólo cambia el "estallido" de imágenes de fondo.
 *
 * Pedido del usuario 2026-09-10: "En la pantalla que le corresponde a Pain Killer agrega
 * assets/ingredients/recortadas/Painkiller.png en lugar de los ingredientes que existen
 * actualmente" + lo mismo para Forbidden Flower con assets/ingredients/recortadas/ForbiddenFlower3.png.
 *
 * Clave = fragancia.nombre tal cual está escrito en constants.js (ojo: es "Painkiller", una sola
 * palabra, no "Pain Killer").
 *
 * Cada entrada puede traer, además de `image`, un `stretch: {scaleX, scaleY}` opcional (pedido del
 * usuario 2026-09-14: Painkiller.png más ancha y más alta que su tamaño normal, ajustado de nuevo el
 * 2026-09-15 para separar más los ingredientes de la botella — ver `stretch` en
 * buildFixedIngredientItem/createImageElement en styles.js). El centro sigue siendo
 * xi/yi (el centro de la página, ver applyAlmondTestLayout): al ser sólo width/height explícitos
 * sobre un elemento ya anclado con `translate(-50%, -50%)`, estirarlo no lo descentra.
 *
 * Ronda 2026-09-15: pedido del usuario de extender este mecanismo a las 8 fragancias que todavía
 * usaban la explosión de ingredientes normal. Todavía no hay arte final para ellas, así que cada
 * una apunta a un archivo placeholder (copia de Painkiller.png, nombrado como la fragancia — ver
 * los identificadores de assets/products/recortadas en constants.js líneas 17-26 para la ortografía
 * exacta de cada nombre) hasta que se suba la imagen real de cada una.
 */
const FIXED_INGREDIENT_IMAGE_OVERRIDES = {
  Rebellious: { image: './assets/ingredients/recortadas/Rebellious.png' },
  'Forbidden Flower': { image: './assets/ingredients/recortadas/ForbiddenFlower3.png' },
  'Wonder of the World': { image: './assets/ingredients/recortadas/WonderOfTheWorld.png' },
  Painkiller: {
    image: './assets/ingredients/recortadas/Painkiller.png',
    stretch: { scaleX: 2, scaleY: 1.2 },
  },
  'Jagged Edge': { image: './assets/ingredients/recortadas/JaggedEdge.png' },
  'Crimson Desert': { image: './assets/ingredients/recortadas/CrimsonDesert.png' },
  Glitterati: { image: './assets/ingredients/recortadas/Glitterati.png' },
  Ecstasy: { image: './assets/ingredients/recortadas/Ecstasy.png' },
  Epicurean: { image: './assets/ingredients/recortadas/Epicurean.png' },
  'London Legend': { image: './assets/ingredients/recortadas/LondonLegend.png' },
};

/**
 * Convierte el nombre legible de una fragancia en el slug que va en la URL.
 * @param {string} nombre - Nombre legible de la fragancia.
 */
function slugify(nombre) {
  return nombre.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Coloca (o recoloca) el item del producto en el centro exacto del viewport.
 * @param {object} item - Item del producto (isProduct: true).
 * @param {object} layout - Layout de layoutFor.
 */
function applyProductLayout(item, layout) {
  item.size = layout.product.size;
  item.xi = layout.cx;
  item.yi = layout.cy;
  return item;
}

/**
 * Calcula tamaño y posición del item fijo de la caja de prueba (ver ALMOND_TEST_IMAGE).
 *
 * Pedido del usuario 2026-09-10, ronda 2: "que salga del centro de la botella, que no genere
 * traslación (por lo que el punto de inicio y el punto de llegada serán el mismo: el centro de la
 * botella)". Por eso acá xi/yi/xf/yf van directo al centro del stage — el mismo punto donde se para
 * el producto, ver applyProductLayout. Con xf===xi/yf===yi, finalOffset (styles.js) sigue dando siempre
 * {dx:0, dy:0}, así que el item sigue sin trasladarse nunca, ni al entrar ni al salir (ver
 * [[botella-giro-transicion]]/collapseIngredientsToCenter en styles.js para cómo entra/sale con
 * fade + zoom en vez de traslación).
 *
 * Sin rotación (ronda 3, ver el comentario de ALMOND_TEST_IMAGE): a diferencia de la ronda 2, no se
 * le asigna ningún `item.angle` — la imagen actual ya viene compuesta simétrica (dos grupos de
 * almendras a los costados con un hueco vacío al medio, del ancho de la botella) y rotarla
 * arruinaría ese encaje.
 *
 * Ronda 4 (mismo día, después), pedido del usuario: "necesito que el alto de la botella coincida
 * con el alto de la imagen... y el ancho que sea proporcional al alto, no la deformes" — dejó de
 * usarse el multiplicador fijo sobre el tope de ingrediente (ALMOND_TEST_SIZE_MULTIPLIER, ya no
 * existe) y ahora `item.size` guarda directamente el alto real de la botella en px:
 * `layout.product.halfH * 2` (halfH ya es la mitad de ese alto real, medido por el alfa del GLB —
 * ver PRODUCT_CONTENT_Y en layout.js — no el lado del cuadro cuadrado que ocupa su canvas). Este
 * item deja de ser cuadrado: createImageElement (styles.js) reconoce `item.testFixed` y usa este
 * `size` como ALTO del <img>, dejando el ancho en 'auto' para que el navegador lo calcule
 * proporcional al aspect ratio real de la imagen — nunca se fuerza un ancho, así no se deforma.
 * @param {object} item - Item a completar (debe traer image; se le agregan size/xi/yi/xf/yf).
 * @param {object} layout - Layout de layoutFor (layout.js).
 */
function applyAlmondTestLayout(item, layout) {
  item.size = Math.round(layout.product.halfH * 2);
  item.xi = layout.cx;
  item.yi = layout.cy;
  item.xf = layout.cx;
  item.yf = layout.cy;

  return item;
}

/**
 * Arma el único item de imagen fijo que reemplaza la explosión de ingredientes de una caja — lo usa
 * tanto la caja de prueba (con ALMOND_TEST_IMAGE) como cualquier fragancia real listada en
 * FIXED_INGREDIENT_IMAGE_OVERRIDES (ver buildFraganciaBox). applyAlmondTestLayout es agnóstica a
 * qué imagen le llega, así que no hizo falta tocarla para generalizar esto.
 * @param {string} image - Asset a mostrar en reemplazo de los ingredientes.
 * @param {object} layout - Layout de layoutFor.
 * @param {{scaleX: number, scaleY: number}} [stretch] - Estiramiento opcional por ejes, ver
 *   FIXED_INGREDIENT_IMAGE_OVERRIDES/createImageElement (styles.js).
 */
function buildFixedIngredientItem(image, layout, stretch) {
  const item = applyAlmondTestLayout({ image, testFixed: true }, layout);
  if (stretch) item.stretch = stretch;
  return item;
}

/**
 * Arma la caja de prueba completa: mismo panel de título + fila de ingredientes y mismo producto
 * que una caja normal (ver buildFraganciaBox), pero con un único item de imagen fijo en vez de la
 * explosión de imágenes de ingrediente (ver buildAlmondTestItem).
 * @param {object} layout - Layout de layoutFor.
 * @param {string} boxClass - Clase de fondo de la caja (ver BOX_CLASSES).
 * @param {string} [bgImage] - Ruta de imagen de fondo (ver BOX_BACKGROUNDS).
 */
function buildAlmondTestBox(layout, boxClass, bgImage) {
  const producto = applyProductLayout(
    { isProduct: true, animation: { effect: 'fade', when: 'enter' } },
    layout,
  );
  producto.fragranceName = ALMOND_TEST_TITLE;
  producto.fragranceSlug = ALMOND_TEST_SLUG;

  const display = [
    producto,
    {
      labelText: ALMOND_TEST_TITLE,
      xi: layout.cx,
      yi: panelLineY(0, layout),
      variant: 'title',
      directional: true,
      panelLine: 0,
    },
    {
      labelText: ALMOND_TEST_INGREDIENT_LABEL,
      xi: layout.cx,
      yi: panelLineY(INGREDIENT_LINE_COUNT, layout),
      variant: 'ingredient',
      directional: true,
      panelLine: INGREDIENT_LINE_COUNT,
    },
    buildFixedIngredientItem(ALMOND_TEST_IMAGE, layout),
  ];

  return {
    boxClass,
    bgImage,
    fragranceSlug: ALMOND_TEST_SLUG,
    animation: { effect: 'traslation', when: 'enter' },
    display,
  };
}

/**
 * Arma la caja completa de una fragancia: producto, panel de título + ingredientes, y el único item
 * fijo de imagen que reemplaza a los ingredientes (ver FIXED_INGREDIENT_IMAGE_OVERRIDES/
 * buildFixedIngredientItem) — todas las fragancias tienen una entrada ahí.
 * @param {object} fragancia - Entrada Fragancia<Nombre>.
 * @param {string} boxClass - Clase de fondo de la caja (ver BOX_CLASSES).
 * @param {object} layout - Layout de layoutFor.
 * @param {string} [bgImage] - Ruta de imagen de fondo (ver BOX_BACKGROUNDS); si está presente, motor.js la usa en vez de boxClass.
 */
function buildFraganciaBox(fragancia, boxClass, layout, bgImage) {
  const producto = applyProductLayout(
    { isProduct: true, animation: { effect: 'fade', when: 'enter' } },
    layout,
  );

  const display = [producto, ...buildTitlePanelItems(fragancia, layout)];
  producto.image = fragancia.fragancia;
  producto.fragranceName = fragancia.nombre;
  // Mismo slug que fragranceSlug de la caja (ver el return, más abajo): lo usa el ancla de
  // Google de prueba sobre la botella (ver bottleLinkHref en styles.js).
  producto.fragranceSlug = slugify(fragancia.nombre);

  const override = FIXED_INGREDIENT_IMAGE_OVERRIDES[fragancia.nombre];
  display.push(buildFixedIngredientItem(override.image, layout, override.stretch));

  return {
    boxClass,
    bgImage,
    fragranceSlug: slugify(fragancia.nombre),
    animation: { effect: 'traslation', when: 'enter' },
    display,
  };
}

/**
 * Arma CONFIG.content: una caja por cada fragancia con imagen de producto, ordenadas por idx, más
 * la caja de prueba (ver buildAlmondTestBox) al final de todo.
 */
export function buildContent() {
  const layout = layoutFor(window.innerWidth, window.innerHeight);

  const boxes = ALL_FRAGRANCIAS
    .filter((fragancia) => fragancia.fragancia !== '')
    .sort((a, b) => a.idx - b.idx)
    .map((fragancia, i) => buildFraganciaBox(fragancia, BOX_CLASSES[i % BOX_CLASSES.length], layout, BOX_BACKGROUNDS[i % BOX_BACKGROUNDS.length]));

  const testIndex = boxes.length;
  boxes.push(buildAlmondTestBox(
    layout,
    BOX_CLASSES[testIndex % BOX_CLASSES.length],
    BOX_BACKGROUNDS[testIndex % BOX_BACKGROUNDS.length],
  ));

  return boxes;
}

/**
 * Recalcula, sobre el contenido ya armado y sin volver a tirar ningún dado,
 * todas las posiciones y tamaños contra el viewport actual.
 * @param {Array} content - Cajas ya armadas (CONFIG.content), mutadas en el lugar.
 */
export function relayoutContent(content) {
  const layout = layoutFor(window.innerWidth, window.innerHeight);

  content.forEach((box) => {
    box.display.forEach((item) => {
      if (item.isProduct) {
        applyProductLayout(item, layout);
      } else if ('panelLine' in item) {
        item.xi = layout.cx;
        item.yi = panelLineY(item.panelLine, layout);
      } else if (item.testFixed) {
        applyAlmondTestLayout(item, layout);
      }
    });
  });

  return content;
}
