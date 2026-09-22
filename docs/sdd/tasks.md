# Tareas

> Cada tarea se implementa **sólo** con el OK explícito del usuario (`OK T-x.y`) y **sólo** tocando sus archivos permitidos. El agente actualiza la línea **Estado** de cada tarea. Estados posibles: `pendiente`, `plan propuesto`, `en curso`, `en verificación`, `hecha`, `bloqueada (motivo)`.
>
> **Verificación estándar (VE):** los criterios de aceptación de la tarea se cumplen, `npm run test`, `npm run lint` y `npm run build` terminan en verde, no hay archivos tocados fuera de los permitidos, no hay `console.log`, y cada AJUSTE nuevo o aplicado está reflejado en `docs/ajustes.md`.

## Resumen

| Tarea | Título | Depende de | Estado |
|---|---|---|---|
| T-0.1 | Limpiar el template y crear la estructura | — | hecha |
| T-0.1-fix | Excluir `legacy/` del lint | — | hecha |
| T-0.2 | Vitest y alias al legacy | T-0.1, T-0.1-fix | hecha |
| T-0.2-fix | Limitar el escaneo de dependencias de Vite (excluir `legacy/`) | T-0.2 | hecha |
| T-1.1 | Datos de fragancias, assets y constantes | T-0.2 | hecha |
| T-1.2 | `layout.js` literal + tests contra el legacy | T-0.2 | hecha |
| T-1.3 | `slug.js` y `scene.js` + tests | T-1.1, T-1.2 | hecha |
| T-1.4 | Reducer de navegación + tests | T-1.1 | hecha |
| T-2.1 | `useViewport` + estilos base | T-1.3 | hecha |
| T-2.2 | Render estático del desplegado (sin botella 3D) | T-2.1 | hecha |
| T-2.3 | Test de SSR | T-2.2 | hecha |
| T-3.1 | `loadThree` + `BottleRig` | T-2.2 | hecha |
| T-3.2 | `<Bottle>` persistente con póster provisorio | T-3.1 | hecha |
| T-3.3 | Herramienta de pósters + generación | T-3.2 | hecha |
| T-3.4 | Verificación visual de etiquetas WebP | T-3.2 | hecha |
| T-4.1 | `useNavigation`: swipe, rueda, teclado y timers | T-1.4, T-2.2 | hecha |
| T-4.2 | Coreografía de la transición | T-3.2, T-4.1 | hecha |
| T-4.3 | Giro de carga inicial | T-4.2 | hecha |
| T-4.4 | Prueba en Android de gama media | T-4.3 | pendiente |
| T-5.1 | Modo colapsado + abrir/cerrar simulados + última vista | T-3.3, T-4.2 | en verificación |
| T-5.1-fix | Salto entre póster y botella 3D al abrir el desplegado | T-5.1 | en verificación |
| T-5.2 | Precarga | T-5.1 | pendiente |
| T-5.3 | Sandbox: secciones de relleno | T-5.1 | pendiente |
| T-6.1 | Auditoría final contra la spec | todas | pendiente |
| T-7.x | Empaquetado en Tapcart | T1 de `ajustes.md` | bloqueada (sin acceso a Tapcart) |

---

## Fase 0: preparación

### T-0.1: Limpiar el template y crear la estructura

- **Estado:** hecha
- **Cubre:** RNF-01, RNF-07
- **Archivos permitidos:**
  - borrar `src/App.jsx`, `src/App.css`, `src/assets/*`, `public/icons.svg` y `public/favicon.svg`;
  - modificar `index.html`, `src/main.jsx` y `src/index.css`;
  - crear `src/sandbox/SandboxApp.jsx`.
- **Pasos:**
  1. Borrar el demo del template.
  2. `index.html`: `lang="es"`, título `Fragrance Scroll — sandbox`, sin favicon, y el `<link>` de Google Fonts a Cormorant Garamond igual que `L:section`.
  3. `src/index.css`: reset mínimo (`margin: 0`, `box-sizing`, fondo `#1a0f08`).
  4. `SandboxApp.jsx`: un placeholder que diga "sandbox".
