import type { WikiArticle } from '@/types'

/**
 * Tour stops should be somewhere you can stand. Wikipedia geosearch also returns
 * the city itself, administrative areas and dated events pinned to a venue.
 * The Wikidata description is the most reliable signal; the lead sentence is the fallback.
 */
const YEAR_TITLE = /^\d{4}\b/

const NON_PLACE_DESCRIPTION =
  /\b(capital|city|town|village|district|borough|county|region|area|conurbation|constituency|ward|neighbourhood|locality|postcode|census|championship|championships|competition|tournament|election|season|series|match|final|race|marathon|part of)\b/i

const NON_PLACE_LEAD =
  /\b(is|was|were)\s+(?:the\s+|an?\s+)?(?:[\w-]+\s+)?(capital|city(?!\s+(?:hall|church|farm|gate|road|house))|town(?!\s+(?:hall|house|centre|center))|village(?!\s+(?:hall|green))|district|borough|county|region|conurbation|built-up area|urban area|constituency|ward|neighbourhood|locality|postcode district|championship|championships|competition|tournament|election|season|match|race|marathon)\b/i

export function isPlaceArticle(a: Pick<WikiArticle, 'title' | 'extract' | 'description'>): boolean {
  if (YEAR_TITLE.test(a.title)) return false
  if (a.description) return !NON_PLACE_DESCRIPTION.test(a.description)
  const lead = (a.extract ?? '').split(/(?<=\.)\s+/)[0] ?? ''
  return !NON_PLACE_LEAD.test(lead)
}

/** Serialise hand-picked stop ids for the tour URL. */
export function encodeStops(pageIds: number[]): string {
  return pageIds.join(',')
}

export function decodeStops(param: string | null): number[] {
  if (!param) return []
  return param
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
}
