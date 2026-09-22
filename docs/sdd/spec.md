# Spec: scroll animado de fragancias en React (bloque Tapcart)

> **Fuente de verdad del comportamiento.** Todo lo que se construya tiene que poder rastrearse a un requisito de este documento. Lo que no está acá no se construye sin antes agregarlo (con aprobación del usuario).
>
> Referencias al legacy: `legacy/my-initial-store/assets/<archivo>` (abreviado `L:<archivo>`) y `legacy/my-initial-store/sections/fragrance-scroll.liquid` (abreviado `L:section`). Cuando un requisito dice **"igual que el legacy"**, se porta el comportamiento y los valores **literalmente** desde la referencia citada.

## 1. Contexto

Es una experiencia de fragancias a pantalla completa. Cada fragancia se muestra con:
- una botella 3D (three.js),
- una imagen de ingredientes detrás de la botella,
- un panel de texto (nombre + ingredientes),
- un fondo con crossfade.

Hoy funciona como sección de un tema de Shopify. El destino final es un **Custom Block de Tapcart**: React web dentro de un webview de la app móvil, en la **home**, a pantalla completa.

Hay **dos modos**:
- **Colapsado** (el bloque en la home): una pantalla quieta con la botella, el nombre y el botón "Show fragrances".
- **Desplegado** (una pantalla de Tapcart aparte): una pantalla por fragancia, paginadas con swipe y con transiciones animadas.

El desarrollo se hace primero en un **sandbox Vite** (este proyecto) y después se empaqueta como bloque. Ver `docs/ajustes.md` para todo lo provisorio.

## 2. Alcance

**Entra:** las 10 fragancias del legacy, los modos colapsado y desplegado, la botella 3D, las transiciones entre fragancias, la navegación por swipe (más rueda y teclado sólo para desarrollo), el póster, la precarga, la persistencia de la última fragancia vista, el placeholder del link de la botella y la preparación para compartir por deep link.

**No entra (ver también `docs/ajustes.md` → "Lógica muerta del legacy"):**
- el estallido de imágenes de ingrediente,
- el sistema "grow",
- la rotación por ítem,
- los fondos por clase de color,
- el sistema genérico `effect`/`when`,
- `setDisplayStatic`,
- lo propio del tema de Shopify (custom element, editor de temas, `.page-wrapper`, ocultar el header),
- el scroll continuo nativo (nunca se aplicó en el legacy),
- el empaquetado real como bloque Tapcart (bloqueado hasta tener acceso).

## 3. Requisitos funcionales

### RF-01: Datos de las fragancias

- **RF-01.1** Existen exactamente las 10 fragancias del legacy, en el orden de su `idx` (`L:scroll-constants.js`): Rebellious, Forbidden Flower, Wonder of the World, Painkiller, Jagged Edge, Crimson Desert, Glitterati, Ecstasy, Epicurean y London Legend.
- **RF-01.2** Cada fragancia tiene:
  - un **nombre visible** (igual al legacy),
  - un **slug**, que se calcula como en el legacy: `nombre.trim().toLowerCase().replace(/[\s-]+/g, '_')` (`L:scroll-content.js`, `slugify`),
  - **3 nombres de ingrediente** para el panel, iguales a las 3 primeras entradas **no comentadas** de `ingredientes` en el legacy.
- **RF-01.3** Los datos quedan **fijos en el código** (AJUSTE-07). Del legacy no se portan las rutas de imágenes de producto ni las listas de imágenes por ingrediente: son identificadores sin archivo detrás.

### RF-02: Assets

- **RF-02.1** Todas las URLs de assets (modelo, etiquetas, fondos, imágenes de ingrediente, pósters) salen de **un único objeto de configuración**. Ningún otro módulo arma ni contiene URLs de assets (AJUSTE-06).
- **RF-02.2** Las etiquetas se usan en WebP (`public/fragrance-scroll/labels/<slug-sin-guiones>.webp`, ver AJUSTE-10). Painkiller usa `default.webp`, igual que en el legacy.
- **RF-02.3** Los fondos son 4 y se asignan de forma cíclica por posición: la fragancia `i` usa el fondo `i % 4`, en el orden `bg-1.jpg`, `bg-2.webp`, `bg-3.webp`, `bg-4.webp` (`L:scroll-content.js`, `buildContent`).
- **RF-02.4** Cada fragancia tiene su imagen fija de ingrediente (`ingredients/<slug-sin-guiones>.webp`). Painkiller además lleva el estiramiento `{ scaleX: 2, scaleY: 1.2 }` (`L:scroll-content.js`, `FIXED_INGREDIENT_IMAGE_OVERRIDES`).

### RF-03: Layout y geometría