- **Aceptación:** `npm run dev` muestra el placeholder sin errores en la consola; build y lint en verde; no quedan referencias al template.
- **Nota:** el lint recorría `legacy/` y fallaba por archivos ajenos al proyecto. El criterio "lint en verde" se cumple con T-0.1-fix; T-0.1 pasa a `hecha` cuando T-0.1-fix esté verificada.

### T-0.1-fix: Excluir `legacy/` del lint

- **Estado:** hecha
- **Cubre:** verificación estándar (VE): `npm run lint` en verde; `legacy/` es de sólo lectura.
- **Archivos permitidos:** `.oxlintrc.json`.
- **Pasos:** agregar la clave `"ignorePatterns": ["legacy/**"]` a `.oxlintrc.json`. No se toca `package.json` ni `legacy/`.
- **Aceptación:**
  - `npm run lint` termina con código 0;
  - `git status --porcelain` muestra sólo `.oxlintrc.json` (y los cambios ya pendientes de T-0.1);
  - sin cambios en `legacy/`.

### T-0.2: Vitest y alias al legacy

- **Estado:** hecha
- **Cubre:** RNF-04, design §4.13
- **Archivos permitidos:** `package.json`, `package-lock.json`, `vitest.config.js` (nuevo), `tests/unit/smoke.test.js` (nuevo).
- **Pasos:**
  1. `npm i -D vitest@^5`.
  2. Script `"test": "vitest run"`.
  3. `vitest.config.js`: entorno `node`, `include: ['tests/**/*.test.{js,jsx}']`, y alias `@scroll/layout` → `legacy/my-initial-store/assets/scroll-layout.js`.
  4. Un smoke test que importe `layoutFor` desde el legacy y verifique que es una función.
- **Aceptación:** `npm run test` pasa; VE.

### T-0.2-fix: Limitar el escaneo de dependencias de Vite

- **Estado:** hecha
- **Cubre:** RNF (higiene del entorno de desarrollo; no altera el comportamiento de la spec)
- **Archivos permitidos:** `vite.config.js`.
- **Pasos:**
  1. Agregar `optimizeDeps: { entries: ['index.html'] }` para que Vite no escanee los `.html` de `legacy/`, que resuelven `three` por `importmap` a CDN.
- **Aceptación:**
  - `npm run dev` arranca sin el warning "Failed to run dependency scan";
  - VE.
- **Nota:** T-3.3 agrega `tools/posters/index.html` como entrada de desarrollo en `vite.config.js`. Ahí también habrá que sumarlo a `optimizeDeps.entries`.

## Fase 1: datos y lógica pura

### T-1.1: Datos de fragancias, assets y constantes

- **Estado:** hecha
- **Cubre:** RF-01, RF-02, design §4.1 a §4.4
- **Archivos permitidos:** `src/fragrance-scroll/data/fragrances.js`, `src/fragrance-scroll/config/assets.js`, `src/fragrance-scroll/config/timing.js`, `src/fragrance-scroll/config/input.js`, `tests/unit/data.test.js`.
- **Pasos:**
  1. Transcribir las 10 fragancias desde `L:scroll-constants.js` (nombre y las 3 primeras entradas **no comentadas** de `ingredientes`) y el estiramiento de Painkiller desde `L:scroll-content.js`.
  2. Armar `DEFAULT_ASSETS` apuntando a `public/fragrance-scroll/`, con `posters: {}` vacío.
  3. Copiar las constantes de tiempo e input con sus valores del legacy.
  4. Agregar los comentarios AJUSTE-01, 06 y 07 donde corresponda.
- **Aceptación:**
  - un test verifica que hay 10 fragancias, que el orden y los nombres coinciden con el legacy, que cada una tiene 3 ingredientes y que cada slug tiene imagen de ingrediente y etiqueta (o cae en `default`, en el caso de Painkiller);
  - **cada archivo referenciado en `DEFAULT_ASSETS` existe en `public/`** (el test lo comprueba con `fs`);
  - VE.

