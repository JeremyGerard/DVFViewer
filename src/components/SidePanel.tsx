import type { AddressSuggestion, DvfMutation } from '../types'
import { typeBienShortLabel } from '../utils/labels'
import './SidePanel.css'

interface Props {
  open: boolean
  loading: boolean
  error: string | null
  address: AddressSuggestion | null
  mutations: DvfMutation[]
  highlightedId: string | null
  onHover: (id: string | null) => void
  onClose: () => void
}

const fmtEur = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(v)

const fmtDate = (s?: string) => {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('fr-FR')
}

const pricePerM2 = (m: DvfMutation) => {
  if (!m.valeur || !m.surfaceBati) return null
  return Math.round(m.valeur / m.surfaceBati)
}

const badgeKey = (m: DvfMutation) => {
  if (m.nbAppartements > 0 && m.nbMaisons === 0) return 'appartement'
  if (m.nbMaisons > 0 && m.nbAppartements === 0) return 'maison'
  if (m.typeBien.includes('terrain')) return 'terrain'
  if (m.typeBien.includes('local') || m.typeBien.includes('commercial'))
    return 'local'
  return 'autre'
}

export default function SidePanel({
  open,
  loading,
  error,
  address,
  mutations,
  highlightedId,
  onHover,
  onClose,
}: Props) {
  return (
    <aside className={`sidepanel ${open ? 'is-open' : ''}`}>
      <header className="sidepanel-header">
        <div>
          <div className="sidepanel-eyebrow">Données DVF</div>
          <h2 className="sidepanel-title">
            {address ? address.label : 'Aucune adresse sélectionnée'}
          </h2>
          {address && (
            <div className="sidepanel-sub">
              {[address.postcode, address.city].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <button className="sidepanel-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </header>

      <div className="sidepanel-body">
        {loading && <div className="sidepanel-status">Chargement des transactions…</div>}
        {error && <div className="sidepanel-status sidepanel-error">{error}</div>}
        {!loading && !error && mutations.length === 0 && address && (
          <div className="sidepanel-status">
            Aucune transaction trouvée à proximité de cette adresse.
          </div>
        )}

        {!loading && mutations.length > 0 && (
          <>
            <div className="sidepanel-summary">
              <strong>{mutations.length}</strong> transaction
              {mutations.length > 1 ? 's' : ''} aux alentours
            </div>
            <ul className="mutation-list">
              {mutations.map((m) => {
                const ppm2 = pricePerM2(m)
                return (
                  <li
                    key={m.id}
                    className={`mutation-card ${
                      highlightedId === m.id ? 'is-highlighted' : ''
                    }`}
                    onMouseEnter={() => onHover(m.id)}
                    onMouseLeave={() => onHover(null)}
                  >
                    <div className="mutation-row">
                      <span className={`badge badge-${badgeKey(m)}`}>
                        {typeBienShortLabel(m)}
                      </span>
                      <span className="mutation-date">{fmtDate(m.date)}</span>
                    </div>
                    <div className="mutation-address">
                      <span className="muted">
                        Parcelle {m.parcelles[0] ?? '—'}
                        {m.parcelles.length > 1
                          ? ` (+${m.parcelles.length - 1})`
                          : ''}
                      </span>
                    </div>
                    <div className="mutation-price">
                      <span className="price-main">{fmtEur(m.valeur)}</span>
                      {ppm2 != null && (
                        <span className="price-m2">{fmtEur(ppm2)} / m²</span>
                      )}
                    </div>
                    <div className="mutation-meta">
                      {m.surfaceBati != null && m.surfaceBati > 0 && (
                        <span>{m.surfaceBati} m² bâti</span>
                      )}
                      {m.surfaceTerrain != null && m.surfaceTerrain > 0 && (
                        <span>terrain {m.surfaceTerrain} m²</span>
                      )}
                      {m.vefa && <span>VEFA</span>}
                      <span className="muted">{m.nature}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </aside>
  )
}
