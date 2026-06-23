export interface LatLng {
  lat: number
  lng: number
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

export interface Sidequest {
  id: string
  label: string
  icon: string
  keywords: string[]
}
