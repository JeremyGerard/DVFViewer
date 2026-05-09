import type { AddressSuggestion } from '../types'

const COMPLETION_URL = 'https://data.geopf.fr/geocodage/completion'
const SEARCH_URL = 'https://data.geopf.fr/geocodage/search'
const REVERSE_URL = 'https://data.geopf.fr/geocodage/reverse'

interface GeoplateformeCompletionResponse {
  status: string
  results: Array<{
    country?: string
    city?: string
    fulltext?: string
    street?: string
    classification?: number
    kind?: string
    x: number
    y: number
    postcode?: string
    zipcode?: string
    zipcodes?: string[]
    metropole?: boolean
  }>
}

interface GeoplateformeSearchFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    label?: string
    name?: string
    postcode?: string
    city?: string
    housenumber?: string
    street?: string
    score?: number
  }
}

interface GeoplateformeSearchResponse {
  type: 'FeatureCollection'
  features: GeoplateformeSearchFeature[]
}

export async function completeAddress(
  text: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  if (!text || text.trim().length < 3) return []

  const params = new URLSearchParams({
    text: text.trim(),
    type: 'StreetAddress',
    maximumResponses: '8',
  })

  const res = await fetch(`${COMPLETION_URL}/?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`Completion failed: ${res.status}`)
  const data = (await res.json()) as GeoplateformeCompletionResponse

  return (data.results ?? []).map((r) => ({
    label: r.fulltext || [r.street, r.city].filter(Boolean).join(', '),
    fullText: r.fulltext || '',
    lat: r.y,
    lon: r.x,
    postcode: r.postcode || r.zipcode || (r.zipcodes?.[0] ?? undefined),
    city: r.city,
    street: r.street,
  }))
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return []

  const params = new URLSearchParams({
    q: query.trim(),
    index: 'address',
    limit: '8',
  })

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const data = (await res.json()) as GeoplateformeSearchResponse

  return (data.features ?? []).map((f) => {
    const [lon, lat] = f.geometry.coordinates
    const p = f.properties
    return {
      label: p.label || p.name || '',
      fullText: p.label || p.name || '',
      lat,
      lon,
      postcode: p.postcode,
      city: p.city,
      street: p.street,
      housenumber: p.housenumber,
    }
  })
}


export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<AddressSuggestion | null> {
  const params = new URLSearchParams({
    lon: String(lon),
    lat: String(lat),
    index: 'address',
    limit: '1',
  })

  const res = await fetch(`${REVERSE_URL}?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`Reverse failed: ${res.status}`)
  const data = (await res.json()) as GeoplateformeSearchResponse
  const f = data.features?.[0]
  if (!f) return null

  const [flon, flat] = f.geometry.coordinates
  const p = f.properties
  return {
    label: p.label || p.name || '',
    fullText: p.label || p.name || '',
    lat: flat,
    lon: flon,
    postcode: p.postcode,
    city: p.city,
    street: p.street,
    housenumber: p.housenumber,
  }
}
