// Constantes de tiempo y easings, con los valores del legacy (RF-04, RF-07).

// L:scroll-styles.js
export const COLLAPSE_TO_CENTER_MS = 500
export const WORD_FADE_STAGGER_MS = 60
export const DIRECTIONAL_ENTER_OFFSET_PX = 48
export const INGREDIENT_ZOOM_SCALE = 0.5 // TEST_ITEM_ZOOM_SCALE del legacy

// L:scroll-config.js
export const LOCK_MS = 50
export const BACKGROUND_TRANSITION_MS = 500
export const LABEL_TRANSITION_MS = 350
export const WORD_FADE_MS = 300

// L:scroll-bottle.js
export const SPIN_DURATION_MS = 2000
export const SPIN_REVEAL_FRACTION = 0.8
export const easeInCubic = (t) => t * t * t
export const easeOutCubic = (t) => 1 - (1 - t) ** 3
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2)
