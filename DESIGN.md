---
name: Detour
description: Wander unfamiliar territory, discovering the gems around you.
colors:
  paper: "#faf9f6"
  surface: "#ffffff"
  sunken: "#f3f1ec"
  ink: "#1c1917"
  ink-2: "#57534e"
  ink-3: "#78716c"
  line: "#e7e5e4"
  line-strong: "#d6d3d1"
  line-field: "#8f8a85"
  accent: "#e05c1a"
  accent-strong: "#c2410c"
  accent-soft: "#fff1e8"
  success: "#15803d"
typography:
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  body-dense:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 16px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    height: "32px"
    padding: "0 12px"
  chip-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-strong}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 12px 0 36px"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 36px 0 12px"
  dock-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "36px"
    padding: "0 12px"
---

# Design System: Detour

## Overview

**Creative North Star: "The Field Notebook"**

Detour is a map you annotate while walking. The interface borrows the materials of a notebook kept in a coat pocket: warm paper, dark ink, and one orange marker pen used sparingly to say "here". Everything that is not the map or the story is quiet, so the basemap's own colour and the article photographs are the only pictures on screen.

The product runs in Operate mode: the visitor is in a task (find, read, plan) and the interface should disappear into it. Density is moderate, controls are the ones people already know from maps apps, and the single family does every job. Motion only reports state, with one authored exception, the welcome sequence, which shows once per session and can always be skipped.

The controls are EasyUI primitives (`components/ui`, installed through the shadcn registry) re-skinned to this system. EasyUI supplies the mechanics: spring taps, a floating dock, a draggable sheet, a select that rides a spring, labels that morph in place, skeletons with a light sweep, a stepper trail. The notebook supplies every colour, radius, size and shadow. A registry component's own palette (dark slate, white-on-black, blurred glows) never ships.

**Key Characteristics:**
- Warm off-white paper with pure white surfaces lifted on it; no dark chrome anywhere.
- One accent. Bright orange marks places and carries big actions; a deeper orange handles small text so it reads.
- Ink text on the bright orange, never white on it.
- One icon family (Lucide), one type family (Inter), no emoji in the interface.
- Opaque panels. Blur is never used as decoration.
- Physical motion from one token file: short springs that settle without bouncing, instant under reduced motion.

## Colors

A paper neutral ramp with a single orange accent that gets deeper, not lighter, as it gets smaller.

### Primary
- **Marker Orange** (`accent`): pins, the route line, selected borders, and the primary action fill. Text on it is always ink.
- **Deep Marker** (`accent-strong`): the same orange at AA strength for text and links under 18px, the focus ring, hover fills, and cluster bubbles with white counts.
- **Orange Wash** (`accent-soft`): the background of a selected chip or an "already in your tour" state, always paired with Deep Marker text.

### Neutral
- **Paper** (`paper`): the app background, the sidebar, the phone sheet, and the welcome screen.
- **Surface** (`surface`): cards, the drawer, inputs, and floating controls. White sits on paper; the step is small on purpose.
- **Sunken** (`sunken`): skeleton blocks, image placeholders, and the grouped "Getting there" box.
- **Ink** (`ink`): headings and primary text. **Ink 2** (`ink-2`): secondary text and metadata down to 12px. **Ink 3** (`ink-3`): icons at rest and tertiary text at 14px or larger only.
- **Line** (`line`) for hairline card borders and dividers; **Line Strong** (`line-strong`) for button borders, the sheet handle and scrollbars; **Line Field** (`line-field`) for input and select borders, at 3.4:1 so a field boundary reads on its own.

### Semantic
- **Success** (`success`): the "Copied" confirmation only.

### Named Rules
**The Ink-on-Orange Rule.** Text that sits on Marker Orange is Ink. White on the bright orange fails contrast and is never used, including on badges.

**The Small-Text Rule.** Orange text below 18px, and any orange icon that carries meaning, uses Deep Marker. Marker Orange is for fills, pins and lines.

**The One Marker Rule.** Orange appears on fewer than one in ten elements of any screen: pins, the selected item, the primary action, and nothing else.

## Typography

**Display Font:** none. Product surfaces use one family.
**Body Font:** Inter (with system-ui, sans-serif)
**Label/Mono Font:** the system monospace, only for coordinates and keyboard keys.

