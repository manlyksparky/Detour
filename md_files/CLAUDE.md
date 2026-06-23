# CLAUDE.md

> Project memory for Claude Code. Read this first on every session. Keep it current — when an architectural decision changes, update this file in the same PR.

## What we're building

**LondonDetour** is a map-first discovery web app. It centres on London, finds Wikipedia articles, landmarks, and points of interest within an adjustable radius of the user's location, and presents them as map pins + a scrollable list. Core interactions: browse nearby articles, "Surprise Me" (jump to a random nearby article), "Sidequests" (themed/curated clusters), and "Plan Tour" (sequence a walkable route through nearby stops).

It is a personal learning clone of **Detour** by Flora Guo (https://detour.floguo.com/), re-centred on London. Not a commercial product, not a republish — see PRD non-goals.

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Map:** MapLibre GL JS with a token-free basemap (OpenFreeMap default; Mapbox GL is a drop-in upgrade if a token is added)
- **Data:** Wikipedia Action API (GeoSearch) + REST summary endpoint — no API key required
- **State:** React state + URL search params (lat/lng/radius live in the URL so views are shareable, mirroring the original)
- **Deploy:** Vercel
- **AI (optional, P2):** Anthropic API (Claude Haiku) to sequence + narrate "Plan Tour" routes

## Architecture & data flow

```
User location (geolocation or London default)
        │
        ▼
  lat / lng / radius  ──►  URL search params (?lat=&lng=&radius=)
        │
        ▼
  Wikipedia GeoSearch  ──►  list of nearby pages (pageid, title, coords, dist)
        │
        ▼
  Wikipedia REST summary (batched/lazy)  ──►  extract + thumbnail per article
        │
        ├──►  Map pins (MapLibre markers)
        └──►  Article list / cards
```

Key route: `/tour?lat=&lng=&radius=` renders a planned walking tour from the same nearby-article data.

## Project structure (target)

```
/app
  /page.tsx              # main map + list view
  /tour/page.tsx         # planned tour view
  /api/                  # route handlers (Wikipedia proxy if needed, AI tour)
  layout.tsx
/components
  Map.tsx                # MapLibre wrapper
  ArticleList.tsx
  ArticleCard.tsx
  RadiusControl.tsx
  SurpriseMe.tsx
  Sidequests.tsx
/lib
  wikipedia.ts           # GeoSearch + summary fetchers, types
  geo.ts                 # geolocation, London defaults, distance helpers
  constants.ts           # LONDON_CENTER, radius bounds, etc.
/types
```

## Key commands

```bash
npm install          # install deps
npm run dev          # local dev server (localhost:3000)
npm run build        # production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit  (add if not present)
```

## Domain knowledge — read before touching data code

**London defaults** (`lib/constants.ts`):
- `LONDON_CENTER = { lat: 51.5074, lng: -0.1278 }` (Trafalgar Square / central London)
- Default radius: `1000` m. Slider range: `250`–`10000` m.

**Geolocation behaviour:** Try `navigator.geolocation` on load. If granted AND within Greater London bounds, use it. Otherwise fall back to `LONDON_CENTER`. Never block the first render on permission — show London immediately, refine if/when a fix arrives.

**Wikipedia GeoSearch (Action API):**
```
https://en.wikipedia.org/w/api.php
  ?action=query&list=geosearch
  &gscoord=LAT|LNG
  &gsradius=RADIUS_IN_METRES        # HARD MAX 10000 (10 km) — clamp the slider
  &gslimit=50                        # max 500
  &format=json&origin=*              # origin=* required for browser CORS
```

**Article detail (REST summary):**
```
https://en.wikipedia.org/api/rest_v1/page/summary/{TITLE_URL_ENCODED}
→ { extract, thumbnail.source, content_urls.desktop.page, coordinates }
```
Fetch summaries lazily / batched — don't fire 50 requests on load. Cache by pageid in memory for the session.

**Attribution:** Wikipedia content is CC BY-SA — surface a "from Wikipedia" link on every article. Basemap needs its own attribution control (MapLibre shows this by default; keep it).

## Conventions

- TypeScript strict. No `any` in committed code — model Wikipedia responses with explicit types in `lib/wikipedia.ts`.
- Keep lat/lng/radius as the single source of truth in the URL; components read from search params, don't duplicate in deep state.
- Components are presentational; data-fetching lives in `lib/` or route handlers.
- Tailwind for styling; avoid inline style objects except for dynamic map values.
- Small, reviewable commits per ROADMAP task.

## Environment variables

```
# .env.local
NEXT_PUBLIC_BASEMAP_STYLE=https://tiles.openfreemap.org/styles/liberty   # token-free default
# Optional upgrades:
# NEXT_PUBLIC_MAPBOX_TOKEN=...        # only if switching to Mapbox GL
# ANTHROPIC_API_KEY=...               # only for P2 AI tour narration (server-side only, never NEXT_PUBLIC)
```

## Working agreements (for Claude Code)

- Before building a feature, check `ROADMAP.md` for the current phase and `PRD.md` for acceptance criteria.
- Propose the file plan before scaffolding large pieces; prefer the smallest change that satisfies the task.
- When a Wikipedia/MapLibre detail is uncertain, verify against the real API response rather than guessing field names.
- Update this file + the relevant ROADMAP checkbox when a task lands.
