export function encodeStops(pageIds: number[]): string {
  return pageIds.join(',')
}

export function decodeStops(param: string | null): number[] {
  if (!param) return []
  return param
    .split(',')
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0)
}