**Character:** plain, even, and legible at small sizes. Hierarchy comes from weight and spacing, not from size jumps, because the sidebar carries many small roles at once.

### Hierarchy
- **Headline** (700, 1.25rem, 1.3): the drawer and tour page titles.
- **Title** (600, 1rem, 1.3): the wordmark in the sidebar and sheet, and section headings inside the drawer.
- **Card title** (600, 0.875rem, 1.35): article and stop names, clamped to two lines.
- **Body** (400, 1rem, 1.65): article prose in the drawer, measure 60 to 70 characters at the drawer's width.
- **Body dense** (400, 0.875rem, 1.5): sidebar copy, buttons, stats.
- **Label** (500, 0.75rem, 1.4): metadata, distances, counts and attribution. Nothing in the interface is set below 12px.

### Named Rules
**The Twelve Pixel Floor.** Functional text is never smaller than 12px. Attribution and keyboard hints included.

**The Balanced Heading Rule.** Headings wrap with `text-wrap: balance`; paragraphs with `text-wrap: pretty`.

## Layout

Two layouts, one model. On desktop a fixed 380px sidebar sits over the map on the left and a 420px drawer slides in from the right; the map and its floating bar fill the rest and the bar re-centres when the drawer opens. On phones the sidebar becomes a bottom sheet with a 56px collapsed header and a 75vh expanded state; search moves to a floating bar at the top of the map; the drawer takes the full screen.

Spacing uses a 4px base. Controls inside panels sit 12px apart, panels keep 12px gutters from the edge, card content uses 16px padding, and distinct groups are separated by 24px. Floating controls keep a 16px gutter from the viewport on every size and are sized to their content, never to a fraction of the map.

Safe areas are respected: the viewport is `viewport-fit: cover` and bottom controls add `env(safe-area-inset-bottom)`.

## Elevation & Depth

