# LondonDetour

> Explore the Wikipedia articles, landmarks, and curious histories hiding within walking distance — across London.

LondonDetour drops you on a map of London, finds nearby Wikipedia articles within an adjustable radius, and turns them into pins and cards you can wander through. Tap **Surprise Me** for a random nearby story, browse **Sidequests** for themed clusters, or **Plan a Tour** to string a few stops into a walkable route.

A personal learning project — a London-centred clone of [Detour](https://detour.floguo.com/) by Flora Guo.

## Features

- 🗺️ **Map-first view** — your surroundings rendered with MapLibre GL, articles as pins
- 📍 **Smart location** — uses your live location if you're in London, otherwise centres on central London
- 🎚️ **Radius control** — 250 m to 10 km (the Wikipedia GeoSearch ceiling)
- 🎲 **Surprise Me** — jump to a random article nearby
- 🧭 **Sidequests** — themed groupings of nearby places
- 🚶 **Plan Tour** — generate a walkable route through selected stops (`/tour?lat=&lng=&radius=`)
- 🔗 **Shareable URLs** — location + radius live in the URL

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Map | MapLibre GL JS + token-free basemap (OpenFreeMap) |
| Data | Wikipedia Action API (GeoSearch) + REST summary — no key |
| Deploy | Vercel |
| AI (optional) | Anthropic API / Claude Haiku for tour narration |

## Getting started

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. install
npm install

# 2. configure env
cp .env.example .env.local
#   the default basemap needs no key; only add tokens for the optional upgrades

# 3. run
npm run dev
# open http://localhost:3000
```

## Scripts

```bash
npm run dev        # local development
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BASEMAP_STYLE` | no | Basemap style URL (defaults to OpenFreeMap) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | no | Only if switching the basemap to Mapbox GL |
| `ANTHROPIC_API_KEY` | no | Only for the optional AI-narrated tour (server-side only) |

## Deploy

Push to a Git repo and import into [Vercel](https://vercel.com). Set any env vars in the Vercel dashboard. The app is static-friendly except for optional API routes.

## Credits & attribution

- Original concept: **Detour** by [Flora Guo](https://www.floguo.com/playground/detour). This is an independent learning reimplementation, not affiliated.
- Article content: [Wikipedia](https://www.wikipedia.org) (CC BY-SA) — attribution shown in-app per article.
- Basemap: [OpenFreeMap](https://openfreemap.org) / OpenStreetMap contributors.

## Status

Early scaffold — see `ROADMAP.md` for the build plan and `PRD.md` for scope.
