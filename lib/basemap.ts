import type maplibregl from 'maplibre-gl'
import type { UserLocation } from '@/types'

/**
 * The basemap, shared by the explore and tour maps.
 *
 * OpenFreeMap's Liberty style ships the vector data (OpenMapTiles layers,
 * building heights, fonts); everything here re-dresses it as the Field
 * Notebook: paper land, ink labels, white streets, soft water, buildings
 * extruded in warm greys under a paper sky. Terrain comes from the public
 * Terrarium elevation tiles on AWS Open Data; no key is needed anywhere.
 *
 * Every helper is guarded so a different `NEXT_PUBLIC_BASEMAP_STYLE` still
 * works: layers that are missing are skipped, not assumed.
 */

export type ViewMode = '2d' | '3d'

export const BASEMAP =
  process.env.NEXT_PUBLIC_BASEMAP_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty'

/** Set to an empty string to switch 3D terrain off. */
export const TERRAIN_TILES =
  process.env.NEXT_PUBLIC_TERRAIN_TILES ??
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

const TERRAIN_SOURCE = 'detour-terrain'
const TERRAIN_EXAGGERATION = 1.2
export const BUILDINGS_LAYER = 'building-3d'
const USER_SOURCE = 'user-location'

/* Field Notebook tokens (DESIGN.md), as the map wears them */
export const notebook = {
  land: '#f3f1ec', // Sunken: panels in Paper sit lighter on it
  residential: 'rgba(225, 221, 214, 0.45)',
  park: '#dfe7d3',
  wood: 'rgba(205, 218, 188, 0.75)',
  grass: '#d8e2c7',
  pitch: '#e3e8d6',
  cemetery: '#e4e8d8',
  school: '#ece9db',
  hospital: '#f1e6e2',
  sand: '#ece6d3',
  ice: '#eceeee',
  aeroway: '#ebe8e2',
  water: '#c5d8e2',
  waterLabel: '#5b7a8c',
  road: '#ffffff',
  roadCasing: '#d6d3d1', // Line Strong
  roadMajor: '#f7efe3',
  roadMajorCasing: '#d8cfc2',
  motorway: '#f1e3cf',
  motorwayCasing: '#cfc2ad',
  rail: '#cfcac4',
  building: '#e9e6e1',
  buildingOutline: 'rgba(214, 211, 209, 0.6)',
  buildingLow: '#f0ede8',
  buildingMid: '#e2ded7',
  buildingHigh: '#d3cec6',
  boundary: '#cfcac4',
  boundaryStrong: '#8f8a85', // Line Field
  ink: '#1c1917',
  ink2: '#57534e',
  ink3: '#78716c',
  halo: '#faf9f6', // Paper
  accent: '#e05c1a',
  accentStrong: '#c2410c',
  surface: '#ffffff',
  sky: '#faf9f6',
  horizon: '#f3f1ec',
  light: '#fff4e5',
} as const

type Layer = { id: string; type: string; 'source-layer'?: string; source?: string }

function layers(map: maplibregl.Map): Layer[] {
  return (map.getStyle()?.layers ?? []) as Layer[]
}

function paint(map: maplibregl.Map, id: string, prop: string, value: unknown) {
  if (!map.getLayer(id)) return
  try {
    map.setPaintProperty(id, prop, value)
  } catch {
    // a style that names the layer differently or lacks the property: leave it as shipped
  }
}

/** The first label layer, so added geometry stays under the text. */
export function firstSymbolLayerId(map: maplibregl.Map): string | undefined {
  return layers(map).find((l) => l.type === 'symbol')?.id
}

/** The basemap's own font stack, so added text always has glyphs. */
export function basemapTextFont(map: maplibregl.Map): string[] {
  const withFont = (map.getStyle()?.layers as Array<{ type: string; layout?: Record<string, unknown> }> | undefined)?.find(
    (l) => l.type === 'symbol' && l.layout && 'text-font' in l.layout
  )
  return (withFont?.layout?.['text-font'] as string[] | undefined) ?? ['Noto Sans Regular']
}

