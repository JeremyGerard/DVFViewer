import { useEffect, useMemo, useState } from 'react'
import SearchBar from './components/SearchBar'
import MapView from './components/MapView'
import SidePanel from './components/SidePanel'
import { fetchDvfNearby } from './services/dvf'
import { reverseGeocode } from './services/geocoding'
import { groupByParcel } from './utils/grouping'
import type { AddressSuggestion, DvfMutation } from './types'
import './App.css'

export default function App() {
  const [selected, setSelected] = useState<AddressSuggestion | null>(null)
  const [mutations, setMutations] = useState<DvfMutation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [highlightedParcelId, setHighlightedParcelId] = useState<string | null>(
    null,
  )
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    if (!selected) return
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    setMutations([])
    setPanelOpen(true)
    setHighlightedParcelId(null)

    fetchDvfNearby({ lat: selected.lat, lon: selected.lon }, ctrl.signal)
      .then((rows) => setMutations(rows))
      .catch((err) => {
        if ((err as { name?: string }).name !== 'AbortError') {
          console.error(err)
          setError("Impossible de charger les données DVF pour cette adresse.")
        }
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [selected])

  const groups = useMemo(() => {
    if (!selected || mutations.length === 0) return []
    return groupByParcel(mutations, [selected.lat, selected.lon])
  }, [mutations, selected])

  const handleGeolocate = () => {
    if (!('geolocation' in navigator)) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.")
      return
    }
    setGeoError(null)
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        try {
          const rev = await reverseGeocode(latitude, longitude)
          setSelected({
            label: rev?.label || 'Ma position',
            fullText: rev?.fullText || 'Ma position',
            lat: latitude,
            lon: longitude,
            postcode: rev?.postcode,
            city: rev?.city,
            street: rev?.street,
            housenumber: rev?.housenumber,
            accuracy,
          })
        } catch {
          setSelected({
            label: 'Ma position',
            fullText: 'Ma position',
            lat: latitude,
            lon: longitude,
            accuracy,
          })
        } finally {
          setGeoLoading(false)
        }
      },
      (err) => {
        setGeoLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Permission de géolocalisation refusée.')
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Localisation trop longue, réessayez à découvert.')
        } else {
          setGeoError('Impossible de récupérer votre position.')
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  }

  return (
    <div className="app">
      <div className="map-wrapper">
        <MapView
          selected={selected}
          groups={groups}
          highlightedParcelId={highlightedParcelId}
          onParcelClick={setHighlightedParcelId}
        />
      </div>

      <SearchBar onSelect={setSelected} />

      <button
        type="button"
        className={`geo-fab ${geoLoading ? 'is-loading' : ''}`}
        onClick={handleGeolocate}
        disabled={geoLoading}
        aria-label="Me géolocaliser"
        title="Me géolocaliser"
      >
        <svg
          className="geo-fab-icon"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="1" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="23" />
          <line x1="1" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="23" y2="12" />
        </svg>
      </button>

      {geoError && (
        <div className="geo-toast" role="alert" onClick={() => setGeoError(null)}>
          {geoError}
        </div>
      )}

      <SidePanel
        open={panelOpen && !!selected}
        loading={loading}
        error={error}
        address={selected}
        groups={groups}
        highlightedParcelId={highlightedParcelId}
        onHover={setHighlightedParcelId}
        onClose={() => setPanelOpen(false)}
      />

      {!panelOpen && selected && (
        <button
          className="reopen-btn"
          onClick={() => setPanelOpen(true)}
          aria-label="Rouvrir le panneau des transactions"
        >
          <span className="reopen-btn-arrow">›</span>
          <span className="reopen-btn-label">
            {groups.length > 0
              ? `${groups.length} parcelle${groups.length > 1 ? 's' : ''}`
              : 'Voir les résultats'}
          </span>
        </button>
      )}
    </div>
  )
}
