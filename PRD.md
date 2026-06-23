# Detour — Product Requirements

**Status:** Draft v0.1
**Owner:** Victor
**Type:** Personal side project / learning build
**Inspiration:** [Detour by Flora Guo](https://detour.floguo.com/)

---

## 1. Overview

People walk past extraordinary history every day without noticing it. Detour makes the invisible legible: it shows the Wikipedia-worthy places within a short walk and invites a *detour*. The London focus gives the project a concrete, dense, personally-meaningful playground — central London has an exceptionally high density of geotagged articles, which makes the core loop satisfying from the first load.

## 2. Goals

- Recreate Detour's core loop — *locate → discover nearby → dive into an article → optionally plan a route* — faithfully, re-centred on London.
- Ship something genuinely usable on a phone while walking around London.
- Serve as a hands-on Next.js + maps + public-API build (a learning vehicle as much as a product).

## 3. Non-goals

- Not a commercial product or a competitor to the original Detour.
- Not republishing or scraping Wikipedia content — we link out and attribute.
- No accounts, no database, no saved history in v1 (URL state only).
- No turn-by-turn navigation — "tour" is an ordered list + drawn path, not a routing engine (v1).

## 4. Target user

A curious Londoner or visitor with a few spare minutes, on a phone, who wants to know "what's interesting right here?" Secondary: the builder (you), using it as a portfolio/learning artefact.

## 5. User stories

- *As a walker,* I want to see interesting places near me on a map so I can pick a detour.
- *As a browser,* I want to widen or narrow the search radius so I can control how far I'll wander.
- *As someone short on ideas,* I want a "Surprise Me" button so the app picks for me.
- *As an explorer,* I want themed "Sidequests" so I can follow a thread (e.g. blue plaques, hidden gardens).
- *As a day-tripper,* I want to plan a tour through several stops so I get a coherent walk.
- *As a sharer,* I want the URL to capture my view so I can send it to a friend.

## 6. Requirements

### P0 — core clone (must ship)

| # | Requirement | Acceptance criteria |
|---|---|---|
| P0-1 | Map view centred on London | On load, a MapLibre map renders centred on central London (51.5074, -0.1278) at a walkable zoom. |
| P0-2 | Geolocation with London fallback | App requests location; if granted and within Greater London, recentres on the user; otherwise stays on London default. First paint never blocks on permission. |
| P0-3 | Nearby article fetch | Wikipedia GeoSearch returns articles within the radius; pins appear on the map and items in a list. Radius clamped to ≤10 km. |
| P0-4 | Article detail | Selecting a pin/card shows title, summary extract, thumbnail (if any), distance, and a link to the full Wikipedia article. |
| P0-5 | Radius control | A slider (250 m–10 km) re-queries and updates pins/list. |
| P0-6 | URL state | lat, lng, and radius are reflected in the URL and restored on load. |

### P1 — the Detour personality

| # | Requirement | Acceptance criteria |
|---|---|---|
| P1-1 | Surprise Me | Picks a random nearby article, recentres/opens it. |
| P1-2 | Sidequests | At least 2–3 themed filters over nearby articles (e.g. category/keyword based). |
| P1-3 | Plan Tour | `/tour?lat=&lng=&radius=` renders an ordered list of nearby stops with a path drawn between them. |
| P1-4 | Mobile-first polish | Layout works one-handed on a phone; controls reachable; list/map toggle or split that feels good on small screens. |

### P2 — stretch / AI

| # | Requirement | Notes |
|---|---|---|
| P2-1 | AI-narrated tour | Use Claude (Haiku) server-side to order stops sensibly and write a short connecting narrative for the walk. |
| P2-2 | Shareable tour cards | OpenGraph image for a planned tour. |
| P2-3 | Offline-friendly caching | Cache fetched summaries for the session / PWA-lite. |

## 7. Success metrics (personal-project flavoured)

- Core loop works end-to-end on a real phone walking through London.
- Time-to-first-pins under ~2s on a decent connection.
- You'd actually open it on a walk.

## 8. Open questions

- Sidequest themes — derive from Wikipedia categories, or a small hand-curated keyword map? (Lean curated for v1.)
- Tour ordering in P1 — nearest-neighbour heuristic vs. AI (P2)? (Heuristic first.)
- Do we want a "London-only" guard, or let it work anywhere with London as default? (Default-London, works-anywhere is simpler and kinder.)
