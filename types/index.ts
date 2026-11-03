export interface LatLng {
  lat: number
  lng: number
}

/** A device position fix; accuracy is the radius in metres, when known */
export interface UserLocation extends LatLng {
  accuracy?: number
}

export interface WikiArticle {
  pageid: number
  title: string
  lat: number
  lng: number
  distance: number
  extract?: string
  thumbnail?: string
  heroImage?: string    // high-res (800px) image for the drawer hero
  description?: string  // short Wikidata description, e.g. "Castle on the Thames"
  leadText?: string     // sanitised HTML intro from Wikipedia mobile-sections
  sections?: { title: string; text: string }[]  // sanitised HTML content sections
  url?: string
}

export interface TourStop extends WikiArticle {
  order: number
  narration?: string
  distFromPrev?: number  // metres from previous stop (or from start for stop 1)
  timeFromPrev?: number  // walking minutes
}

export type SidequestIcon = 'flame' | 'landmark' | 'drama' | 'trees'

export interface Sidequest {
  id: string
  label: string
  icon: SidequestIcon
  keywords: string[]
}

/** One walking leg between consecutive tour points, along the streets */
export interface RouteLeg {
  /** Metres along the streets */
  distance: number
  /** Seconds at walking pace */
  duration: number
  /** [lng, lat] pairs along the streets */
  coordinates: [number, number][]
}
