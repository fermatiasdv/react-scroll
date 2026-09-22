# Ajustes pendientes

Registro de lo que hoy está **en fase de prueba o provisorio** en la migración a React: qué es, por qué quedó, cuándo se quita o se reemplaza y cómo.

## Convención

Cada ítem tiene un id (`AJUSTE-NN`). En el código, cada lugar afectado lleva un comentario con ese id:

```js
// AJUSTE-01: input de escritorio, sólo para probar en el sandbox. Ver docs/ajustes.md.
```

Para encontrar todo lo que hay que tocar de un ítem: `grep -rn "AJUSTE-01" src/`.

Cuando un ajuste se aplica, se borran sus comentarios del código y el ítem pasa a la sección **Aplicados** al final de este archivo, con la fecha.

## Disparadores

La mayoría de los ajustes se aplican en alguno de estos momentos:

- **T1 — Bloque Tapcart validado:** hay acceso a Tapcart y un bloque de prueba (canvas three.js + swipe) funciona en un Android de gama media.
- **T2 — Empaquetado como bloque:** el componente se pasa del sandbox Vite a un bloque de Tapcart (`code.jsx` + `manifest.json`).
- **T3 — Datos reales disponibles:** llegan los IDs de producto de Shopify y los assets están subidos a Shopify Files.

---

## En prueba (se quitan)

### AJUSTE-01 — Navegación con rueda y teclado

- **Qué es:** paginar entre fragancias con la rueda del mouse (`wheel`) y con las flechas o PageUp/PageDown (`keydown`). Incluye la agrupación de gestos (`GESTURE_GAP_MS`), que existe sólo para que una ruedada (decenas de eventos) no cruce varias fragancias de golpe.
- **Legacy:** `scroll-motor.js` (`onWheel`, `onKeyDown`, `noteInputGesture`) y `scroll-config.js` (`GESTURE_GAP_MS`).
- **Por qué quedó:** para probar la experiencia rápido en el navegador de escritorio, sin emular touch.
- **Cuándo se quita:** en **T2**. En el celular no hay rueda ni teclado; el único input real es el swipe.
- **Cómo:** borrar los listeners de `wheel` y `keydown`, la agrupación de gestos y `GESTURE_GAP_MS`. El swipe no depende de nada de esto: cada swipe ya es un solo gesto.

### AJUSTE-02 — Inclinación de la botella al pasar el mouse (hover tilt)

- **Qué es:** con el mouse sobre la botella, ésta se inclina 20° (`HOVER_TILT_ANGLE_DEG = 20`, animación de 300 ms con `easeInOutCubic`). Si el mouse está en la mitad de arriba del canvas se inclina hacia un lado y en la mitad de abajo hacia el otro. Al salir el mouse, vuelve a 0°. (La guía de migración habla de flechas y de un `isBottleHovered()` que bloquea la navegación; eso ya no existe en el tema.)
- **Legacy:** `scroll-bottle.js`, bloque "Inclinación al pasar el mouse" (`animateTiltTo`, `handleBottleMouseMove/Enter/Leave`).
- **Por qué quedó:** para comparar el comportamiento con el legacy mientras se desarrolla en escritorio.
- **Cuándo se quita:** en **T2**, junto con AJUSTE-01. En touch no existe el hover.
- **Cómo:** borrar la lógica de tilt del rig de la botella y sus listeners de mouse.

### AJUSTE-03 — Link de prueba a Google sobre la botella

- **Qué es:** tocar la botella abre `https://www.google.com/?fragrance=<slug>`. Es un placeholder, no un link real de producto.
- **Legacy:** `scroll-styles.js` (`bottleLinkHref`, `createProductLinkedCanvas`) y `scroll-content.js`.
- **Por qué quedó:** decisión explícita de mantenerlo tal cual hasta tener los IDs de producto.
- **Cuándo se reemplaza:** en **T3**, cuando estén los IDs, y funcionando en Tapcart (**T2**).
- **Cómo:** agregar el ID o handle de producto a cada fragancia en los datos fijos y reemplazar el link por la acción `screen/open` de Tapcart hacia la página del producto. La URL se resuelve en un único lugar, igual que hoy con `bottleLinkHref`.

### AJUSTE-04 — Simulación de "abrir pantalla" y "volver" (colapsado ↔ desplegado)

