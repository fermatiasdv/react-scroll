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
  ingredients: {
    rebellious: '/fragrance-scroll/ingredients/rebellious.webp',
    forbidden_flower: '/fragrance-scroll/ingredients/forbiddenflower.webp',
    wonder_of_the_world: '/fragrance-scroll/ingredients/wonderoftheworld.webp',
    painkiller: '/fragrance-scroll/ingredients/painkiller.webp',
    jagged_edge: '/fragrance-scroll/ingredients/jaggededge.webp',
    crimson_desert: '/fragrance-scroll/ingredients/crimsondesert.webp',
    glitterati: '/fragrance-scroll/ingredients/glitterati.webp',
    ecstasy: '/fragrance-scroll/ingredients/ecstasy.webp',
    epicurean: '/fragrance-scroll/ingredients/epicurean.webp',
    london_legend: '/fragrance-scroll/ingredients/londonlegend.webp',
  },
  // Se completa en T-3.3, cuando se generen los pósters.
  posters: {},
}
