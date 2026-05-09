import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { AddressSuggestion, DvfMutation, ParcelGroup } from '../types'
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
  groups: ParcelGroup[]
  highlightedParcelId: string | null
  onParcelClick: (id: string) => void
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

const fmtDate = (s?: string) => {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('fr-FR')
}

function numberIcon(index: number, color: string, hi: boolean): L.DivIcon {
  return L.divIcon({
    html: `<div class="parcel-label${hi ? ' is-hi' : ''}" style="background:${
      hi ? '#dc2626' : color
    }">${index}</div>`,
    className: 'parcel-label-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export default function MapView({
  selected,
  groups,
  highlightedParcelId,
  onParcelClick,
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
        <>
          <Marker position={[selected.lat, selected.lon]}>
            <Popup>{selected.label}</Popup>
          </Marker>
          {selected.accuracy != null && selected.accuracy > 0 && (
            <Circle
              center={[selected.lat, selected.lon]}
              radius={selected.accuracy}
              pathOptions={{
                color: '#2563eb',
                weight: 1,
                fillColor: '#2563eb',
                fillOpacity: 0.12,
              }}
            />
          )}
        </>
      )}

      {groups.map((g) => {
        if (!g.geometry.length) return null
        const isHi = highlightedParcelId === g.parcelId
        const ref = g.mutations[0]
        const color = colorFor(ref)
        return (
          <Polygon
            key={g.parcelId}
            positions={g.geometry}
            pathOptions={{
              color: isHi ? '#dc2626' : color,
              weight: isHi ? 3 : 1.5,
              fillColor: color,
              fillOpacity: isHi ? 0.55 : 0.25,
            }}
            eventHandlers={{ click: () => onParcelClick(g.parcelId) }}
          >
            <Popup>
              <div className="parcel-popup">
                <div className="parcel-popup-head">
                  <span className="parcel-popup-num" style={{ background: color }}>
                    {g.index}
                  </span>
                  <strong>Parcelle {g.parcelId}</strong>
                </div>
                <ul className="parcel-popup-list">
                  {g.mutations.map((m) => (
                    <li key={m.id}>
                      <span className="ppl-date">{fmtDate(m.date)}</span>
                      <strong className="ppl-price">{fmtEur(m.valeur)}</strong>
                      <span className="ppl-meta">
                        {typeBienShortLabel(m)}
                        {m.surfaceBati ? ` · ${m.surfaceBati} m²` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Polygon>
        )
      })}

      {groups.map((g) => {
        if (!g.centroid) return null
        const isHi = highlightedParcelId === g.parcelId
        const color = colorFor(g.mutations[0])
        return (
          <Marker
            key={`label-${g.parcelId}`}
            position={g.centroid}
            icon={numberIcon(g.index, color, isHi)}
            eventHandlers={{ click: () => onParcelClick(g.parcelId) }}
            keyboard={false}
          />
        )
      })}

      <FlyTo target={selected} />
    </MapContainer>
  )
}
