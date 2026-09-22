import CollapsedView from './components/CollapsedView.jsx'
import ExpandedView from './components/ExpandedView.jsx'
import './styles/fragrance-scroll.css'

// Raíz del componente reutilizable. Recibe por props lo que en Tapcart vendrá de afuera (D-06, RF-13.2):
// la config de assets, el texto del botón, el storage y las funciones de abrir y cerrar el desplegado.
//  - `mode`: 'collapsed' (el bloque en la home) o 'expanded' (la pantalla desplegada).
//  - `initialSlug`: fragancia con la que arranca el desplegado (RF-12.1).
//  - `storage`: `{ get, set }` para la última vista (RF-09.3). Sin él, no se lee ni se guarda nada.
//  - `onOpenExpanded(slug)` y `onCloseExpanded()`: abrir y cerrar el desplegado (AJUSTE-04 en el sandbox).
export default function FragranceScroll({
  mode,
  assets,
  fragrances,
  initialSlug,
  storage,
  showLabel,
  onOpenExpanded,
  onCloseExpanded,
}) {
  if (mode === 'expanded') {
    return (
      <ExpandedView
        assets={assets}
        fragrances={fragrances}
        initialSlug={initialSlug}
        storage={storage}
        onCloseExpanded={onCloseExpanded}
      />
    )
  }
  return (
    <CollapsedView
      assets={assets}
      fragrances={fragrances}
      storage={storage}
      showLabel={showLabel}
      onOpenExpanded={onOpenExpanded}
    />
  )
}
