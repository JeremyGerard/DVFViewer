import { useEffect, useState } from 'react'
import SearchBar from './components/SearchBar'
import MapView from './components/MapView'
import SidePanel from './components/SidePanel'
import { fetchDvfNearby } from './services/dvf'
import type { AddressSuggestion, DvfMutation } from './types'
import './App.css'

export default function App() {
  const [selected, setSelected] = useState<AddressSuggestion | null>(null)
  const [mutations, setMutations] = useState<DvfMutation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  useEffect(() => {
    if (!selected) return
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    setMutations([])
    setPanelOpen(true)

    fetchDvfNearby({ lat: selected.lat, lon: selected.lon }, ctrl.signal)
      .then((rows) => {
        rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        setMutations(rows)
      })
      .catch((err) => {
        if ((err as { name?: string }).name !== 'AbortError') {
          console.error(err)
          setError("Impossible de charger les données DVF pour cette adresse.")
        }
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [selected])

  return (
    <div className="app">
      <div className="map-wrapper">
        <MapView
          selected={selected}
          mutations={mutations}
          highlightedId={highlightedId}
          onMutationClick={(id) => setHighlightedId(id)}
        />
      </div>

      <SearchBar onSelect={setSelected} />

      <SidePanel
        open={panelOpen && !!selected}
        loading={loading}
        error={error}
        address={selected}
        mutations={mutations}
        highlightedId={highlightedId}
        onHover={setHighlightedId}
        onClose={() => setPanelOpen(false)}
      />

      {!panelOpen && selected && (
        <button
          className="reopen-btn"
          onClick={() => setPanelOpen(true)}
          aria-label="Rouvrir le panneau"
        >
          ›
        </button>
      )}
    </div>
  )
}