- **Qué es:** en Tapcart se eligió la **opción (a)**: la home muestra el bloque colapsado (botella + título, una pantalla), "Show fragancies" abre una pantalla de Tapcart a pantalla completa con el bloque desplegado, y el ✕ o pasarse de un borde vuelven atrás (`go/back`). En el sandbox esas dos acciones se simulan con estado interno de React.
- **Por qué quedó:** fuera de la app de Tapcart no existen `screen/open` ni `go/back`.
- **Cuándo se reemplaza:** en **T2**.
- **Cómo:** reemplazar la simulación por las acciones reales de Tapcart. Queda aislada detrás de dos funciones (`openExpanded()` / `closeExpanded()`) para que el cambio toque un solo archivo.

### AJUSTE-06 — Assets servidos localmente

- **Qué es:** el modelo GLB, las etiquetas, los fondos y las imágenes de ingredientes se sirven desde el sandbox, en `public/fragrance-scroll/` (4,8 MB en total):
  - `model/bottle.glb` (2 MB)
  - `labels/<slug>.webp` (10 etiquetas, ya convertidas a WebP, ver AJUSTE-10)
  - `backgrounds/bg-1.jpg`, `bg-2..4.webp`
  - `ingredients/<slug>.webp` (10 imágenes fijas de ingrediente)
  - `posters/<slug>.webp` (se agregan cuando se generen, ver AJUSTE-11)
- **Legacy:** en el tema salían del CDN de Shopify vía `asset_url`, inyectados como JSON en `sections/fragrance-scroll.liquid`.
- **Por qué quedó:** los assets todavía no están subidos a Shopify Files.
- **Cuándo se reemplaza:** en **T3**.
- **Cómo:** subir el contenido de `public/fragrance-scroll/` a Shopify Files y reemplazar las URLs del **único objeto de config de assets** por las nuevas. Ningún otro archivo debería tener URLs de assets.

---

## Provisorios (se revisan)

No son features de prueba, pero son decisiones tomadas para avanzar que conviene revisar más adelante.

### AJUSTE-07 — Contenido fijo en el código

- **Qué es:** las 10 fragancias (nombres, ingredientes, imágenes) quedan fijas en el código, como en el legacy (`scroll-constants.js`).
- **Por qué:** decisión de avanzar sin depender del CMS de App Studio.
- **Cuándo se revisa:** si se quiere que el contenido se edite desde App Studio sin deployar.
- **Cómo:** mover los datos a campos del `manifest.json` del bloque y leerlos desde `blockConfig`.

### AJUSTE-08 — React 18 en el sandbox

- **Qué es:** el sandbox usa React 18.3 (no 19).
- **Por qué:** el SDK de Tapcart (`@tapcart/app-studio`) declara `react` y `react-dom` `^18.2.0` como peer dependencies. Hay que evitar usar APIs exclusivas de React 19.
- **Cuándo se revisa:** si Tapcart pasa a soportar React 19.

### AJUSTE-09 — Sandbox Vite como entorno de desarrollo

- **Qué es:** todo se desarrolla en este proyecto Vite y no directamente en un proyecto de la CLI de Tapcart.
- **Por qué:** todavía no hay acceso a Tapcart (plan Enterprise / App ID).
- **Cuándo se revisa:** en **T1**. Ahí se confirma si un bloque puede importar módulos locales o si hay que empaquetar todo en un solo `code.jsx`, cómo se comporta el alto de pantalla completa dentro del webview y si three.js carga bien vía esm.sh.

### AJUSTE-10 — Etiquetas de la botella en WebP (calidad 90)

- **Qué es:** las 10 etiquetas (PNG RGBA de 1024×1024, ~800 KB cada una) se convirtieron a WebP con pérdida, calidad 90, `method=6` y `exact` (conserva el color de los píxeles transparentes, para que el filtrado de la textura no genere bordes oscuros). Pasaron de 7,75 MB a 0,77 MB en total (~80 KB cada una).
- **Verificado:** el canal alfa queda sin pérdida y el recorte por `alphaTest 0.4` coincide píxel por píxel con el PNG. En los píxeles visibles, la diferencia de color es de ~39 dB de PSNR (no se nota a simple vista).
- **Verificado sobre la botella 3D real (2026-09-21, por el usuario):** las 10 etiquetas se ven bien, sin artefactos; se mantiene la calidad 90. Si más adelante aparecen artefactos en el texto, subir a calidad 95 (~110 KB cada una). Los PNG originales siguen en `legacy/my-initial-store/assets/scroll-bottle-label*.png`.
- **Cómo se regeneran:** con Pillow, `Image.open(png).convert("RGBA").save(webp, "WEBP", quality=90, method=6, exact=True)`.

### AJUSTE-11 — Póster de la botella en la home (colapsado sin WebGL)

