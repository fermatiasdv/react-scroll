# Diseño técnico

> Define **cómo** se implementa `spec.md`. Cada decisión cita el requisito que cubre. Cambiar este documento requiere aprobación del usuario.

## 1. Decisiones de arquitectura

| # | Decisión | Por qué | Cubre |
|---|---|---|---|
| D-01 | **Botella única persistente:** un canvas y un renderer por pantalla desplegada; al cambiar de fragancia se cambia la textura de la etiqueta. | Elimina por construcción el delay de 2-3 s que tenía el legacy al crear renderers (ver PDF, "Rendimiento WebGL"). El giro de salida y el de entrada pasan a ser una sola botella girando. | RF-05.3, RNF-03 |
| D-02 | three.js **vanilla** (no React Three Fiber), encapsulado en una clase imperativa `BottleRig`, portada casi literal de `L:scroll-bottle.js`. | Los materiales llevaron muchas rondas de ajuste; portarlos literal es de menor riesgo que reescribirlos de forma declarativa. | RF-05 |
| D-03 | La navegación es un **reducer puro** más un hook que maneja timers y listeners. | Las reglas de bloqueo, bordes y salida encolada quedan testeables sin DOM. | RF-06, RF-07 |
| D-04 | Las animaciones DOM usan **transiciones CSS**, disparadas por estado de React. El giro de la botella usa su propio `requestAnimationFrame`. Todo se sincroniza con las mismas constantes de `timing.js`. | No hace falta una librería de animación (RNF-01). | RF-07 |
| D-05 | Modo colapsado **sin WebGL**: usa el póster. | La home no carga three.js. | RF-08.6, RF-10 |
| D-06 | El componente raíz recibe por props todo lo que en Tapcart vendrá de afuera: assets, texto, storage y navegación. | Pasar del sandbox a Tapcart se reduce a cambiar esas props. | RF-13.2, AJUSTE-04, 06 y 09 |
| D-07 | Las funciones puras se portan **literal** y se testean **contra el legacy importado**. | Fidelidad verificable. | RNF-04 |

## 2. Dependencias

| Paquete | Versión | Tipo | Uso |
|---|---|---|---|
| `react`, `react-dom` | `^18.3.1` | dep | UI (ya instalados) |
| `three` | `0.185.1` (fija) | dep | Botella. Es la misma revisión r185 que tiene vendorizada el legacy. |
| `vitest` | `^5` | devDep | Tests |

**No se agrega ninguna otra dependencia** (ni Testing Library, ni jsdom, ni librerías de animación) sin cambiar antes este documento.

## 3. Estructura de carpetas

```
src/
  main.jsx                      # entrada del sandbox (monta <SandboxApp/>)
  sandbox/
    SandboxApp.jsx              # shell del sandbox: secciones de relleno + bloque (AJUSTE-04, 05)
    FillerSection.jsx           # sección de relleno (AJUSTE-05)
    sandbox.css
  fragrance-scroll/             # === componente reutilizable (lo que va a Tapcart) ===
    index.js                    # exports públicos
    FragranceScroll.jsx         # raíz: decide colapsado o desplegado según props
    config/
      assets.js                 # ÚNICO objeto con URLs de assets (RF-02.1, AJUSTE-06)
      timing.js                 # constantes de tiempo y easings (RF-07)
      input.js                  # constantes de gestos y teclas (RF-06)
    data/
      fragrances.js             # las 10 fragancias (RF-01)
    lib/
      layout.js                 # layoutFor, panelLineY (literal de L:scroll-layout.js)
      slug.js                   # slugify, indexFromSlug (RF-01.2, RF-12.2)
      scene.js                  # geometría de los ítems por fragancia (producto, panel, ingrediente)
      navigation.js             # reducer de navegación (D-03)
      storage.js                # interfaz get/set + implementación localStorage (RF-09.3)
      preload.js                # precarga (RF-11)
    hooks/
      useViewport.js            # tamaño del viewport, SSR-safe, rAF-throttled (RF-03.5)
      useNavigation.js          # reducer + timers + listeners de swipe/rueda/teclado (RF-06)
    three/
      BottleRig.js              # clase imperativa: renderer, escena, modelo, etiqueta, giros, tilt
      loadThree.js              # import() dinámico de three + GLTFLoader, cacheado
    components/
      CollapsedView.jsx         # RF-08
      ExpandedView.jsx          # RF-06, RF-07
      Background.jsx            # capa de crossfade de dos nodos (RF-07.1)
      Bottle.jsx                # canvas persistente + póster hasta el primer frame (RF-05, RF-10.3)
      BottlePoster.jsx          # <img> del póster posicionado como el canvas (RF-10.2)
      IngredientImage.jsx       # imagen fija de ingrediente (RF-03.4)
      Panel.jsx                 # título + fila de ingredientes, fade por palabra (RF-04)
      CloseButton.jsx           # ✕ (RF-06.6)
      ShowButton.jsx            # "Show fragrances →" (RF-08.3)
    styles/
      fragrance-scroll.css      # estilos portados de L:section {% stylesheet %}
tests/
  legacy/                       # tests que comparan contra el legacy (RNF-04)
  unit/                         # tests de funciones puras y del reducer
  ssr/                          # renderToString del componente (RNF-02)
tools/
  posters/                      # página de desarrollo que genera los pósters (RF-10.4)
    index.html
    render-posters.js
public/fragrance-scroll/        # assets del sandbox (AJUSTE-06)
```

