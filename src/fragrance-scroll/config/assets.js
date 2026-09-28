// AJUSTE-06: assets servidos localmente desde public/fragrance-scroll/. Ver docs/ajustes.md.

// Único objeto con URLs de assets (RF-02.1). Las claves de `labels`, `ingredients` y `posters`
// son el slug de la fragancia; los nombres de archivo van sin guiones bajos.
// Painkiller no tiene etiqueta propia: usa `labels.default` (RF-02.2).
export const DEFAULT_ASSETS = {
  model: '/fragrance-scroll/model/bottle.glb',
  labels: {
    default: '/fragrance-scroll/labels/default.webp',
    rebellious: '/fragrance-scroll/labels/rebellious.webp',
    forbidden_flower: '/fragrance-scroll/labels/forbiddenflower.webp',
    wonder_of_the_world: '/fragrance-scroll/labels/wonderoftheworld.webp',
    jagged_edge: '/fragrance-scroll/labels/jaggededge.webp',
    crimson_desert: '/fragrance-scroll/labels/crimsondesert.webp',
    glitterati: '/fragrance-scroll/labels/glitterati.webp',
    ecstasy: '/fragrance-scroll/labels/ecstasy.webp',
    epicurean: '/fragrance-scroll/labels/epicurean.webp',
    london_legend: '/fragrance-scroll/labels/londonlegend.webp',
  },
  backgrounds: [
    '/fragrance-scroll/backgrounds/bg-1.jpg',
    '/fragrance-scroll/backgrounds/bg-2.webp',
    '/fragrance-scroll/backgrounds/bg-3.webp',
    '/fragrance-scroll/backgrounds/bg-4.webp',
  ],
  // 3 variantes por fragancia (RF-02.4): se elige una al azar cada vez que el ingrediente
  // pasa a visible.
  ingredients: {
    rebellious: [
      '/fragrance-scroll/ingredients/rebellious-1.webp',
      '/fragrance-scroll/ingredients/rebellious-2.webp',
      '/fragrance-scroll/ingredients/rebellious-3.webp',
    ],
    forbidden_flower: [
      '/fragrance-scroll/ingredients/forbiddenflower-1.webp',
      '/fragrance-scroll/ingredients/forbiddenflower-2.webp',
      '/fragrance-scroll/ingredients/forbiddenflower-3.webp',
    ],
    wonder_of_the_world: [
      '/fragrance-scroll/ingredients/wonderoftheworld-1.webp',
      '/fragrance-scroll/ingredients/wonderoftheworld-2.webp',
      '/fragrance-scroll/ingredients/wonderoftheworld-3.webp',
    ],
    painkiller: [
      '/fragrance-scroll/ingredients/painkiller-1.webp',
      '/fragrance-scroll/ingredients/painkiller-2.webp',
      '/fragrance-scroll/ingredients/painkiller-3.webp',
    ],
    jagged_edge: [
      '/fragrance-scroll/ingredients/jaggededge-1.webp',
      '/fragrance-scroll/ingredients/jaggededge-2.webp',
      '/fragrance-scroll/ingredients/jaggededge-3.webp',
    ],
    crimson_desert: [
      '/fragrance-scroll/ingredients/crimsondesert-1.webp',
      '/fragrance-scroll/ingredients/crimsondesert-2.webp',
      '/fragrance-scroll/ingredients/crimsondesert-3.webp',
    ],
    glitterati: [
      '/fragrance-scroll/ingredients/glitterati-1.webp',
      '/fragrance-scroll/ingredients/glitterati-2.webp',
      '/fragrance-scroll/ingredients/glitterati-3.webp',
    ],
    ecstasy: [
      '/fragrance-scroll/ingredients/ecstasy-1.webp',
      '/fragrance-scroll/ingredients/ecstasy-2.webp',
      '/fragrance-scroll/ingredients/ecstasy-3.webp',
    ],
    epicurean: [
      '/fragrance-scroll/ingredients/epicurean-1.webp',
      '/fragrance-scroll/ingredients/epicurean-2.webp',
      '/fragrance-scroll/ingredients/epicurean-3.webp',
    ],
    london_legend: [
      '/fragrance-scroll/ingredients/londonlegend-1.webp',
      '/fragrance-scroll/ingredients/londonlegend-2.webp',
      '/fragrance-scroll/ingredients/londonlegend-3.webp',
    ],
  },
  // Generados con tools/posters (AJUSTE-11): hay que regenerarlos si cambia el modelo, un material,
  // la luz, una etiqueta o la cámara.
  posters: {
    rebellious: '/fragrance-scroll/posters/rebellious.webp',
    forbidden_flower: '/fragrance-scroll/posters/forbiddenflower.webp',
    wonder_of_the_world: '/fragrance-scroll/posters/wonderoftheworld.webp',
    painkiller: '/fragrance-scroll/posters/painkiller.webp',
    jagged_edge: '/fragrance-scroll/posters/jaggededge.webp',
    crimson_desert: '/fragrance-scroll/posters/crimsondesert.webp',
    glitterati: '/fragrance-scroll/posters/glitterati.webp',
    ecstasy: '/fragrance-scroll/posters/ecstasy.webp',
    epicurean: '/fragrance-scroll/posters/epicurean.webp',
    london_legend: '/fragrance-scroll/posters/londonlegend.webp',
  },
}