/** Recolour the loaded style to the notebook palette, layer by layer. */
export function applyNotebookTheme(map: maplibregl.Map) {
  for (const layer of layers(map)) {
    const { id, type } = layer
    const sourceLayer = layer['source-layer'] ?? ''

    if (type === 'background') {
      paint(map, id, 'background-color', notebook.land)
      continue
    }

    if (type === 'fill') {
      if (sourceLayer === 'water') paint(map, id, 'fill-color', notebook.water)
      else if (sourceLayer === 'park') {
        paint(map, id, 'fill-color', notebook.park)
        paint(map, id, 'fill-outline-color', notebook.park)
      } else if (sourceLayer === 'landcover') {
        if (/wood/.test(id)) paint(map, id, 'fill-color', notebook.wood)
        else if (/grass|wetland/.test(id)) paint(map, id, 'fill-color', notebook.grass)
        else if (/sand/.test(id)) paint(map, id, 'fill-color', notebook.sand)
        else if (/ice/.test(id)) paint(map, id, 'fill-color', notebook.ice)
      } else if (sourceLayer === 'landuse') {
        if (/residential/.test(id)) paint(map, id, 'fill-color', notebook.residential)
        else if (/pitch|track/.test(id)) paint(map, id, 'fill-color', notebook.pitch)
        else if (/cemetery/.test(id)) paint(map, id, 'fill-color', notebook.cemetery)
        else if (/school/.test(id)) paint(map, id, 'fill-color', notebook.school)
        else if (/hospital/.test(id)) paint(map, id, 'fill-color', notebook.hospital)
      } else if (sourceLayer === 'aeroway') paint(map, id, 'fill-color', notebook.aeroway)
      else if (sourceLayer === 'building') {
        paint(map, id, 'fill-color', notebook.building)
        paint(map, id, 'fill-outline-color', notebook.buildingOutline)
      }
      continue
    }

    if (type === 'line') {
      if (sourceLayer === 'waterway') paint(map, id, 'line-color', notebook.water)
      else if (sourceLayer === 'park') paint(map, id, 'line-color', notebook.park)
      else if (sourceLayer === 'aeroway') paint(map, id, 'line-color', notebook.road)
      else if (sourceLayer === 'boundary') {
        paint(map, id, 'line-color', /_2|disputed/.test(id) ? notebook.boundaryStrong : notebook.boundary)
      } else if (sourceLayer === 'transportation') {
        const casing = /casing/.test(id)
        if (/rail/.test(id)) paint(map, id, 'line-color', notebook.rail)
        else if (/motorway/.test(id)) paint(map, id, 'line-color', casing ? notebook.motorwayCasing : notebook.motorway)
        else if (/trunk|primary|secondary|tertiary|link/.test(id)) {
          paint(map, id, 'line-color', casing ? notebook.roadMajorCasing : notebook.roadMajor)
        } else paint(map, id, 'line-color', casing ? notebook.roadCasing : notebook.road)
      }
      continue
    }

    if (type === 'symbol') {
      if (sourceLayer === 'water_name' || sourceLayer === 'waterway') {
        paint(map, id, 'text-color', notebook.waterLabel)
        paint(map, id, 'text-halo-color', notebook.halo)
      } else if (sourceLayer === 'transportation_name') {
        paint(map, id, 'text-color', /path/.test(id) ? notebook.ink3 : notebook.ink2)
        paint(map, id, 'text-halo-color', notebook.halo)
      } else if (sourceLayer === 'poi' || sourceLayer === 'aerodrome_label') {
        paint(map, id, 'text-color', notebook.ink3)
        paint(map, id, 'text-halo-color', notebook.halo)
      } else if (sourceLayer === 'place') {
        paint(map, id, 'text-color', notebook.ink)
        paint(map, id, 'text-halo-color', notebook.halo)
      }
    }
  }
}

/**
 * Make sure the style has an extrusion layer for buildings and tint it by
 * height. Liberty ships one as `building-3d`; other OpenMapTiles styles get
 * one added from their `building` source layer.
 */
export function ensureBuildings(map: maplibregl.Map) {
  if (!map.getLayer(BUILDINGS_LAYER)) {
    const buildingFill = layers(map).find((l) => l['source-layer'] === 'building' && l.source)
    if (!buildingFill?.source) return
    map.addLayer(
      {
        id: BUILDINGS_LAYER,
        type: 'fill-extrusion',
        source: buildingFill.source,
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        },
      },
      firstSymbolLayerId(map)
    )
  }
  paint(map, BUILDINGS_LAYER, 'fill-extrusion-color', [
    'interpolate',
    ['linear'],
    ['coalesce', ['get', 'render_height'], 0],
    0,
    notebook.buildingLow,
    40,
    notebook.buildingMid,
    120,
    notebook.buildingHigh,
  ])
  paint(map, BUILDINGS_LAYER, 'fill-extrusion-opacity', 0.95)
}