## 4. Módulos y contratos

### 4.1 `config/assets.js` (RF-02)

```js
export const DEFAULT_ASSETS = {
  model: '/fragrance-scroll/model/bottle.glb',
  labels: { default: '…', rebellious: '…', /* key = slug */ },
  backgrounds: ['…bg-1.jpg', '…bg-2.webp', '…bg-3.webp', '…bg-4.webp'],
  ingredients: { rebellious: '…', /* key = slug */ },
  posters: { rebellious: '…', /* key = slug; se completa en T-3.3 */ },
};
```

- Las claves son el **slug** (`forbidden_flower`), igual que el JSON de `L:section`. Los nombres de archivo van sin guiones bajos (`forbiddenflower.webp`).
- Lleva el comentario `AJUSTE-06`.

### 4.2 `config/timing.js` (RF-04, RF-07)

```js
export const COLLAPSE_TO_CENTER_MS = 500;
export const LOCK_MS = 50;
export const SPIN_DURATION_MS = 2000;
export const SPIN_REVEAL_FRACTION = 0.8;
export const BACKGROUND_TRANSITION_MS = 500;
export const LABEL_TRANSITION_MS = 350;
export const WORD_FADE_MS = 300;
export const WORD_FADE_STAGGER_MS = 60;
export const DIRECTIONAL_ENTER_OFFSET_PX = 48;
export const INGREDIENT_ZOOM_SCALE = 0.5;       // TEST_ITEM_ZOOM_SCALE del legacy
export const easeInCubic = (t) => t * t * t;
export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
```

### 4.3 `config/input.js` (RF-06)

`SWIPE_MIN_DISTANCE_PX = 60`, `SWIPE_DIRECTION_RATIO = 1.2`, `GESTURE_GAP_MS = 250` (AJUSTE-01), `NEXT_KEYS`, `PREV_KEYS` (AJUSTE-01).

### 4.4 `data/fragrances.js` (RF-01)

```js
export const FRAGRANCES = [
  {
    slug: 'rebellious',
    name: 'Rebellious',
    ingredients: ['Saffron', 'Bergamot', 'Caramel'],
    ingredientStretch: null,              // Painkiller: { scaleX: 2, scaleY: 1.2 }
  },
  // … 10 en total, en el orden de idx
];
```

- La etiqueta se resuelve como `assets.labels[slug] ?? assets.labels.default`.
- El fondo se resuelve como `assets.backgrounds[i % assets.backgrounds.length]`.

### 4.5 `lib/layout.js` (RF-03)

- Es la copia **literal** de `L:scroll-layout.js`: mismas constantes, mismos nombres de export (`layoutFor`, `panelLineY`, `PRODUCT_CONTENT_X`, `PRODUCT_CONTENT_Y`, `INGREDIENT_LINE_COUNT`, las fracciones exportadas).
- Sin imports.

### 4.6 `lib/slug.js` (RF-01.2, RF-12)

- `slugify(name)`: la misma expresión que el legacy.
- `indexFromSlug(fragrances, slug)`: devuelve el índice, o `0` si el slug no existe o es inválido.

### 4.7 `lib/scene.js` (RF-03)

`sceneFor(fragranceIndex, layout, fragrances)` devuelve un objeto **inmutable**:

```js
{
  product:    { x, y, size },                       // centro del viewport, layout.product.size
  ingredient: { x, y, height, stretch },            // height = round(layout.product.halfH * 2)
  title:      { text, x, y },                       // panelLineY(0)
  ingredientsLine: { text, x, y },                  // nombres unidos por ' – ', panelLineY(INGREDIENT_LINE_COUNT)
}
```

