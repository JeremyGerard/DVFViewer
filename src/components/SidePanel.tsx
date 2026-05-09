import { useState } from 'react'
import type { AddressSuggestion, DvfMutation, ParcelGroup } from '../types'
import { typeBienShortLabel } from '../utils/labels'
import { fmtDistance } from '../utils/grouping'
import './SidePanel.css'

interface Props {
  open: boolean
  loading: boolean
  error: string | null
  address: AddressSuggestion | null
  groups: ParcelGroup[]
  highlightedParcelId: string | null
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

function groupColor(g: ParcelGroup): string {
  const m = g.mutations[0]
  if (m.nbMaisons > 0) return '#10b981'
  if (m.nbAppartements > 0) return '#2563eb'
  if (m.typeBien.includes('terrain')) return '#a16207'
  if (m.typeBien.includes('local') || m.typeBien.includes('commercial'))
    return '#f59e0b'
  return '#9333ea'
}

export default function SidePanel({
  open,
  loading,
  error,
  address,
  groups,
  highlightedParcelId,
  onHover,
  onClose,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const totalMutations = groups.reduce((acc, g) => acc + g.mutations.length, 0)
  return (
    <aside
      className={`sidepanel ${open ? 'is-open' : ''} ${
        expanded ? 'is-expanded' : ''
      }`}
    >
      <button
        type="button"
        className="sidepanel-grabber"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? 'Réduire le panneau' : 'Agrandir le panneau'}
      >
        <span className="sidepanel-grabber-bar" />
      </button>

      <header className="sidepanel-header">
        <div className="sidepanel-header-text">
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
        {!loading && !error && groups.length === 0 && address && (
          <div className="sidepanel-status">
            Aucune transaction trouvée à proximité de cette adresse.
          </div>
        )}

        {!loading && groups.length > 0 && (
          <>
            <div className="sidepanel-summary">
              <strong>{groups.length}</strong> parcelle
              {groups.length > 1 ? 's' : ''} ·{' '}
              <strong>{totalMutations}</strong> transaction
              {totalMutations > 1 ? 's' : ''}
            </div>
            <ul className="mutation-list">
              {groups.map((g) => {
                const color = groupColor(g)
                const isHi = highlightedParcelId === g.parcelId
                return (
                  <li
                    key={g.parcelId}
                    className={`mutation-card ${isHi ? 'is-highlighted' : ''}`}
                    onMouseEnter={() => onHover(g.parcelId)}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => onHover(g.parcelId)}
                  >
                    <div className="mutation-row">
                      <span className="parcel-num" style={{ background: color }}>
                        {g.index}
                      </span>
                      <div className="mutation-row-text">
                        <div className="mutation-address">
                          Parcelle {g.parcelId}
                        </div>
                        <div className="muted parcel-distance">
                          à {fmtDistance(g.distance)} ·{' '}
                          {g.mutations.length} transaction
                          {g.mutations.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <ul className="parcel-timeline">
                      {g.mutations.map((m) => {
                        const ppm2 = pricePerM2(m)
                        return (
                          <li key={m.id} className="parcel-timeline-item">
                            <div className="ptl-row">
                              <span className={`badge badge-${badgeKey(m)}`}>
                                {typeBienShortLabel(m)}
                              </span>
                              <span className="mutation-date">
                                {fmtDate(m.date)}
                              </span>
                            </div>
                            <div className="mutation-price">
                              <span className="price-main">
                                {fmtEur(m.valeur)}
                              </span>
                              {ppm2 != null && (
                                <span className="price-m2">
                                  {fmtEur(ppm2)} / m²
                                </span>
                              )}
                            </div>
                            <div className="mutation-meta">
                              {m.surfaceBati != null && m.surfaceBati > 0 && (
                                <span>{m.surfaceBati} m² bâti</span>
                              )}
                              {m.surfaceTerrain != null &&
                                m.surfaceTerrain > 0 && (
                                  <span>terrain {m.surfaceTerrain} m²</span>
                                )}
                              {m.vefa && <span>VEFA</span>}
                              <span className="muted">{m.nature}</span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
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
