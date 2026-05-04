import type { DvfMutation, LatLng, Polygon } from '../types'

// Cerema "API données foncières" - DVF+ open-data, geomutations endpoint.
// Returns a GeoJSON FeatureCollection with parcel polygons + mutation properties.
// CORS is enabled, so we can call it directly from the browser.
const CEREMA_GEOMUTATIONS = 'https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/'

interface CeremaProperties {
  idmutinvar?: string
  idopendata?: string
  datemut?: string
  anneemut?: number
  coddep?: string
  libnatmut?: string
  vefa?: boolean
  valeurfonc?: string | number | null
  l_codinsee?: string[]
  l_idpar?: string[]
  sterr?: string | number | null
  sbati?: string | number | null
  nblocmut?: number
  nblocmai?: number
  nblocapt?: number
  codtypbien?: string
  libtypbien?: string
}

interface CeremaFeature {
  id: number | string
  type: 'Feature'
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
  properties: CeremaProperties
}

interface CeremaResponse {
  type: 'FeatureCollection'
  count: number
  next: string | null
  previous: string | null
  features: CeremaFeature[]
}

export interface FetchDvfParams {
  lat: number
  lon: number
  /** half-side of the bounding box in degrees (~ 111km/deg), default ~150m */
  halfSpan?: number
}

const num = (v: string | number | null | undefined): number | null => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : null
}

const toLatLngRing = (ring: number[][]): LatLng[] =>
  ring.map(([lon, lat]) => [lat, lon] as LatLng)

const extractPolygon = (geom: CeremaFeature['geometry']): Polygon => {
  if (geom.type === 'Polygon') {
    return (geom.coordinates as number[][][]).map(toLatLngRing)
  }
  const mp = geom.coordinates as number[][][][]
  return mp[0]?.map(toLatLngRing) ?? []
}

const centroidOf = (poly: Polygon): LatLng => {
  const ring = poly[0] ?? []
  if (ring.length === 0) return [0, 0]
  let sLat = 0
  let sLng = 0
  for (const [lat, lng] of ring) {
    sLat += lat
    sLng += lng
  }
  return [sLat / ring.length, sLng / ring.length]
}

const normalize = (f: CeremaFeature): DvfMutation => {
  const polygon = extractPolygon(f.geometry)
  const p = f.properties
  return {
    id: String(p.idmutinvar ?? p.idopendata ?? f.id),
    date: p.datemut ?? '',
    year: p.anneemut ?? 0,
    nature: p.libnatmut ?? '',
    vefa: !!p.vefa,
    valeur: num(p.valeurfonc),
    surfaceBati: num(p.sbati),
    surfaceTerrain: num(p.sterr),
    typeBien: (p.libtypbien ?? '').toLowerCase(),
    parcelles: p.l_idpar ?? [],
    codeInsee: p.l_codinsee?.[0],
    nbLocaux: p.nblocmut ?? 0,
    nbAppartements: p.nblocapt ?? 0,
    nbMaisons: p.nblocmai ?? 0,
    geometry: polygon,
    centroid: centroidOf(polygon),
  }
}

export async function fetchDvfNearby(
  { lat, lon, halfSpan = 0.0015 }: FetchDvfParams,
  signal?: AbortSignal,
): Promise<DvfMutation[]> {
  // bbox is "lon_min,lat_min,lon_max,lat_max" - max 0.02 deg per side
  const lonMin = (lon - halfSpan).toFixed(6)
  const latMin = (lat - halfSpan).toFixed(6)
  const lonMax = (lon + halfSpan).toFixed(6)
  const latMax = (lat + halfSpan).toFixed(6)

  const params = new URLSearchParams({
    in_bbox: `${lonMin},${latMin},${lonMax},${latMax}`,
    page_size: '500',
  })

  const res = await fetch(`${CEREMA_GEOMUTATIONS}?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`DVF request failed: ${res.status}`)
  const data = (await res.json()) as CeremaResponse
  return (data.features ?? []).map(normalize)
}