- **RF-03.1** Toda la geometría (modo `stack`/`column`, márgenes, tamaño del producto, bandas del panel, tamaños de fuente) sale de una función pura `layoutFor(vw, vh)` **idéntica** a `L:scroll-layout.js`: mismas constantes y misma salida para cualquier `(vw, vh)`.
- **RF-03.2** La posición vertical de cada línea del panel sale de `panelLineY`, idéntica al legacy.
- **RF-03.3** La botella va centrada en `(vw/2, vh/2)`, en un cuadro de lado `layout.product.size`.
- **RF-03.4** La imagen de ingrediente va centrada en el mismo punto. Su **alto** es `round(layout.product.halfH * 2)` y su ancho es proporcional al aspect ratio real, nunca deformado. Si tiene estiramiento, se aplica igual que el legacy (`L:scroll-styles.js`, `createImageElement`).
- **RF-03.5** Ante un cambio de tamaño del viewport, todo se recalcula (a lo sumo una vez por frame) **sin cambiar** la fragancia actual ni el modo.

### RF-04: Panel de texto

- **RF-04.1** El título (nombre de la fragancia) va arriba, centrado, en la línea 0 del panel. Los 3 ingredientes van abajo, en **una sola fila**, unidos por `" – "` y ubicados en la línea `INGREDIENT_LINE_COUNT` (`L:scroll-panel.js`).
- **RF-04.2** Tipografía y estilos iguales al legacy:
  - fuente `'Cormorant Garamond', serif`,
  - color blanco,
  - `text-shadow` en dos capas,
  - tamaños tomados de `titleFontSizePx` / `ingredientFontSizePx` del layout,
  - el título en peso 700 y los ingredientes en 400, ambos sin salto de línea (`L:section`, `.display-label*`).
- **RF-04.3** El texto aparece palabra por palabra con fade, con los tiempos del legacy (`wordFadeMs = 300`, `WORD_FADE_STAGGER_MS = 60`). Al cambiar de fragancia, el panel sale y entra con un desplazamiento vertical según la dirección (`DIRECTIONAL_ENTER_OFFSET_PX = 48`, `labelTransitionMs = 350`), igual que el legacy.

### RF-05: Botella 3D

- **RF-05.1** La botella es el modelo GLB (`model/bottle.glb`), con materiales, luces, cámara y tone mapping **iguales al legacy** (`L:scroll-bottle.js`):
  - vidrio con `transmission` y atenuación,
  - pared interior opaca en `BackSide`,
  - dorados metálicos,
  - tubo interior,
  - etiqueta sobre una cáscara curva con `alphaTest 0.4`,
  - cámara ortográfica,
  - luz key + rim + ambiente,
  - `ACESFilmic`.
- **RF-05.2** La etiqueta depende de la fragancia (por slug; Painkiller usa la `default`). Cambiar de fragancia **cambia la textura de la etiqueta en la misma botella**.
- **RF-05.3** **Botella única persistente:** en el modo desplegado hay **un solo** canvas y **un solo** `WebGLRenderer` durante toda la sesión de esa pantalla. Nunca se crea un renderer por fragancia.
- **RF-05.4** La botella expone giros con las curvas del legacy (`easeInOutCubic`, `easeInCubic`, `easeOutCubic`) y fija su orientación (yaw) sin animación.
- **RF-05.5** Inclinación al pasar el mouse, igual que el legacy (AJUSTE-02: sólo para desarrollo).
- **RF-05.6** La botella es un link. Por ahora apunta a `https://www.google.com/?fragrance=<slug>` (AJUSTE-03), y la URL se resuelve en **un único lugar**.

### RF-06: Modo desplegado: navegación

- **RF-06.1** Muestra una fragancia por vez, a pantalla completa. El índice inicial es el que se recibe al abrir (la última vista o la del deep link).
- **RF-06.2** **Swipe vertical** (igual que el legacy, `L:scroll-motor.js`, `onTouchStart`/`onTouchMove`/`onTouchEnd`):
  - cuenta como swipe si `|dy| >= SWIPE_MIN_DISTANCE_PX (60)` y `|dy| >= |dx| * SWIPE_DIRECTION_RATIO (1.2)`,
  - hacia arriba avanza, hacia abajo retrocede,
  - **un swipe = una sola acción**,
  - mientras dura el gesto se bloquea el scroll nativo (`preventDefault`) según las mismas reglas que el legacy.
- **RF-06.3** **Rueda y teclado** (AJUSTE-01, sólo para desarrollo), igual que el legacy:
  - teclas para avanzar: `ArrowDown`, `PageDown`, espacio; para retroceder: `ArrowUp`, `PageUp`,
  - agrupación de eventos en un solo gesto con `GESTURE_GAP_MS = 250`, para que una ruedada no cruce varias fragancias,
  - se ignoran los eventos que vienen de `dialog`, `input`, `textarea`, `select` o `contenteditable`.