### T-1.2: `layout.js` literal + tests contra el legacy

- **Estado:** hecha
- **Cubre:** RF-03.1, RF-03.2, RNF-04
- **Archivos permitidos:** `src/fragrance-scroll/lib/layout.js`, `tests/legacy/layout.test.js`.
- **Pasos:**
  1. Copiar `L:scroll-layout.js` literal. Se pueden traducir los comentarios, pero no cambiar la lógica ni las constantes.
  2. Escribir un test que compare `layoutFor` y `panelLineY` (líneas 0 a 3) del legacy contra el nuevo, en los viewports de design §4.13, con `toEqual`.
- **Aceptación:** los tests pasan con igualdad exacta; VE.

### T-1.3: `slug.js` y `scene.js` + tests

- **Estado:** hecha
- **Cubre:** RF-01.2, RF-03.3, RF-03.4, RF-04.1, RF-12.1, RF-12.2
- **Archivos permitidos:** `src/fragrance-scroll/lib/slug.js`, `src/fragrance-scroll/lib/scene.js`, `tests/unit/slug.test.js`, `tests/legacy/scene.test.js`, `vitest.config.js` (sólo para agregar el alias `@scroll/panel` si hace falta).
- **Pasos:** implementar según design §4.6 y §4.7.
- **Aceptación:**
  - la tabla de slugs esperados coincide para las 10 fragancias (`forbidden_flower`, `wonder_of_the_world`, etc.);
  - `indexFromSlug` devuelve 0 con un slug inválido;
  - `sceneFor` coincide con el legacy en los viewports de §4.13:
    - `title` y `ingredientsLine` contra `buildTitlePanelItems` de `L:scroll-panel.js`,
    - `product` contra `applyProductLayout`,
    - `ingredient` contra `applyAlmondTestLayout` (valores copiados de la lógica del legacy);
  - VE.

### T-1.4: Reducer de navegación + tests

- **Estado:** hecha
- **Cubre:** RF-06.4, RF-06.5, RF-07.3, design §4.8
- **Archivos permitidos:** `src/fragrance-scroll/lib/navigation.js`, `tests/unit/navigation.test.js`.
- **Aceptación:** hay tests para cada uno de estos casos:
  1. navegar hacia adelante y hacia atrás desde el medio;
  2. navegación ignorada mientras está bloqueado;
  3. salida por el borde inicial y por el final;
  4. el mismo gesto que llegó al borde no sale;
  5. un gesto distinto sí sale;
  6. salida encolada durante una transición hacia un borde, que se ejecuta en `UNLOCK`;
  7. salida encolada que no se ejecuta si el destino no es un borde;
  8. `CLOSE` limpia todo lo pendiente;
  9. `RESET` pone el índice.

  Además, VE.

## Fase 2: render estático

### T-2.1: `useViewport` + estilos base

- **Estado:** hecha
- **Cubre:** RF-03.5, RF-04.2, RNF-02, RNF-07
- **Archivos permitidos:** `src/fragrance-scroll/hooks/useViewport.js`, `src/fragrance-scroll/styles/fragrance-scroll.css`.
- **Pasos:**
  1. `useViewport`: devuelve `null` en el primer render y en el servidor; después devuelve `{ width, height }` y lo actualiza con `resize`, a lo sumo una vez por frame.
  2. CSS: portar de `L:section` las clases necesarias (`.display-item`, `.display-label*`, `.display-image`, overlay, botón Show, ✕, capas de fondo), con los selectores renombrados a un prefijo propio (`fs-`). Sin nada del tema (`html.fragrance-scroll-animated`, `.page-wrapper`, `.header-section`, `--layer-menu-drawer`).
- **Aceptación:** VE. La revisión del CSS lista qué clase del legacy corresponde a cada regla.

### T-2.2: Render estático del desplegado (sin botella 3D)

