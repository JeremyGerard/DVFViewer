export interface AddressSuggestion {
  label: string
  fullText: string
  lat: number
  lon: number
  postcode?: string
  city?: string
  street?: string
  housenumber?: string
  /** Optional GPS accuracy in meters (when source is geolocation) */
  accuracy?: number
}

export type LatLng = [number, number]
export type Polygon = LatLng[][]

export interface DvfMutation {
  id: string
  date: string
  year: number
  nature: string
  vefa: boolean
  valeur: number | null
  surfaceBati: number | null
  surfaceTerrain: number | null
  typeBien: string
  parcelles: string[]
  codeInsee?: string
  nbLocaux: number
  nbAppartements: number
  nbMaisons: number
  geometry: Polygon
  centroid: LatLng
}

export interface ParcelGroup {
  parcelId: string
  geometry: Polygon
  centroid: LatLng
  /** Distance in meters from origin point */
  distance: number
  /** Display index, 1-based, assigned after sorting by distance */
  index: number
  mutations: DvfMutation[]
}