- **Qué es:** en el modo colapsado (el bloque que va en la home), la botella se muestra como **una imagen WebP pre-renderizada con fondo transparente**, no como un canvas WebGL. Hay un póster por fragancia (`posters/<slug>.webp`), renderizado de frente (yaw 0) con el mismo modelo, los mismos materiales, la misma iluminación y la etiqueta de esa fragancia. Se posiciona y dimensiona con el mismo layout que el canvas, así que se ve idéntico.
- **Legacy:** en el tema, el colapsado ya era una botella **quieta** (`createStaticProductCanvasElement`, sin giro), pero dibujada con WebGL. Eso obligaba a la home a descargar three.js (~2,3 MB sin minificar) y el GLB, y a compilar los shaders del vidrio antes de mostrar la botella. Mientras tanto se veía el fondo sin botella.
- **Por qué:** la home no carga WebGL, el póster sale en el HTML del servidor (compatible con el SSR de Tapcart) y no hay un momento con la botella faltante.
- **En el modo desplegado:** el póster también sirve de reemplazo mientras se compila la botella 3D. Se muestra el póster y el canvas lo reemplaza recién cuando ya pintó su primer frame, sin parpadeo.
- **Cómo se generan:** con una página de desarrollo del sandbox que usa el mismo rig de la botella ya portado (fase 3), renderiza cada fragancia y exporta el WebP. Hasta la fase 3, el colapsado del sandbox muestra la botella con un placeholder.
- **Mantenimiento:** **hay que regenerar los pósters** cada vez que cambie el modelo, un material, la iluminación, una etiqueta o el encuadre de la cámara. Si no, la home y el modo desplegado dejan de coincidir.
- **Decidido:** la home muestra **la última fragancia que vio el usuario**. Se guarda con el storage de Tapcart (`storage/add` / `storage/update`) al cambiar de fragancia en el modo desplegado, y se lee al montar el colapsado. Si no hay nada guardado, se muestra la primera. En el sandbox se simula con `localStorage` hasta **T2**.

### AJUSTE-12 — Precarga anticipada de la botella después de cargar la home

- **Qué es:** cuando la home termina de cargar (evento `load` y después un `requestIdleCallback`), el bloque colapsado empieza a descargar en segundo plano todo lo que necesita el modo desplegado, **aunque el usuario nunca toque "Show fragancies"**. El orden es este:
  1. el módulo de three.js (`import()`),
  2. el GLB,
  3. las 10 etiquetas,
  4. los fondos y las imágenes de ingrediente, en prioridad baja.
- **Legacy:** en el tema la descarga arrancaba cuando la sección estaba a una pantalla de distancia (`IntersectionObserver` con `rootMargin: 100%`), no al cargar la página.
- **Por qué:** decisión explícita. Descargar de más (~3,5 MB si no se usa) se acepta a cambio de que, en un dispositivo lento, "Show fragancies" no muestre una botella que tarda en aparecer.
- **Límite conocido:** con la opción (a), el modo desplegado es **otra pantalla de Tapcart**. Si cada pantalla tiene su propio webview, lo que pasa de una a otra es la caché HTTP (las descargas). Los shaders compilados y las imágenes decodificadas no se comparten, así que la compilación del vidrio ocurre igual al abrir la pantalla desplegada. Por eso el póster (AJUSTE-11) cubre ese momento.
- **Cuándo se revisa:**
  - en **T1**, para confirmar si las pantallas comparten webview (en ese caso, la precarga podría incluir hasta compilar la botella) y que la caché HTTP efectivamente se reuse entre pantallas;
  - más adelante, con datos de uso: si casi nadie abre "Show fragancies", evaluar si el costo en datos se justifica.
- **Decidido:** si el usuario tiene activado el ahorro de datos (`navigator.connection.saveData`), **no se precarga nada** y la descarga arranca recién al tocar "Show fragancies". El póster cubre la espera.

### AJUSTE-13 — Link para compartir una fragancia (deep link)

- **Qué es:** un link que abre la experiencia directamente en una fragancia, para que una persona se la pueda mandar a otra y quien la recibe no tenga que buscarla scrolleando.
- **Legacy:** `?fragrance=<slug>` en la URL de la home del tema. Al entrar con ese parámetro, el motor carga de inmediato, salta a la sección y muestra esa fragancia. Al navegar en modo desplegado, la URL se actualiza (`updateUrlForIndex`), así que alcanza con copiar la URL del navegador.
- **Qué cambia en Tapcart:**
  - **No hay barra de URL** dentro de la app, así que no se puede "copiar el link": hace falta un **botón de compartir** visible en el modo desplegado. Es un elemento de UI nuevo, que hoy no existe.
  - **El link tiene que abrir la app en la pantalla desplegada con la fragancia**, usando un deep link de Tapcart a una pantalla con parámetros (`screen/open` acepta `data` para eso) o la integración con AppsFlyer (OneLink) que Tapcart ya soporta.
  - **Si quien recibe el link no tiene la app,** debería caer en la web. La home del tema de Shopify **ya soporta** `?fragrance=<slug>`, así que es el fallback natural.
