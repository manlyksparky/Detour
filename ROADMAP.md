# LondonDetour — Build Roadmap

A phased plan sized for Claude Code sessions. Each task is a small, reviewable unit. Check boxes as they land and keep `CLAUDE.md` in sync.

---

## Phase 0 — Scaffold

- [ ] `create-next-app` with TypeScript, App Router, Tailwind, ESLint
- [ ] Add `typecheck` script (`tsc --noEmit`)
- [ ] Create folder structure (`/components`, `/lib`, `/types`)
- [ ] Add `.env.example` with `NEXT_PUBLIC_BASEMAP_STYLE`
- [ ] `lib/constants.ts` — `LONDON_CENTER`, radius bounds, default radius
- [ ] Commit a working empty app

**Done when:** `npm run dev` serves a blank styled page; lint + typecheck pass.

## Phase 1 — Map + location (P0-1, P0-2)

- [ ] Install `maplibre-gl`; add its CSS
- [ ] `components/Map.tsx` — MapLibre wrapper centred on `LONDON_CENTER`, keep attribution control
- [ ] `lib/geo.ts` — geolocation helper, Greater London bounds check, London fallback
- [ ] Wire geolocation on mount: paint London first, refine if a fix arrives in-bounds
- [ ] Reflect lat/lng in URL search params; restore on load

**Done when:** map loads on London instantly; granting location (within London) recentres; URL carries lat/lng.

## Phase 2 — Wikipedia data (P0-3, P0-4)

- [ ] `lib/wikipedia.ts` — typed GeoSearch fetcher (`gscoord`, `gsradius` clamped ≤10000, `gslimit=50`, `origin=*`)
- [ ] Typed REST summary fetcher (lazy/batched; in-memory cache by pageid)
- [ ] Render article pins on the map from GeoSearch results
- [ ] `components/ArticleList.tsx` + `ArticleCard.tsx` — list synced with pins
- [ ] Article detail: extract, thumbnail, distance, "Read on Wikipedia" link (CC BY-SA attribution)
- [ ] Loading + empty states ("Finding nearby articles…")

**Done when:** real London articles appear as pins + cards; selecting one shows its summary; no key required.

## Phase 3 — Radius + URL (P0-5, P0-6)

- [ ] `components/RadiusControl.tsx` — slider 250 m–10 km, clamps to API max
- [ ] Re-query on radius change (debounced); update pins/list
- [ ] Radius persisted in URL; full view (lat/lng/radius) is shareable & restorable

**Done when:** changing radius updates results; pasting a URL reproduces the exact view.

## Phase 4 — Detour personality (P1)

- [ ] `components/SurpriseMe.tsx` — random nearby article, recentre/open
- [ ] `components/Sidequests.tsx` — 2–3 curated themes (keyword/category filters over results)
- [ ] `/tour/page.tsx` — read `?lat=&lng=&radius=`, list nearby stops in order, draw a path on the map (nearest-neighbour ordering for v1)
- [ ] Mobile-first pass: one-handed controls, map/list balance on small screens

**Done when:** Surprise Me, Sidequests, and a basic Plan Tour all work on a phone.

## Phase 5 — Polish & ship

- [ ] Visual polish toward the Detour aesthetic (typography, spacing, restraint)
- [ ] Error handling (offline, geolocation denied, empty radius)
- [ ] OpenGraph / metadata for LondonDetour
- [ ] Deploy to Vercel; verify on a real phone in London
- [ ] README screenshots/GIF

**Done when:** it's live, attributed, and you'd open it on a walk.

## Phase 6 — Optional AI (P2)

- [ ] `/api/tour` route handler — Claude (Haiku) orders stops + writes a short connecting narrative (server-side, `ANTHROPIC_API_KEY` never exposed client-side)
- [ ] Tour view consumes the AI ordering/narrative with the heuristic as fallback
- [ ] Shareable tour OG image

---

### Suggested first Claude Code prompt

> Read CLAUDE.md, PRD.md, and ROADMAP.md. Start Phase 0: scaffold the Next.js + TypeScript + Tailwind app with the folder structure and constants described, then stop and show me the diff before installing the map library.