- **Estado:** hecha
- **Cubre:** RF-03, RF-04.1, RF-04.2, RF-06.6 (sólo el botón), RF-02.3, RF-02.4
- **Archivos permitidos:** `src/fragrance-scroll/FragranceScroll.jsx`, `src/fragrance-scroll/index.js`, `src/fragrance-scroll/components/{ExpandedView,Background,IngredientImage,Panel,CloseButton,BottlePoster}.jsx`, `src/sandbox/SandboxApp.jsx`.
- **Pasos:**
  1. `ExpandedView` muestra la fragancia 0 estática: fondo, overlay, un placeholder de botella (un rectángulo con borde en la posición y tamaño del producto, mediante `BottlePoster` sin imagen), la imagen de ingrediente y el panel.
  2. Por ahora un selector de desarrollo (`?i=0..9` en el sandbox) para ver cada fragancia.
- **Aceptación:**
  - **el usuario confirma visualmente** que la disposición coincide con el legacy en celular (vertical) y en desktop;
  - el resize reacomoda todo sin cambiar de fragancia;
  - VE.

### T-2.3: Test de SSR

- **Estado:** hecha
- **Cubre:** RNF-02
- **Archivos permitidos:** `tests/ssr/render.test.jsx`, `vitest.config.js` (sólo si hace falta habilitar JSX en los tests).
- **Aceptación:** `renderToString` de `FragranceScroll` en modo `expanded` no lanza errores; VE. El modo `collapsed` se suma a este test en T-5.1.

## Fase 3: botella 3D

### T-3.1: `loadThree` + `BottleRig`

- **Estado:** hecha
- **Cubre:** RF-05.1, RF-05.2, RF-05.4, RF-05.5, D-01, D-02
- **Archivos permitidos:** `package.json`, `package-lock.json` (sólo `three@0.185.1`), `src/fragrance-scroll/three/loadThree.js`, `src/fragrance-scroll/three/BottleRig.js`.
- **Pasos:**
  1. `npm i three@0.185.1`.
  2. Portar `L:scroll-bottle.js` a `BottleRig` según design §4.10: materiales, luces, cámara y constantes literales; sin pool; tilt marcado AJUSTE-02.
  3. Implementar `setLabel` con caché de texturas por URL.
- **Aceptación:**
  - revisión de código lado a lado con el legacy: el plan de la tarea tiene que listar cada constante y material portado;
  - `three` sólo se importa desde `loadThree.js` (se verifica con grep);
  - VE.

### T-3.2: `<Bottle>` persistente con póster provisorio

- **Estado:** hecha
- **Cubre:** RF-05.3, RF-05.6, RF-10.3
- **Archivos permitidos:** `src/fragrance-scroll/components/Bottle.jsx`, `src/fragrance-scroll/components/BottlePoster.jsx`, `src/fragrance-scroll/components/ExpandedView.jsx`, `src/sandbox/SandboxApp.jsx` (sólo el selector de desarrollo).
- **Pasos:**
  1. Reemplazar el placeholder por `<Bottle>`: un solo canvas y un `BottleRig` por montaje, el link AJUSTE-03 y el póster encima hasta `onFirstFrame` (mientras no haya pósters, el placeholder).
  2. Cambiar de fragancia con el selector de desarrollo llama a `setLabel`, **sin recrear** el canvas.
- **Aceptación:**
  - **el usuario confirma visualmente** que la botella se ve igual que en el legacy (vidrio ámbar, dorados, etiqueta);
  - en las DevTools, un solo `<canvas>` y un solo contexto WebGL al cambiar de fragancia 10 veces;
  - VE.

### T-3.3: Herramienta de pósters + generación

