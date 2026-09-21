import ExpandedView from './components/ExpandedView.jsx'
import './styles/fragrance-scroll.css'

// Raíz del componente reutilizable. Recibe por props lo que en Tapcart vendrá de afuera (D-06).
export default function FragranceScroll({ assets, fragrances, initialSlug, onCloseExpanded }) {
  return (
    <ExpandedView
      assets={assets}
      fragrances={fragrances}
      initialSlug={initialSlug}
      onCloseExpanded={onCloseExpanded}
    />
  )
}