Reemplaza a `buildContent`/`relayoutContent` del legacy **sin mutación**: ante un resize se vuelve a llamar.

### 4.8 `lib/navigation.js`: reducer (RF-06, RF-07)

```js
state = {
  index: number,                // fragancia actual
  count: number,                // cantidad de fragancias (define cuál es el último borde)
  pendingIndex: number | null,  // destino durante la transición
  phase: 'idle' | 'leaving' | 'entering', // leaving: 0-500 ms; entering: 500-550 ms
  direction: 'down' | 'up' | null,
  queuedExit: -1 | 1 | null,
  navGestureId: number | null,
  closed: boolean,              // true => el hook llama a closeExpanded()
}
```

Acciones:

| Acción | Qué hace |
|---|---|
| `NAVIGATE { direction, gestureId }` | `direction` es `1` (avanzar) o `-1` (retroceder), como en el legacy; `state.direction` sigue siendo `'down'` o `'up'`. La regla completa de `onWheel`/`onKeyDown`/`onTouchMove` del legacy: el bloqueo se chequea **antes** que el borde; en el borde se cierra salvo que sea el mismo gesto; si está bloqueado, `queueExitIfEdgeBound`. |
| `SWAP` (t = 500) | `index = pendingIndex`, `pendingIndex = null`, `phase = 'entering'`. Como el legacy (`L:scroll-motor.js`, `goToIndex`), durante `entering` (50 ms) no se encola una salida. |
| `UNLOCK` (t = 550) | `phase = 'idle'` (no cambia `direction`, para que el panel termine su animación); si hay `queuedExit` y el índice está en ese borde, `closed = true`. |
| `CLOSE` | ✕ o salida inmediata: `closed = true` y se limpia todo lo pendiente. |
| `RESET { index, count }` | Arranque o reapertura en un índice, con la cantidad de fragancias. |

**Sin timers adentro:** el reducer es puro, y los timers viven en `useNavigation`.

### 4.9 `hooks/useNavigation.js` (RF-06, RF-07.3, RF-07.4)

- Monta los listeners `touchstart`/`touchmove` (`passive: false`)/`touchend`/`touchcancel`, `wheel` (`passive: false`, AJUSTE-01) y `keydown` (AJUSTE-01) **sobre el contenedor del modo desplegado o `window`**, con las mismas reglas de `preventDefault` que el legacy.
- Agrupa los gestos por `GESTURE_GAP_MS` en rueda y teclado; en touch, cada `touchstart` abre un gesto nuevo.
- Programa `SWAP` a los `COLLAPSE_TO_CENTER_MS` y `UNLOCK` a los `+LOCK_MS`. Cancela todos los timers al desmontar o al cerrar (RF-07.4).
- Expone `{ index, pendingIndex, phase, direction, close }`.

### 4.10 `three/loadThree.js` y `three/BottleRig.js` (RF-05, D-01, D-02)

- `loadThree()` hace `import('three')` e `import('three/examples/jsm/loaders/GLTFLoader.js')`, y cachea la Promise a nivel de módulo. **Es la única vía de acceso a three** (RNF-02).
- El GLB se carga **una vez** y se cachea (`getMasterModel` del legacy).
- `BottleRig` es una clase:

```js
const rig = await BottleRig.create(canvas, { modelUrl, size, pixelRatio, labelUrl });
rig.setSize(size);
rig.setLabel(url);                                   // cambia la textura (cache por URL)
rig.setYaw(rad);
rig.spin({ from, to, durationMs, easing, onReveal, revealFraction }); // Promise
rig.onFirstFrame(cb);                                // RF-10.3
rig.dispose();                                       // libera el renderer al desmontar la pantalla
```

- Materiales, luces, cámara, tone mapping, geometría de la etiqueta y constantes: **copia literal** de `L:scroll-bottle.js`, salvo:
  - no hay pool de renderers ni `WeakMap`, porque D-01 los vuelve innecesarios,
  - el tilt con el mouse queda marcado como AJUSTE-02,
  - el `pixelRatio` del renderer tiene un techo de 2 (`Math.min(pixelRatio, 2)`), en vez del `devicePixelRatio` crudo del legacy — RNF-03: en gama media Android puede llegar a ~3x, y agrava el costo del paso de `transmission` y del MSAA en cada frame de la coreografía (ver T-4.4-fix).

### 4.11 Componentes

- **`FragranceScroll.jsx`**
  - Props: `{ mode: 'collapsed' | 'expanded', assets, fragrances, initialSlug, storage, showLabel, onOpenExpanded(slug), onCloseExpanded() }`.
  - Renderiza `CollapsedView` o `ExpandedView`.
