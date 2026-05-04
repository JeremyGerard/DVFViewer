import type { DvfMutation } from '../types'

/**
 * The Cerema `libtypbien` is verbose ("UN APPARTEMENT", "DEUX MAISONS", etc.).
 * We expose a short, capitalized label for compact UIs.
 */
export function typeBienShortLabel(m: DvfMutation): string {
  if (m.nbAppartements > 0 && m.nbMaisons === 0) {
    return m.nbAppartements > 1 ? `${m.nbAppartements} appartements` : 'Appartement'
  }
  if (m.nbMaisons > 0 && m.nbAppartements === 0) {
    return m.nbMaisons > 1 ? `${m.nbMaisons} maisons` : 'Maison'
  }
  if (m.nbAppartements > 0 && m.nbMaisons > 0) {
    return 'Mixte (apt + maison)'
  }
  if (m.typeBien.includes('terrain')) return 'Terrain'
  if (m.typeBien.includes('local')) return 'Local'
  if (m.typeBien.includes('dependance')) return 'Dépendance'
  // Fallback: capitalize first letter of the raw libtypbien
  const t = m.typeBien.trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Bien'
}