export function setBuildingsVisible(map: maplibregl.Map, visible: boolean) {
  if (map.getLayer(BUILDINGS_LAYER)) {
    map.setLayoutProperty(BUILDINGS_LAYER, 'visibility', visible ? 'visible' : 'none')
  }
}

/** A paper horizon behind the pitched city instead of empty canvas. */
export function applyPaperSky(map: maplibregl.Map) {
  try {
    map.setSky({
      'sky-color': notebook.sky,
      'horizon-color': notebook.horizon,
      'fog-color': notebook.sky,
      'sky-horizon-blend': 0.7,
      'horizon-fog-blend': 0.8,
      'fog-ground-blend': 0.55,
    })
  } catch {
    // older style runtime without sky support: the canvas background still reads as paper
  }
}

/** Warm, soft light: a low intensity keeps the shaded faces pale, like a paper model. */
export function applyWarmLight(map: maplibregl.Map) {
  try {
    map.setLight({ anchor: 'viewport', color: notebook.light, intensity: 0.25 })
  } catch {
    // leave the style's default light
  }
}

/** Real elevation so hills read in 3D. Adds the DEM source on first use. */
export function setTerrainEnabled(map: maplibregl.Map, enabled: boolean) {
  if (!TERRAIN_TILES) return
  try {
    if (enabled && !map.getSource(TERRAIN_SOURCE)) {
      map.addSource(TERRAIN_SOURCE, {
        type: 'raster-dem',
        tiles: [TERRAIN_TILES],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15,
        attribution:
          'Terrain <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">Mapzen</a>',
      })
    }
    const current = !!map.getTerrain()
    if (enabled && !current) map.setTerrain({ source: TERRAIN_SOURCE, exaggeration: TERRAIN_EXAGGERATION })
    else if (!enabled && current) map.setTerrain(null)
  } catch {
    // terrain is a flourish; the flat map is complete without it
  }
}

/** The globe shows when the visitor zooms right out; at street zooms it is plain Mercator. */
export function enableGlobe(map: maplibregl.Map) {
  try {
    map.setProjection({ type: 'globe' })
  } catch {
    // runtime without globe support
  }
}

/**
 * "You are here": an accuracy disc on the ground and an Ink dot with a Surface
 * ring that stays the same size at every pitch and zoom.
 */
export function syncUserLocation(map: maplibregl.Map, location: UserLocation | null) {
  const features: GeoJSON.Feature[] = location
    ? [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [location.lng, location.lat] },
          properties: { accuracy: location.accuracy ?? 0 },
        },
      ]
    : []
  const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features }

  const existing = map.getSource(USER_SOURCE) as maplibregl.GeoJSONSource | undefined
  if (existing) {
    existing.setData(data)
    return
  }
  map.addSource(USER_SOURCE, { type: 'geojson', data })
  // metres → pixels at the current latitude, so the disc is the real accuracy on the ground
  const metresPerPixelAtZ0 = 156543.03 * Math.cos(((location?.lat ?? 51.5) * Math.PI) / 180)
  map.addLayer({
    id: 'user-location-accuracy',
    type: 'circle',
    source: USER_SOURCE,
    paint: {
      'circle-radius': [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        0,
        ['/', ['get', 'accuracy'], metresPerPixelAtZ0],
        22,
        ['/', ['*', ['get', 'accuracy'], 4194304], metresPerPixelAtZ0],
      ],
      'circle-color': 'rgba(28, 25, 23, 0.08)',
      'circle-stroke-width': 1,
      'circle-stroke-color': 'rgba(28, 25, 23, 0.18)',
      'circle-pitch-alignment': 'map',
    },
  })
  map.addLayer({
    id: 'user-location-dot',
    type: 'circle',
    source: USER_SOURCE,
    paint: {
      'circle-radius': 7,
      'circle-color': notebook.ink,
      'circle-stroke-width': 3,
      'circle-stroke-color': notebook.surface,
      'circle-pitch-alignment': 'viewport',
      'circle-pitch-scale': 'viewport',
    },
  })
}