- **Estado:** hecha
- **Cubre:** RF-10.1, RF-10.2, RF-10.4, AJUSTE-11
- **Archivos permitidos:** `tools/posters/index.html`, `tools/posters/render-posters.js`, `vite.config.js` (sólo para agregar `tools/posters/index.html` como entrada de desarrollo), `public/fragrance-scroll/posters/*.webp`, `src/fragrance-scroll/config/assets.js` (sólo `posters`).
- **Pasos:**
  1. Una página de desarrollo que, con `BottleRig`, renderiza cada fragancia de frente (yaw 0) sobre un fondo transparente, a 1024 px de alto, y descarga `<slug-sin-guiones>.webp`.
  2. El usuario (o el agente, con el navegador) guarda los 10 archivos en `public/fragrance-scroll/posters/`.
  3. Completar `posters` en `assets.js`.
- **Aceptación:**
  - existen los 10 pósters;
  - **el usuario confirma** que, al superponer el póster y el canvas quieto, no hay diferencia visible;
  - VE.

### T-3.4: Verificación visual de etiquetas WebP

- **Estado:** hecha
- **Cubre:** AJUSTE-10
- **Archivos permitidos:** `docs/ajustes.md`; eventualmente `public/fragrance-scroll/labels/*.webp`, si hay que regenerarlas a calidad 95.
- **Aceptación:** **el usuario confirma** que las etiquetas se ven bien sobre la botella; AJUSTE-10 queda actualizado.

## Fase 4: navegación y transiciones

### T-4.1: `useNavigation`: swipe, rueda, teclado y timers

- **Estado:** hecha
- **Cubre:** RF-06.2 a RF-06.5, RF-07.3, RF-07.4, design §4.9
- **Archivos permitidos:** `src/fragrance-scroll/hooks/useNavigation.js`, `src/fragrance-scroll/components/ExpandedView.jsx`, `tests/unit/useNavigation.test.js` (sólo si la lógica testeable se extrae a funciones puras dentro del hook).
- **Pasos:** conectar el reducer con los listeners y los timers. Por ahora, el cambio de fragancia es un corte seco (sin coreografía).
- **Aceptación:**
  - el swipe en el emulador móvil de las DevTools avanza y retrocede de a una;
  - la rueda no cruza más de una fragancia por ruedada;
  - en los bordes se llama a `onCloseExpanded`;
  - no quedan timers al desmontar;
  - VE.

### T-4.2: Coreografía de la transición

- **Estado:** hecha
- **Cubre:** RF-04.3, RF-07.1, RF-07.2, RF-07.4
- **Archivos permitidos:** `src/fragrance-scroll/components/{ExpandedView,Bottle,Background,IngredientImage,Panel}.jsx`, `src/fragrance-scroll/styles/fragrance-scroll.css`, `src/fragrance-scroll/three/BottleRig.js` (sólo si falta algo de la API del design §4.10).
- **Aceptación:**
  - **el usuario confirma visualmente**, comparando con el legacy, cada punto de la línea de tiempo de RF-07: giro continuo sin frenazo, etiqueta cambiada de espaldas, ingrediente con fade y zoom, crossfade de fondo sólo en opacidad, panel direccional;
  - VE.

### T-4.3: Giro de carga inicial

- **Estado:** hecha
- **Cubre:** RF-07.5
- **Archivos permitidos:** `src/fragrance-scroll/components/{ExpandedView,Bottle,IngredientImage,Panel}.jsx`.
- **Aceptación:** **el usuario confirma visualmente** el giro de 2 s con el ingrediente apareciendo al 80%; VE.

### T-4.4: Prueba en Android de gama media

- **Estado:** pendiente
- **Cubre:** RNF-03
- **Archivos permitidos:** `docs/ajustes.md` y `docs/sdd/tasks.md` (sólo para registrar resultados). **Sin cambios de código:** si hay problemas, se proponen como cambio de spec o como tarea nueva.
- **Pasos:** el usuario abre el sandbox (`npm run dev -- --host`) en el teléfono y recorre las 10 fragancias.
- **Aceptación:** el usuario reporta la fluidez y cualquier demora; se registran los resultados.

## Fase 5: modo colapsado, precarga y sandbox

### T-5.1: Modo colapsado + abrir/cerrar simulados + última vista

