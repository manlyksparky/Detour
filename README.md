# Detour

Wander unfamiliar territory, discovering the gems around you. Drop a pin anywhere in London, sweep a radius, and Detour surfaces the Wikipedia articles for
everything nearby, from landmarks and hidden histories to the pub a poet drank in,
then stitches a walkable tour out of them, optionally narrated by Claude.

## Features

- **Explore by map**: pan and click anywhere in London to discover nearby
  Wikipedia articles, plotted on a light interactive map with clustering.
- **Adjustable radius**: sweep from 250 m to 10 km to widen or tighten the
  search around your pin.
- **Sidequests**: themed filters that surface a particular flavour of place:
  Hidden histories, Architecture, Literary & cultural, and Parks & green spaces.
- **Surprise me**: jump to a random, interesting place nearby.
- **Walking tours**: turn the places around you, or the ones you picked, into an
  ordered walking route with per-leg distances and walking times. Articles about
  the city itself, administrative areas and dated events are filtered out so every
  stop is somewhere you can stand.
- **AI narration** *(optional)*: Claude writes a short, atmospheric narration
  for each stop, tying it to London's broader history.
- **3D map**: both maps are drawn as a model of the streets, with buildings
  extruded from their real heights, real terrain, and a globe when you zoom
  right out. A dock control lays the map flat. On the tour the route follows
  the streets, and **Preview walk** flies the camera along it stop by stop.
- **You are here**: your position stays on the map as you walk.

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router) + React 18 + TypeScript
- [MapLibre GL](https://maplibre.org) with [OpenFreeMap](https://openfreemap.org) tiles, re-dressed to the Detour palette in `lib/basemap.ts`
- [Terrarium elevation tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen, on AWS Open Data) for terrain
- [Tailwind CSS v4](https://tailwindcss.com) for styling; tokens in `app/globals.css` and `DESIGN.md`
- [EasyUI](https://github.com/Surajmaurya1/easyui) components, installed through the [shadcn](https://ui.shadcn.com) registry and re-skinned to the Detour palette in `components/ui/`
- [Lucide](https://lucide.dev) icons, [Framer Motion](https://www.framer.com/motion/) for the EasyUI springs and the welcome sequence
- [transitions.dev](https://transitions.dev) "Input clear with dissolve" on the search field (`lib/transitions/`)
- [Wikipedia GeoSearch & REST APIs](https://www.mediawiki.org/wiki/API:Geosearch) for content
- [Nominatim](https://nominatim.org) for place search and addresses
- [Valhalla](https://github.com/valhalla/valhalla) pedestrian routing (the public OpenStreetMap demo by default, `ROUTING_URL` for your own) for street-level tour legs
- [Anthropic Claude](https://www.anthropic.com) (Haiku) for optional tour narration

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_BASEMAP_STYLE` | No | Map tile style URL. Defaults to the OpenFreeMap Liberty style; other OpenMapTiles styles get the Detour colours and 3D buildings too. |
| `NEXT_PUBLIC_TERRAIN_TILES` | No | Terrarium-encoded elevation tile URL template. Defaults to the public Mapzen tiles on AWS; set it empty to switch terrain off. |
| `ANTHROPIC_API_KEY` | No | Server-side key enabling AI tour narration. Without it, tours still work, just without narration. **Never** prefix this with `NEXT_PUBLIC_`. |
| `ROUTING_URL` | No | A Valhalla `/route` endpoint for walking routes between stops. Defaults to the public OpenStreetMap demo server (fine for development, not for traffic). Without routing, tours fall back to straight lines. |
| `ROUTING_MAX_LOCATIONS` | No | Locations per routing request; the demo server allows 10. Longer tours are routed in overlapping windows. |

## Project structure

```
app/
  api/wikipedia/   Wikipedia geosearch + summary proxy
  api/route/       Valhalla walking-route proxy (chunked, cached)
  api/tour/        Claude-powered tour narration
  page.tsx         Map explorer
  tour/            Tour viewer
components/        Map, article, tour and control UI
components/ui/     EasyUI primitives (button, dock, search bar, select, sheet, skeleton, stepper, 404…) skinned to DESIGN.md
hooks/             Small client hooks (media queries)
lib/               Basemap theme and 3D helpers, geo math, path math, routing, Wikipedia and Nominatim clients, sidequests, tour rules, motion tokens
types/             Shared TypeScript types
DESIGN.md          Design system; tokens are normative (sidecar in .impeccable/design.json)
```

## Adding a component

The interface is built from [EasyUI](https://github.com/Surajmaurya1/easyui) primitives. Install one with the shadcn CLI, then re-skin it: replace its dark registry palette with the tokens in `DESIGN.md` (Paper, Surface, Ink, Marker Orange), drop any blurred glow, and keep its springs from `lib/motion-tokens.ts`.

```bash
npx shadcn@latest add Surajmaurya1/easyui/<component-name>
```

The CSS variables EasyUI reads (`--surface`, `--border`, `--text-primary`, …) are already mapped to the Detour palette in `app/globals.css`, so a fresh install renders in the right colours before you touch it.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |

## Deployment

The app is configured for [Vercel](https://vercel.com) (see `vercel.json`) and also builds on Netlify. Set
`ANTHROPIC_API_KEY` in your hosting project settings to enable AI narration.

---

Content sourced from Wikipedia under [CC BY-SA](https://creativecommons.org/licenses/by-sa/4.0/).
Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors; tiles by OpenFreeMap. Terrain tiles by [Mapzen](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) on AWS Open Data.
