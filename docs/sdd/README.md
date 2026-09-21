# Migración a React con SDD: guía de pasos

Esta migración se hace con **Spec-Driven Development (SDD)**: primero se escribe y se aprueba **qué** se construye (spec) y **cómo** (diseño), después se descompone en tareas, y recién ahí se escribe código, **una tarea a la vez y sólo con el OK explícito del usuario**.

Esta guía está pensada para correr la migración con **Claude Sonnet** en Claude Code, con el skill `sdd-guard` como guardián del proceso.

## Documentos

| Documento | Qué define | Quién lo cambia |
|---|---|---|
| [`spec.md`](spec.md) | **Qué** tiene que hacer el producto: requisitos (`RF-xx`, `RNF-xx`) con criterios de aceptación. Es la fuente de verdad del comportamiento. | Sólo con aprobación del usuario. |
| [`design.md`](design.md) | **Cómo** se construye: arquitectura, módulos, contratos, estado, mapeo legacy → React. | Sólo con aprobación del usuario. |
| [`tasks.md`](tasks.md) | **En qué orden**: tareas `T-x.y` con archivos permitidos, pasos, criterios de aceptación y estado. | El agente actualiza **sólo el estado** de las tareas. |
| [`../ajustes.md`](../ajustes.md) | Lo que queda en prueba o provisorio (`AJUSTE-NN`) y cuándo se quita. | El agente lo actualiza cuando una tarea agrega o aplica un ajuste. |
| `legacy/my-initial-store/` | **Fuente de verdad del comportamiento actual** (tema de Shopify). `legacy/labs-scroll/` es sólo el primer prototipo. | Nadie. Es de sólo lectura. |

La guía original de migración en PDF está **desactualizada en varios puntos**. Ante cualquier diferencia, mandan en este orden: `spec.md` → `design.md` → el código de `legacy/my-initial-store/` → el PDF.

## Reglas

1. **No se escribe código sin OK.** El agente puede leer, analizar y proponer cambios a los documentos, pero **no crea ni modifica archivos de código** (`src/`, `tests/`, `tools/`, `public/`, `package.json`, configs) hasta que el usuario apruebe **esa tarea puntual**, por ejemplo `OK T-1.2`.
2. **Un OK = una tarea.** El OK de una tarea no autoriza la siguiente, ni "arreglar algo de paso" en otra.
3. **Nada por fuera de la spec.** Si durante una tarea aparece algo que la spec o el diseño no cubren (un comportamiento, un archivo, una dependencia, una optimización), el agente **se detiene**, propone el cambio en el documento y espera aprobación. Nunca lo resuelve "por su cuenta" en el código.
4. **Sólo los archivos permitidos.** Cada tarea lista los archivos que puede tocar. Tocar cualquier otro es salirse de la tarea.
5. **Sin dependencias nuevas** que no estén en `design.md`.
6. **Todo lo provisorio lleva `AJUSTE-NN`**, con un comentario en el código y una entrada en `docs/ajustes.md`.
7. **Cada tarea termina verificada:** criterios de aceptación cumplidos, `npm run test`, `npm run lint` y `npm run build` en verde, y estado actualizado en `tasks.md`.

## Flujo por tarea

```
┌────────────┐   ┌──────────────┐   ┌───────────┐   ┌─────────────┐   ┌──────────────┐
│ 1. Elegir  │ → │ 2. Plan de   │ → │ 3. OK del │ → │ 4. Imple-   │ → │ 5. Verificar │
│    tarea   │   │    la tarea  │   │   usuario │   │    mentar   │   │  y cerrar    │
└────────────┘   └──────────────┘   └───────────┘   └─────────────┘   └──────────────┘
                   (sin código)      "OK T-x.y"      (sólo archivos     (checklist del
                                                       permitidos)       skill + estado)
```

1. **Elegir la tarea:** la próxima de `tasks.md` en estado `pendiente` cuyas dependencias estén en `hecha`.
2. **Plan de la tarea:** el agente lee la tarea, los requisitos que cubre y el legacy que cita, y presenta un plan corto: archivos a crear o modificar (todos dentro de los permitidos), qué hace cada uno, cómo se verifica y qué dudas hay. **Sin código.**
3. **OK del usuario:** el usuario responde `OK T-x.y`, o pide cambios al plan o a los documentos.
4. **Implementar:** sólo lo del plan aprobado, sólo en los archivos permitidos. El estado de la tarea pasa a `en curso`.
5. **Verificar y cerrar:** el agente corre la verificación del skill (criterios de aceptación, tests, lint, build, desvíos contra la spec) y reporta. Si todo está bien, la tarea pasa a `hecha`. Si algo falla, lo reporta y **no** pasa a la siguiente tarea.

## Cómo correrlo con Sonnet en Claude Code

### Preparación (una vez)

1. Abrir Claude Code en la raíz del proyecto (`react-scroll/`).
2. Elegir el modelo: `/model sonnet`.
3. Verificar que el skill esté disponible: al escribir `/sdd-guard` debería aparecer en la lista.

### Ciclo de trabajo

**Arrancar una sesión o retomar el trabajo:**

```
/sdd-guard estado
```

El agente lee los documentos, muestra en qué tarea está la migración y cuál es la próxima.

**Pedir el plan de la próxima tarea (sin código):**

```
/sdd-guard planificar T-1.2
```

**Aprobar la implementación:**

```
OK T-1.2
```

**Verificar al terminar (o en cualquier momento):**

```
/sdd-guard verificar T-1.2
```

**Auditar todo el código contra la spec** (por ejemplo, antes de cerrar una fase):

```
/sdd-guard auditar
```

**Proponer un cambio a la spec** cuando algo no está cubierto:

```
/sdd-guard proponer-cambio "<descripción>"
```

El agente edita `spec.md`, `design.md` o `tasks.md` y muestra el cambio. El cambio queda vigente sólo cuando el usuario lo aprueba.

### Consejos para Sonnet

- **Una tarea por sesión o por tramo de conversación.** Si la conversación se hace larga, conviene `/clear` y retomar con `/sdd-guard estado`: los documentos guardan todo el contexto necesario.
- **No pedir "seguí con todo".** El proceso está pensado para aprobar tarea por tarea.
- **Si el agente propone algo que no está en la spec,** la respuesta correcta es pedirle que lo escriba como propuesta de cambio (`proponer-cambio`), no aprobarlo como código.
- **Tareas visuales:** algunas (la botella, las transiciones, los pósters) necesitan que el usuario mire el resultado en el navegador. El agente tiene que pedirlo explícitamente y no marcarlas `hecha` sin la confirmación visual del usuario.

## Estados de una tarea

| Estado | Significado |
|---|---|
| `pendiente` | No empezó. |
| `plan propuesto` | El agente presentó el plan; espera OK. |
| `en curso` | Con OK; se está implementando. |
| `en verificación` | Implementada; falta verificación o la confirmación visual del usuario. |
| `hecha` | Verificada y cerrada. |
| `bloqueada` | Depende de algo externo (por ejemplo, acceso a Tapcart). Se anota el motivo. |
