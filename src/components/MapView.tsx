import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { AddressSuggestion, DvfMutation } from '../types'
import { typeBienShortLabel } from '../utils/labels'

// Fix default marker icons (Leaflet default assets don't load via bundlers)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface Props {
  selected: AddressSuggestion | null
  mutations: DvfMutation[]
  highlightedId: string | null
  onMutationClick: (id: string) => void
}

function FlyTo({ target }: { target: AddressSuggestion | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lon], 18, { duration: 0.8 })
    }
  }, [target, map])
  return null
}

function colorFor(m: DvfMutation): string {
  if (m.nbMaisons > 0) return '#10b981'
  if (m.nbAppartements > 0) return '#2563eb'
  if (m.typeBien.includes('terrain')) return '#a16207'
  if (m.typeBien.includes('local') || m.typeBien.includes('commercial'))
    return '#f59e0b'
  return '#9333ea'
}

const fmtEur = (v: number | null) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(v)

export default function MapView({
  selected,
  mutations,
  highlightedId,
  onMutationClick,
}: Props) {
  return (
    <MapContainer
      center={[46.6, 2.5]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {selected && (
        <Marker position={[selected.lat, selected.lon]}>
          <Popup>{selected.label}</Popup>
        </Marker>
      )}

      {mutations.map((m) => {
        if (!m.geometry.length) return null
        const isHi = highlightedId === m.id
        const color = colorFor(m)
        return (
          <Polygon
            key={m.id}
            positions={m.geometry}
            pathOptions={{
              color: isHi ? '#dc2626' : color,
              weight: isHi ? 3 : 1.5,
              fillColor: color,
              fillOpacity: isHi ? 0.55 : 0.25,
            }}
            eventHandlers={{ click: () => onMutationClick(m.id) }}
          >
            <Popup>
              <div style={{ fontSize: 12, minWidth: 180 }}>
                <strong>{typeBienShortLabel(m)}</strong>
                <br />
                <em>{m.date}</em> · {m.nature}
                <br />
                <strong>{fmtEur(m.valeur)}</strong>
                {m.surfaceBati ? <> · {m.surfaceBati} m²</> : null}
                <br />
                <span style={{ color: '#6b7280' }}>
                  Parcelle {m.parcelles[0] ?? '—'}
                </span>
              </div>
            </Popup>
          </Polygon>
        )
      })}

      <FlyTo target={selected} />
    </MapContainer>
  )
}