- **`CollapsedView.jsx`**
  - Lee la última vista de `storage` (RF-09.2), **después de montar**, para no romper el SSR.
  - Muestra fondo, overlay, `BottlePoster`, título y `ShowButton`.
  - Dispara `preload` (RF-11).
- **`ExpandedView.jsx`**
  - Usa `useViewport`, `sceneFor` y `useNavigation`.
  - Muestra `Background`, `Bottle` (uno solo), `IngredientImage`, `Panel` y `CloseButton`.
  - Guarda la última vista en cada cambio de `index` (RF-06.7).
  - La coreografía de RF-07 se deriva de `phase`: en `leaving`, la botella hace `spin` de salida y el ingrediente sale; en `entering` (o sea en el `SWAP`), `setLabel` + `spin` de entrada, y entran el ingrediente y el panel.
- **`Bottle.jsx`**
  - Crea el canvas **una vez** y el `BottleRig` en un `useEffect`.
  - Muestra `BottlePoster` encima hasta `onFirstFrame`.
  - Expone por `ref` imperativo `spinOut()`, `swapAndSpinIn(labelUrl)`, `spinIntro()` y `setSize()`.
  - Lleva el link de la botella (AJUSTE-03), resuelto en una función `bottleLinkHref(slug)`.
- **`Background.jsx`**
  - Dos `<div>` que alternan roles; anima sólo `opacity` (RF-07.1).

### 4.12 SSR (RNF-02)

- Nada de `window`, `document`, `navigator` ni `localStorage` al nivel de módulo.
- Todo eso se usa dentro de `useEffect`, en handlers o con guardas `typeof window !== 'undefined'`.
- `useViewport` devuelve `null` en el servidor y en el primer render. Hasta tenerlo, `ExpandedView` y `CollapsedView` renderizan sólo lo que no depende del layout (fondo, overlay, botón), sin posiciones.

### 4.13 Tests

- **Vitest** en entorno `node`.
- **Legacy:** `tests/legacy/*.test.js` importan `legacy/my-initial-store/assets/scroll-layout.js` y `scroll-panel.js`, con un alias `@scroll/layout` → archivo legacy en `vitest.config.js`, y comparan con `src/`. Viewports mínimos:
  - 320×568, 360×640, 375×667, 390×844, 412×915 y 430×932 (celulares),
  - 768×1024 y 1024×768 (tablet),
  - 1280×720, 1440×900 y 1920×1080 (desktop),
  - 700×300 (pantalla muy baja).
- **Reducer:** cubre todos los casos de RF-06.4 y RF-06.5.
- **SSR:** `renderToString(<FragranceScroll mode="collapsed" …/>)` y `mode="expanded"` no lanzan errores.

### 4.14 Scripts de `package.json`

`dev`, `build`, `preview`, `lint` (ya existen) y `test` (`vitest run`).

## 5. Mapeo legacy → React

| Legacy | React | Nota |
|---|---|---|
| `scroll-constants.js` | `data/fragrances.js` | Sólo nombre, slug e ingredientes (RF-01.3) |
| `scroll-assets.js` + JSON de `L:section` | `config/assets.js` | |
| `scroll-layout.js` | `lib/layout.js` | Literal |
| `scroll-panel.js`, `scroll-content.js` | `lib/scene.js` | Sin mutación; sin lógica muerta |
| `scroll-config.js` | `config/timing.js`, `config/input.js` | Sin `ANIMATION_BEHAVIOR`, `GROW_*` ni `SHOW_ANIMATION` |
| `scroll-grow.js` | — | Muerto |
| `scroll-helpers.js` (`applyCssVariables`) | Estilos inline y variables CSS desde los componentes | Sin la validación de `grow`/`effect` |
| `scroll-motor.js` | `lib/navigation.js` + `hooks/useNavigation.js` + `FragranceScroll.jsx` | Sin `boxTops`/`scrollTo`: el desplegado es su propia pantalla |
| `scroll-styles.js` | Componentes + `styles/fragrance-scroll.css` | Sin pool de canvas ni prewarm (D-01) |
| `scroll-bottle.js` | `three/BottleRig.js` + `three/loadThree.js` | Sin pool de renderers (D-01) |
| `scroll-fragrance-scroll.js` (lazy por `IntersectionObserver`) | `lib/preload.js` | Reemplazado por RF-11 |
| `scroll-viewport.js`, `scroll-container.js` | `hooks/useViewport.js` | Sin `.page-wrapper` |
| three vendorizado + `scroll-gltf-loader.js` y utilidades | npm `three@0.185.1` | |