Depth is tonal first and shadowed second. Surface on Paper is the base lift; borders in Line define edges at rest. Shadows appear only on things that float over the map or on hover.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(28, 25, 23, 0.05)`): cards at rest inside panels.
- **Raised** (`box-shadow: 0 4px 12px rgba(28, 25, 23, 0.08)`): hovered cards, the primary button, map markers.
- **Float** (`box-shadow: 0 8px 24px rgba(28, 25, 23, 0.14)`): the floating bars, the drawer, the phone sheet.

### Named Rules
**The No-Blur Rule.** Panels are opaque. Nothing uses `backdrop-filter`; the map is expensive to repaint and a frosted edge over it is decoration.

## Motion

Every animation reads its curve from `lib/motion-tokens.ts`, so EasyUI components and Detour's own screens move with one voice. Springs are near critical damping: they settle, they never bounce.

- **Snappy** (stiffness 380, damping 30, mass 0.5): taps compress a control to 97%, tooltips and menus spring in, labels morph. Settles in about 200 ms.
- **Smooth** (200, 28, 0.85): the dock's entrance and the search bar's width.
- **Morph** (220, 32, 1.0): shared-layout indicators, the chip wash and the trail ring, slide between positions.
- **Sheet** (380, 38, 0.9): the place panel slides and settles; a drag past 96px or a quick flick dismisses it.
- **Ease-out expo** (`cubic-bezier(0.22, 1, 0.36, 1)`, 200 to 500 ms): opacity and colour transitions, the intro's exit.
- **Camera**: 600 ms fly-to, zero under reduced motion.
- **Preview walk**: the camera travels the routed walk at about 32 m/s, so a whole tour plays in 12 to 45 seconds, with a 1.4 s glide down to the start; the bearing follows the street 35 m ahead with a 7% lerp per frame so turns are gentle.

A `MotionConfig` at the root honours `prefers-reduced-motion`: transforms and layout animations become instant while fades stay, so nothing appears without a cue. The magnetic Plan tour button holds still for those visitors.

## Shapes

Three radii. Inputs and secondary buttons use 12px. Cards and the drawer's inner boxes use 16px. Anything that floats over the map (toolbars, chips, the primary button, pins) is a full pill or circle, so floating shapes read as objects on the map rather than panels of the page. Borders are 1px in Line; the selected card swaps its border to Marker Orange rather than gaining weight. Two narrow exceptions sit outside the scale on purpose: hairline elements under 6px (the sheet grabber, scrollbar thumbs) take a 2 to 3px radius, and MapLibre's attribution keeps an 8px radius so it reads as a vendor control, not a Detour panel.

## Components

Each control below is an EasyUI primitive from `components/ui`, kept for its mechanics and re-skinned with the tokens above. Install more with `npx shadcn@latest add Surajmaurya1/easyui/<name>` and skin them the same way before they ship.

### Buttons
- **Shape:** full pill (9999px), 44px tall, 20px side padding. Nested inside a floating pill: 36px tall with a 44px hit area.
- **Primary:** Marker Orange fill with Ink text and the Raised shadow; hover shifts to Deep Marker with white text.
- **Secondary:** Surface fill, Ink text, Line Strong border; hover tints the fill to Paper.
- **Soft:** Orange Wash fill, Deep Marker text and border: the "already in your tour" state.
- **Press:** every button compresses to 97% on the Snappy spring and settles.
- **Magnetic:** the Plan tour button follows the pointer by a fifth of the offset and springs back; it is the one control that moves towards the hand.
- **Morphing:** a button whose label changes in place without changing size. Copy link becomes Copied (Success check); Add to walking tour becomes Added to your tour, then Remove from walking tour.
- **Focus:** 2px Deep Marker outline offset 2px, shared by every control on the site.
- **Disabled:** 40% opacity, cursor not-allowed, no hover change.
- **Skip links:** an Ink pill with Surface text, fixed top-left, visible only on keyboard focus. "Skip to places" opens every page; "Skip to map" opens the sidebar.

### Chips
- **Style:** full pill, 32px tall in panels and 36px floating over the map, Surface fill, Line border, Ink 2 text with a 16px Lucide icon.
- **State:** selected swaps the icon for a check and shows Deep Marker text and border over an Orange Wash that glides from the previously selected chip; hover darkens the text to Ink.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Surface on Paper.
- **Shadow Strategy:** Card at rest, Raised on hover; selected adds a Marker Orange border, not a shadow.
- **Border:** 1px Line.
- **Internal Padding:** 16px; thumbnail 64px square with a 12px radius.

### Inputs / Fields
- **Search bar:** 44px tall, Surface fill, Ink text, Ink 3 placeholder, 16px type on phones so iOS does not zoom. In panels it has 12px corners and a Line Field border; floating over the map it is a full pill with a Line border and the Float shadow. The search icon turns Ink on focus, a clear control scales in once there is text, Escape leaves the field, and the submit button sits inside the bar as a 36px Marker Orange circle with a 44px hit area. Clearing runs transitions.dev's "Input clear with dissolve": the text flies 12px down, blurs 2px and fades over 400 ms while an Ink streak flares under each word and the placeholder drops in from above; the field keeps the caret. Visitors who prefer reduced motion get an instant clear.
- **Select:** 44px tall, 12px corners, Line Field border, Ink text; the chevron rotates a hair past 180° as the menu springs open below. The menu is Surface with a Line border and the Float shadow; the highlighted option is Sunken, the chosen one Deep Marker with a check.
- **Label:** always present; visually hidden when the icon makes the purpose obvious.
- **Focus:** the global ring around the whole field.

### Floating dock
The signature control. A 44px Surface pill with a Line border and the Float shadow, sized to its content, centred over the map with a 16px minimum gutter. Items are 36px pills inside it that lift 1px on hover and show their label, or an Ink tooltip when they are icon-only; 1px Line dividers separate groups; the primary action is nested at the end with a 4px inset. The dock springs up from 16px below on first paint.

### Sheet
The place panel. On desktop it slides in from the right at 420px; on phones it rises as a bottom sheet to at most 92% of the viewport with a Line Strong grabber. Surface panel, Float shadow, an Ink scrim at 20% and no blur. A drag past 96px or a quick flick dismisses it; so do Escape, the scrim and the 44px close control. Focus lands on the close control and returns to the card that opened it.

### Trail
The tour's stop list. 28px numbered indicators sit beside each card, joined by a 1px Line connector; the walking leg ("22 m, under 1 min to stop 2") is written on the connector between cards. Stops before the active one fill Ink, the active stop is Marker Orange with a Deep Marker ring that glides between stops, and stops ahead are Surface with a Line Strong border.

### Feedback
- **Skeletons:** Sunken blocks with a slow light sweep, shaped like the content they replace.
- **Loader:** an Ink 2 arc on a Line track with a spoken label, for page-level waits.
- **Counts:** the tour's stops, metres and minutes roll up on their own digit columns when the tour is ready; a Badge inside Plan tour rolls when the pick count changes.
- **Tooltips:** Ink pill, Surface text, 12px, springing in from the side they belong to; shown on hover and on keyboard focus.

### Map
The basemap is OpenFreeMap's "Liberty" data dressed as the notebook (`lib/basemap.ts`): Sunken land, white streets with Line Strong casings, warm cream main roads, soft blue-grey water, sage parks, Ink place names and Ink 2 street names on Paper halos. Buildings are extruded from their real heights in warm greys (`#f0ede8` at ground level to `#d3cec6` at 120 m) under a soft warm light, with a Paper sky at the horizon and real terrain from the Terrarium elevation tiles. Zoomed right out the map becomes a globe. Both maps open in 3D; a dock control (Building2 icon, `aria-pressed`) lays the explore map flat and facing north, and drops the extrusions and terrain with it. A compass pill (36px, Surface, Line border, Marker Orange needle) sits top-right on both maps; the tour map's stack adds zoom. The device's position is drawn as "you are here": a 7px Ink dot with a 3px Surface ring that keeps its size at any pitch, over a faint Ink disc the size of the fix's accuracy.