- **RF-06.4** **Bloqueo durante la transición:** desde que arranca un cambio de fragancia hasta `COLLAPSE_TO_CENTER_MS (500) + LOCK_MS (50)` después, no se acepta otra navegación.
- **RF-06.5** **Bordes:**
  - pasarse de la primera fragancia hacia atrás, o de la última hacia adelante, **cierra el modo desplegado** (vuelve al colapsado), lo mismo que la ✕;
  - si el intento de salida llega **durante** una transición, se encola y se ejecuta al terminar, sólo si la fragancia de destino es un borde y el gesto es otro, no el mismo que navegó (`queueExitIfEdgeBound`, `navGestureId`);
  - el mismo gesto que navegó hasta un borde **no** puede además salir por ese borde.
- **RF-06.6** **Botón ✕** arriba a la derecha (estilos del legacy, `L:section`, `.fragrances-close-button`): cierra el modo desplegado.
- **RF-06.7** Cada vez que cambia la fragancia actual, se guarda como "última vista" (RF-09).

### RF-07: Modo desplegado: coreografía de la transición

Al pasar de la fragancia A a la B (`L:scroll-motor.js`, `goToIndex`; `L:scroll-styles.js`). Todo se rige por **una sola constante**, `COLLAPSE_TO_CENTER_MS = 500`:

- **RF-07.1** **En t = 0, en paralelo:**
  1. **Giro de salida:** la botella gira de frente a espaldas en 500 ms con `easeInCubic`.
  2. **Salida del ingrediente:** la imagen de ingrediente de A hace fade a 0 y zoom a `TEST_ITEM_ZOOM_SCALE (0.5)` en 500 ms.
  3. **Crossfade de fondo:** dos capas se alternan los roles de entrante y saliente, animando **sólo `opacity`** (nunca `transform`), en `backgroundTransitionMs = 500`.

  El panel de A **no** se mueve todavía.
- **RF-07.2** **En t = 500 ms:**
  - la etiqueta cambia a la de B **mientras la botella está de espaldas**,
  - la botella gira de espaldas a frente en 500 ms con `easeOutCubic`, así que la velocidad angular coincide en el empalme y **no hay frenazo**,
  - **en el mismo instante** entra la imagen de ingrediente de B (desde fade 0 y zoom 0.5 hasta su estado final, en 500 ms),
  - y el panel de A sale mientras entra el de B, en paralelo, según RF-04.3 (`L:scroll-styles.js`, `transitionDisplay`).
- **RF-07.3** **En t = 550 ms** se libera el bloqueo (RF-06.4) y se procesa la salida encolada, si la hay (RF-06.5).
- **RF-07.4** Si el modo desplegado se cierra durante una transición, la transición se cancela sin efectos colaterales: no quedan timers ni animaciones vivas.
- **RF-07.5** **Carga inicial** del modo desplegado (y rearmado por resize): la botella hace un giro completo de frente a frente en `SPIN_DURATION_MS = 2000` con `easeInOutCubic`. La imagen de ingrediente aparece al 80% del giro (`SPIN_REVEAL_FRACTION = 0.8`, o sea a los 1600 ms). El panel aparece según RF-04.3. Este camino es **distinto** del de RF-07.1 a RF-07.3, igual que en el legacy (`setDisplayInstant`).

### RF-08: Modo colapsado (bloque en la home)

- **RF-08.1** Ocupa una pantalla (100% del ancho y el alto del viewport del bloque) y muestra:
  - el **fondo** de la fragancia mostrada, con el overlay `rgb(0 0 0 / 0.6)`,
  - el **póster** de la botella (RF-10),
  - el **título**.

  **No** muestra la imagen de ingrediente ni la fila de ingredientes. Todo aparece ya en su estado final, **sin animaciones** (`L:scroll-styles.js`, `renderCollapsedEntry`).
- **RF-08.2** La fragancia mostrada es la **última vista** (RF-09). Si no hay ninguna, es la primera.
- **RF-08.3** El botón **"Show fragrances →"** va abajo al centro, con los estilos del legacy (`L:section`, `.fragrances-overlay` y `.fragrances-show-button`). El texto es configurable y por defecto dice `Show fragrances`.
- **RF-08.4** Tocar el botón **abre el modo desplegado** en la fragancia mostrada (`openExpanded`). En el sandbox, la apertura se simula dentro de la misma página (AJUSTE-04); en Tapcart será `screen/open`.
- **RF-08.5** Cerrar el modo desplegado (✕ o borde) vuelve al colapsado, que muestra la última fragancia vista (`closeExpanded`; en Tapcart será `go/back`).
- **RF-08.6** El modo colapsado **no carga three.js ni crea contextos WebGL**.

### RF-09: Última fragancia vista

