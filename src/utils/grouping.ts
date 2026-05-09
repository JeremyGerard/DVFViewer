import type { DvfMutation, LatLng, ParcelGroup } from '../types'

const EARTH_RADIUS_M = 6_371_000

/** Haversine distance in meters between two [lat, lng] points. */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/**
 * Group mutations by their primary parcel id, sort the groups by distance
 * to the origin point ascending, and assign a 1-based display index.
 * Mutations within each group are sorted by date descending.
 */
export function groupByParcel(
  mutations: DvfMutation[],
  origin: LatLng,
): ParcelGroup[] {
  const byParcel = new Map<string, DvfMutation[]>()
  for (const m of mutations) {
    const key = m.parcelles[0] ?? m.id
    const list = byParcel.get(key)
    if (list) list.push(m)
    else byParcel.set(key, [m])
  }

  const groups: Omit<ParcelGroup, 'index'>[] = []
  for (const [parcelId, muts] of byParcel) {
    muts.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    const ref = muts[0]
    groups.push({
      parcelId,
      geometry: ref.geometry,
      centroid: ref.centroid,
      distance: haversineDistance(origin, ref.centroid),
      mutations: muts,
    })
  }

  groups.sort((a, b) => a.distance - b.distance)
  return groups.map((g, i) => ({ ...g, index: i + 1 }))
}

export function fmtDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`
}