Article pins are 7px Marker Orange circles with a 2px white stroke that keep their size at any pitch; clusters are Deep Marker circles with white tabular counts; the selected pin grows and gains a soft orange halo. The search circle and the planned route sit under the buildings so they occlude them like real streets. Tour stops are 28px numbered markers in Marker Orange with Ink numerals. The attribution control stays visible in compact form. The search circle follows a pan and settles after inertia; a zoom never moves it, so the pins on screen stay put while the visitor looks closer or wider. While a new search runs, or if it fails, the previous places stay on the map.

### Tour map
The tour is drawn as a model of the streets. The camera sits at 58° over the shared notebook basemap's extrusions and terrain with a Paper sky behind them; a dock control drops it to 2D. The route follows the streets, a 3.5px Marker Orange line over a 7px Surface casing drawn under the buildings so they occlude it like real corners; while routing is pending or unavailable it falls back to a 2.5px dashed line as the crow flies. Leg distances and minutes come from the routed walk, so the trail and the header totals describe the pavement, not the map. **Preview walk** glides the camera down to the start and travels the route at 62° and zoom 17, turning with the streets and lighting each stop's card and trail ring as it passes; any drag, scroll or pinch hands the camera back. Under reduced motion the preview steps from stop to stop instead of travelling.

### Not found
The 404 page keeps the illustration from EasyUI, redrawn in the notebook: a Marker Orange card, a Paper "404", a paper folder that lifts on hover and a Deep Marker cross that spins in, with pointer parallax on desktop. Below it a focused heading, one line of help, the path in a Sunken chip and the primary and secondary buttons.

## Do's and Don'ts

### Do:
- **Do** set text on Marker Orange in Ink, and orange text below 18px in Deep Marker.
- **Do** build icons from Lucide at 16px (chips, metadata) or 18px (toolbar) with a 2px stroke.
- **Do** size floating controls to their content with `width: max-content` and a 16px viewport gutter.
- **Do** give every control a visible focus ring, a name, and keyboard activation; divs are never clickable.
- **Do** keep panels opaque and let depth come from Surface-on-Paper plus the three shadows.
- **Do** build new controls from the EasyUI primitives in `components/ui`, re-skinned with these tokens before they ship.

### Don't:
- **Don't** use emoji as icons anywhere in the interface.
- **Don't** put an eyebrow or kicker label above a heading; the heading carries its own weight.
- **Don't** use `backdrop-filter` on any panel over the map.
- **Don't** reintroduce dark chrome: dark pills, dark splash screens, or dark error pages.
- **Don't** set functional text below 12px.
- **Don't** keep a registry component's own palette, glow or 11px labels; the mechanics come from EasyUI, the look comes from here.