- **RF-09.1** El slug de la fragancia actual del modo desplegado se persiste cada vez que cambia.
- **RF-09.2** El modo colapsado lo lee al montarse. Si el slug guardado no existe entre las fragancias, se usa la primera.
- **RF-09.3** El acceso al almacenamiento está aislado detrás de una interfaz (`get`/`set`). En el sandbox usa `localStorage` dentro de `try/catch` (AJUSTE-11); en Tapcart usará su storage.

### RF-10: Póster

- **RF-10.1** Hay un póster por fragancia: un WebP con fondo transparente de la botella de frente (yaw 0), con su etiqueta, renderizado con **el mismo rig** de RF-05. Va en `posters/<slug-sin-guiones>.webp`.
- **RF-10.2** El póster se posiciona y dimensiona **igual que el canvas** de la botella (RF-03.3), así que visualmente no hay diferencia entre póster y 3D quieto.
- **RF-10.3** En el modo desplegado, el póster se muestra en el lugar de la botella **hasta que el canvas pintó su primer frame**. Después se reemplaza sin parpadeo.
- **RF-10.4** Los pósters se generan con una herramienta de desarrollo del sandbox, no en tiempo de ejecución. Hay que regenerarlos cada vez que cambie el modelo, un material, la luz, una etiqueta o la cámara (AJUSTE-11).

### RF-11: Precarga

- **RF-11.1** Con el modo colapsado montado, después del evento `load` de la página y en un momento libre (`requestIdleCallback`, con fallback a `setTimeout`), se precarga en este orden:
  1. el módulo de three.js,
  2. el GLB,
  3. las 10 etiquetas,
  4. los fondos y las imágenes de ingrediente, en prioridad baja.
- **RF-11.2** Si `navigator.connection?.saveData` es `true`, **no se precarga nada**.
- **RF-11.3** La precarga nunca bloquea ni retrasa el render del colapsado, y sus errores se ignoran: la carga normal del desplegado reintenta.

### RF-12: Deep link (preparación)

- **RF-12.1** El modo desplegado acepta un slug inicial. Un slug inválido cae en la primera fragancia.
- **RF-12.2** Existe una función pura `slug → índice` (el `buildPageSlugs` / `getIndexFromUrl` del legacy).
- **RF-12.3** El botón de compartir y el deep link real de Tapcart **no se implementan** hasta T1 (AJUSTE-13).

### RF-13: Sandbox de desarrollo

- **RF-13.1** El sandbox muestra únicamente el bloque colapsado/desplegado, sin secciones de relleno alrededor (AJUSTE-05, quitado antes de tiempo — ver `docs/ajustes.md`).
- **RF-13.2** El componente reutilizable recibe por props lo que en Tapcart vendrá de afuera: la config de assets, el texto del botón, el storage y las funciones `openExpanded`/`closeExpanded`.

## 4. Requisitos no funcionales

- **RNF-01, stack:** React **18** (sin APIs exclusivas de React 19), JavaScript (sin TypeScript), Vite y Vitest. Sin librerías de animación. three.js desde npm. No se agregan dependencias fuera de las de `design.md`.
- **RNF-02, compatibilidad con SSR:**
  - ningún módulo toca `window`, `document` o `navigator` al importarse;
  - three.js se importa **dinámicamente** y sólo en el cliente;
  - el primer render no depende del tamaño del viewport ni de valores aleatorios;
  - `renderToString` del componente raíz (colapsado y desplegado) no lanza errores.
- **RNF-03, rendimiento:** el dispositivo de referencia es un **Android de gama media**. No se crean renderers WebGL por fragancia (RF-05.3). El cambio de fragancia no puede tener demoras perceptibles por compilación de shaders. Se verifica en un dispositivo real antes de cerrar la fase 4.
- **RNF-04, fidelidad:** las funciones puras portadas (`layoutFor`, `panelLineY`, `slugify`, la geometría de ítems) devuelven **exactamente** lo mismo que el legacy, verificado con tests que importan el legacy.
- **RNF-05, limpieza:** sin `console.log` en el código final. Todo lo provisorio lleva `// AJUSTE-NN: … Ver docs/ajustes.md.`
- **RNF-06, accesibilidad mínima:** los botones son `<button>` con texto o `aria-label`. Las capas decorativas llevan `aria-hidden`.
- **RNF-07, viewport:** a pantalla completa en el webview (`100vw × 100vh` del bloque). Sin scroll horizontal. Sin márgenes del body en el sandbox.

## 5. Preguntas abiertas (no bloquean)

- **PA-01:** el texto del botón en la app, "Show fragrances" o "Ver fragancias". Por defecto se usa `Show fragrances` y es configurable (RF-08.3).
- **PA-02:** todo lo que depende de T1 (ver `docs/ajustes.md`: AJUSTE-09, 12 y 13).