- **Por qué no se implementa todavía:** depende de cómo arma Tapcart los deep links y de qué mecanismo para compartir hay dentro del webview. La Web Share API (`navigator.share`) no está garantizada en el WebView de Android.
- **Cuándo se define:** en **T1**. Hay que verificar tres cosas:
  1. si existe un deep link a una pantalla custom con parámetros,
  2. cómo se comparte desde el bloque (acción nativa de Tapcart o `navigator.share`),
  3. si el link puede ser la URL web del tema, de modo que la app la intercepte si está instalada y si no se abra la web.
- **Qué se deja preparado desde ya:** el slug de cada fragancia (mismo formato que el legacy), y un estado del modo desplegado que puede arrancar en cualquier índice. Así el deep link se reduce a "abrir la pantalla con `{ fragrance: slug }`".

---

## Lógica muerta del legacy (no se porta)

Código que existe en el tema pero que ya no produce ningún efecto. **No se migra.** Queda anotado para que nadie lo "recupere" leyendo el legacy o la guía de migración (que en este punto está desactualizada).

| Qué | Dónde (legacy) | Por qué está muerto |
|---|---|---|
| Estallido de imágenes de ingrediente (N imágenes alrededor de la botella, radios válidos por ángulo) | La guía lo describe (`pickUniqueImages`, `radiusRangeAt`, `IMAGES_PER_INGREDIENT`); en el tema sólo quedan restos | Desde el 2026-09-18 las 10 fragancias usan una única imagen fija de ingrediente (`FIXED_INGREDIENT_IMAGE_OVERRIDES` en `scroll-content.js`). En React no hay unión `burst`/`fixed`: el ingrediente es siempre una imagen fija. |
| Nombres heredados de la "caja de prueba de almendras" (`testFixed`, `applyAlmondTestLayout`, `TEST_ITEM_ZOOM_SCALE`) | `scroll-content.js`, `scroll-styles.js` | No es código muerto, pero el nombre es de cuando era una prueba. Se porta con nombres propios (imagen de ingrediente, zoom de entrada). |
| Sistema "grow" (`scroll-grow.js`, `growExtreme`, `GROW_MAX` y su validación) | `scroll-grow.js`, `scroll-config.js`, `scroll-styles.js`, `scroll-helpers.js` | Ningún ítem declara `grow`: la escala siempre da 1. |
| Rotación por ítem (`item.angle`, `rotationAngle`) | `scroll-styles.js` | Ninguna fragancia asigna ángulo: la imagen de ingrediente ya viene compuesta. |
| Fondos por clase de color (`BOX_CLASSES`, `boxClass`, `box-blue`…) | `scroll-content.js`, `scroll-motor.js`, `scroll-styles.js` | Siempre hay imagen de fondo, y esas clases ni siquiera existen en el CSS del tema. |
| Sistema genérico de animaciones por caja (`animation: { effect, when }` con `fade` / `traslation` / `no`) | `scroll-content.js`, `scroll-styles.js` | Todas las cajas usan la misma combinación. Se reemplaza por la coreografía explícita (giro + ingrediente + fondo, regida por `COLLAPSE_TO_CENTER_MS`). |
| `setDisplayStatic` | `scroll-styles.js` | Está exportada pero nadie la llama. El colapsado usa `renderCollapsedEntry` (que además pasa a ser el póster, ver AJUSTE-11). |
| Botella por geometría (`LatheGeometry`) | Sólo comentarios en `scroll-bottle.js` | Se reemplazó por el GLB el 2026-09-09. |

Además, lo siguiente es propio del tema de Shopify y **no aplica en Tapcart**, así que tampoco se porta: el custom element `<fragrance-scroll>` y su ciclo de vida en el editor de temas, `scroll-container.js` (raíz de scroll `.page-wrapper` en desktop), ocultar `.header-section` durante el modo animado y el `touch-action: none` sobre `html`/`body`.

---

## Aplicados

### AJUSTE-05 — Secciones de relleno alrededor del bloque colapsado (2026-09-22)

Se quitó del sandbox antes de lo previsto (el disparador original era T2), a pedido del usuario, para que la auditoría final (T-6.1) audite sólo el componente reutilizable sin elementos de prueba alrededor. Sin cambios en el comportamiento de cierre por borde (RF-06.5/RF-08.5), que no dependía de estas secciones.
