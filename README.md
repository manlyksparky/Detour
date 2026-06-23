# Detour

Wander London through the stories hiding around you. Drop a pin anywhere in the
city, sweep a radius, and Detour surfaces the Wikipedia articles for
everything nearby — landmarks, hidden histories, the pub a poet drank in — then
stitches a walkable tour out of them, optionally narrated by Claude.

## Features

- **Explore by map** — pan and click anywhere in London to discover nearby
  Wikipedia articles, plotted on a dark interactive map.
- **Adjustable radius** — sweep from 250 m to 10 km to widen or tighten the
  search around your pin.
- **Side quests** — themed filters that surface a particular flavour of place:
  Hidden Histories 🕯️, Architects & Buildings 🏛️, Literary & Cultural 🎭, and
  Parks & Green Spaces 🌳.
- **Surprise Me** — jump to a random, interesting corner of the city.
- **Walking tours** — turn a cluster of articles into an ordered walking route
  with per-leg distances and walking times.
- **AI narration** *(optional)* — Claude writes a short, atmospheric narration
  for each stop, tying it to London's broader history.

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router) + React 18 + TypeScript
- [Leaflet](https://leafletjs.com) / [react-leaflet](https://react-leaflet.js.org) for mapping
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Wikipedia GeoSearch & REST APIs](https://www.mediawiki.org/wiki/API:Geosearch) for content
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
| `NEXT_PUBLIC_BASEMAP_STYLE` | No | Map tile style URL. Defaults to the OpenFreeMap dark style. |
| `ANTHROPIC_API_KEY` | No | Server-side key enabling AI tour narration. Without it, tours still work — just without narration. **Never** prefix this with `NEXT_PUBLIC_`. |

## Project structure

```
app/
  api/wikipedia/   Wikipedia geosearch + summary proxy
  api/tour/        Claude-powered tour narration
  page.tsx         Map explorer
  tour/            Tour planner & viewer
components/        Map, article, tour, and control UI
lib/               Geo math, Wikipedia client, side quests, tour building
types/             Shared TypeScript types
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |

## Deployment

The app is configured for [Vercel](https://vercel.com) (see `vercel.json`). Set
`ANTHROPIC_API_KEY` in your Vercel project settings to enable AI narration.

---

Content sourced from Wikipedia under [CC BY-SA](https://creativecommons.org/licenses/by-sa/4.0/).
