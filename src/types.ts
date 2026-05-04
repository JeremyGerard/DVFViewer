export interface AddressSuggestion {
  label: string
  fullText: string
  lat: number
  lon: number
  postcode?: string
  city?: string
  street?: string
  housenumber?: string
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