- **Estado:** en verificación
- **Cubre:** RF-06.7, RF-08, RF-09, RF-12.1, RF-13.2, AJUSTE-04
- **Archivos permitidos:** `src/fragrance-scroll/components/{CollapsedView,ShowButton}.jsx`, `src/fragrance-scroll/FragranceScroll.jsx`, `src/fragrance-scroll/index.js` (sólo para exportar `localStorageStorage`), `src/fragrance-scroll/components/ExpandedView.jsx`, `src/fragrance-scroll/lib/storage.js`, `src/sandbox/SandboxApp.jsx`, `tests/unit/storage.test.js`, `tests/ssr/render.test.jsx`.
- **Aceptación:**
  - el colapsado no importa three (se verifica en la pestaña Network: no se pide three ni el GLB antes de la precarga);
  - abrir y cerrar funcionan;
  - al volver se ve la última fragancia vista, también después de recargar;
  - hay un test SSR del colapsado;
  - VE.

### T-5.1-fix: Salto entre el póster y la botella 3D al abrir el desplegado

- **Estado:** en verificación
- **Cubre:** RF-10.3 (el reemplazo del póster por el canvas es sin parpadeo), RF-03.5, RNF-03
- **Archivos permitidos:** `src/fragrance-scroll/hooks/useViewport.js`, `src/fragrance-scroll/three/BottleRig.js`.
- **Contexto:** al tocar "Show fragrances" pasan ~250 a 290 ms hasta que arranca el giro, con un bloqueo del hilo principal de ~150 ms (PMREM + compilación de shaders). Además, el colapsado puede quedar calculado con un ancho distinto al del desplegado (media barra de scroll ≈ 7,5 px).
- **Aceptación:**
  - el `longtask` de la primera apertura baja de forma medible respecto de los ~145 a 166 ms de hoy;
  - el póster no se quita hasta que el canvas ya se compuso al menos un frame;
  - el póster y el título no se corren al pasar del colapsado al desplegado;
  - **el usuario confirma visualmente** que el salto desapareció o que mejoró, y en ese caso se registra qué queda;
  - VE.

### T-5.2: Precarga

- **Estado:** pendiente
- **Cubre:** RF-11, AJUSTE-12
- **Archivos permitidos:** `src/fragrance-scroll/lib/preload.js`, `src/fragrance-scroll/components/CollapsedView.jsx`, `tests/unit/preload.test.js`.
- **Aceptación:**
  - en la pestaña Network, después del `load` se descargan, en orden, three, el GLB, las etiquetas y el resto;
  - con `saveData` simulado no se descarga nada;
  - VE.

### T-5.3: Sandbox: secciones de relleno

- **Estado:** pendiente
- **Cubre:** RF-13.1, AJUSTE-05
- **Archivos permitidos:** `src/sandbox/{SandboxApp,FillerSection}.jsx`, `src/sandbox/sandbox.css`.
- **Aceptación:** hay dos secciones antes y una después del bloque colapsado, y el scroll normal funciona; VE.

## Fase 6: cierre

### T-6.1: Auditoría final contra la spec

- **Estado:** pendiente
- **Archivos permitidos:** `docs/**` (sólo para registrar resultados).
- **Pasos:** pedir `auditar` (ver `CLAUDE.md`): cada RF y RNF tiene que tener implementación y verificación; cada AJUSTE tiene que estar reflejado en el código con su comentario.
- **Aceptación:** un informe sin desvíos, o con desvíos convertidos en tareas nuevas.

## Fase 7: Tapcart (bloqueada)

Se detalla cuando haya acceso (disparador T1 de `docs/ajustes.md`). Incluye:
- el bloque de prueba (three.js + swipe),
- el empaquetado de `src/fragrance-scroll/` como bloque,
- reemplazar `openExpanded`/`closeExpanded`, el storage y los assets (AJUSTE-04, 06 y 11),
- quitar lo marcado para T2 (AJUSTE-01, 02 y 05),
- el deep link y el botón de compartir (AJUSTE-13).
