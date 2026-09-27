# DESIGN.md — GempaWatch

Design specification for the structural rework. Read in full before changing
any file. `PRD.md` defines the product; `CLAUDE.md` governs ingestion, scoring,
attribution, and data rules. This file governs *what the user sees* and *what
the app argues*.

Precedence: everything under `CLAUDE.md` §"Key Decisions (Do Not Change)"
outranks this file absolutely — PostGIS, mandatory BMKG attribution, nightly
precomputed profiles, and the prohibition on predictive or alarmist language.
Nothing here softens any of them. §11 lists the presentational lines in
`CLAUDE.md` to amend so the two docs stop disagreeing.

---

## 0. The thesis

**The homepage argues against the product.**

`PRD.md`'s vision states that most earthquake apps just list recent events, and
that GempaWatch answers a different question: *what is my actual risk, based on
decades of data.* The same document calls the point-based risk check "the
single most shareable, practical feature — designed to answer the question
every visitor actually has."

The shipped homepage leads with a live map and an event list of recent
earthquakes. The risk check sits at `/risk-check`, one of eight nav
destinations, below the feed the product positions itself against.

This is not a craft problem. The codebase is the most mature of the three in
this portfolio: a TypeScript port of the Python scoring engine verified against
Django-exported golden fixtures, six route-level `loading.tsx` files each
shaped to its target page, both `error.tsx` and `global-error.tsx` (the latter
inline-styled because tokens may be unavailable at that failure point),
reduced-motion handled at the CSS layer *and* the JS layer because Leaflet's
internal animations cannot be reached by a media query, and every hardcoded hex
carrying a comment naming the non-CSS rendering context that forced it. Keep
all of it.

Two things are wrong, and both are about what the app says rather than how it
is built:

**1. The product's question is not asked on the front page.** It is a feature
behind a nav link.

**2. The risk score has no referent.** `RiskScoreGauge` renders a number out of
100 with a percentile line. To a person in Cianjur, 63 means nothing. Risk is
inherently comparative — the real question is "worse or better than the place I
know" — and answering it currently requires navigating to `/compare` and
filling two selects.

**The fix: the homepage becomes the question, and the answer arrives with a
comparison built into it, carried by one signature object (§5).**

---

## 1. Decisions already made — do not relitigate

1. The homepage **is** the risk check. The live feed is demoted to a ticker.
2. Twelve routes collapse to five public destinations (§4).
3. `/compare` and `/explore` fold into region pages as inline context, not
   destinations.
4. The `RegionSeismogram` (§5) becomes the signature object and replaces
   `EventScatterTimeline`.
5. **Route paths stay English.** The UI copy is already entirely Indonesian and
   stays that way, but ~55 `/region/[slug]` pages are prerendered, indexed, and
   carry `RegionJsonLd` structured data. Renaming them to `/wilayah/[slug]` for
   internal consistency would trade real SEO value for a URL string almost no
   user reads. Consistency is not worth that here.
6. ~~The "Fault Line" palette and the dark-only decision are frozen.~~
   **Superseded 2026-09-27 by the "Kertas & Tinta" rework (§13)**, by the
   owner's decision: light default, dark following the OS, colour only for data.
7. `MagnitudeFreqChart` and `DepthHistogram` **survive as separate charts.** See
   §5.5 — the absorb-into-the-core-object move is only valid when components
   share axes, and these do not.

---

## 2. House layer — portable across the portfolio

**Version 3.** GempaWatch contributes two new rules and is the reference
implementation for the quality floor.

### 2.1 Core-object dominance

Every app has one core object: largest element, first rendered, legible in full
at default state.

### 2.2 The homepage asks the product's question

New rule, and the one this app breaks hardest. **The homepage is the product's
central question being asked and answered — not a directory of features, not a
dashboard, not the most easily-built module.** If the PRD contains a sentence
of the form "this product answers X," the front page is where X gets asked.

Falak's home was a hero-and-feature-grid. ClimateWatch's asks the right
question in its headline but answers it with eight modules. GempaWatch's asks
nothing at all and shows a feed. Three apps, three versions of the same miss.

### 2.3 Absorption requires shared axes

New rule, and a limit on the move used in Falak and ClimateWatch. A component
may be absorbed into the core object as a layer **only if it plots the same
data on the same axes.** ClimateWatch's season scatter is a line on the
fingerprint because both are year × month. GempaWatch's magnitude-frequency and
depth-distribution charts are *distributions*, not time series — they share no
axis with the seismogram, and folding them in would be cargo-culting a pattern
rather than applying it. Keep them; demote them.

### 2.4 Spacing, type scale, motion timing

One scale each, defined as tokens, Tailwind's defaults replaced rather than
extended. GempaWatch's fluid `--step-000`…`--step-5` scale and its
`--dur-fast/base/slow` + `--ease-out` set are correct. Keep exactly.

### 2.5 Theme count

The number of themes is a deliberate, stated choice. GempaWatch has **two**,
chosen by the OS setting with no toggle: **Kertas** (light, the default) and
**Malam** (dark). See §13 and the header of `tokens.css`.

### 2.6 Quality floor — GempaWatch is the reference

Every project in the portfolio should match what this one already does:

- Route-level `error.tsx` **and** a root `global-error.tsx` that assumes
  nothing about token or Tailwind availability
- One `loading.tsx` per route, shaped to that route's actual layout
- `prefers-reduced-motion` honoured at the CSS layer **and** at the JS layer
  for any library with its own animation engine
- Tokenised tap targets (`--tap-min`, `--tap-comfortable`)
- Site-wide `:focus-visible` plus per-control `focus:` styling
- Every chart paired with a real `<table class="sr-only">` of the same data
  (`ChartFigure.tsx` is the pattern — port it to the other projects)
- Hardcoded hex permitted only in non-CSS rendering contexts (SVG attributes,
  Recharts inline props, `next/og`, root error boundary), each with a comment
  naming the context

**One gap:** contrast ratios were never measured against the token palette.
Both sibling projects carry measured ratios in comments. Measure
`--text-primary`, `--text-secondary`, and `--text-muted` against `--surface`
and `--earth-dark`, record the ratios in `tokens.css`, and fix anything under
4.5:1 by adjusting lightness only.

---

## 3. Identity

### 3.1 Palette — "Kertas & Tinta" (supersedes "Fault Line")

A seismograph writes in ink on paper, and so does the interface.

- **Chrome is ink on paper.** Buttons, links, headings, focus rings: ink.
- **Colour is data.** Only two things may be coloured: depth (every quake
  mark — `MagnitudeBadge`'s `<30 km` red, `<100 km` orange, else blue
  thresholds, unchanged) and the risk tier (tinggi/sedang/rendah). The logo's
  epicentre dot is shallow red, which still obeys the rule.
- The previous palette used one orange for brand, buttons, links, heading
  ticks *and* the 30–100 km depth band, next to risk red. On a HIGH result
  nothing carried meaning. That is why it was retired.
- Tokens live in `styles/tokens.css` as RGB channels consumed through the
  unchanged `channel()` / `rgb(var(--x-c) / <alpha-value>)` pattern. Contrast
  ratios are measured and recorded there.
- Depth and tier colours are CSS variables, not hexes, everywhere including
  SVG attributes, Leaflet paths and Recharts props (verified in Chromium and
  WebKit). Hex mirrors remain only for `next/og` (`seismic.ts` `*_HEX`,
  `og.tsx`), the root error boundary, and the canvas basemap (`BaseMap.tsx`).

### 3.2 Typography

**Plus Jakarta Sans** for headlines and prose (drawn by the Indonesian foundry
Tokotype for Jakarta's city identity), 800 for the score and place names, 400
for reading. **JetBrains Mono** only where digits must align or read as
instrument output: coordinates, axis ticks, tables.

### 3.3 Tone — this one carries real weight

`CLAUDE.md` forbids predictive and alarmist language. That rule needs
presentational teeth, not just copy review:

- Never a countdown, a "due for one," a probability of an event occurring, or
  any forward-looking phrasing. Historical pattern framing only, always past
  tense.
- A HIGH risk tier is a **statement about the record**, not a warning. "In the
  last 50 years, 14 earthquakes of M5 or above occurred within 100km" is the
  claim. "Your area is dangerous" is not.
- Red is reserved for the risk tier and for shallow depth. It never appears as
  page chrome, alert banners, or emphasis. A page that is mostly red reads as
  an alarm, and this app is not an alarm.
- Every risk output sits next to the sentence that this is not an official
  warning system and does not replace BMKG. Quiet and permanent, not a modal.
- Preparedness content is never framed as urgency. `PreparednessChecklist` is
  reassurance — the thing you can actually do — and should read that way.

---

## 4. Information architecture

Five public destinations. Paths preserved where indexed.

| Route | Role | Absorbs |
|---|---|---|
| `/` | Ask: where are you? Answer in place. | `/risk-check`, `/risk` |
| `/region/[slug]` | Your place, in full, with comparison inline | `/compare`, `/explore` |
| `/map` | Explore space: faults, tsunami zones, events | — |
| `/timeline` | Remember: curated disaster archive | — |
| `/about` | Audit: methodology, sources, `ScoreLab` | — |

`/unsubscribe/[token]` stays as a live-build-only functional route, not a
destination. `/risk/[lat]/[lng]` stays in live builds as the shareable
server-rendered result — it exists for OG images and links, which is a real
job.

Retired paths (`/risk-check`, `/risk`, `/compare`, `/explore`) keep a stub that
client-side redirects with query params preserved, `robots: { index: false }`,
and a canonical pointing at the new location. Static hosting cannot issue a
302, and the existing `.live.tsx` gating shows the pattern is already
understood in this codebase.

Nav drops from eight items to four plus the logo.

---

## 5. `RegionSeismogram` — the signature

A fifty-year instrument trace: horizontal time axis, one vertical spike per
recorded event, spike height encoding magnitude and spike colour encoding
depth. It replaces `EventScatterTimeline` and becomes the object that carries
every risk answer in the app.

A scatter plot is the correct *analytical* form for time × magnitude and the
wrong *communicative* one. Dots in a field do not show a quiet decade. A flat
stretch in a trace does, immediately, to someone who has never read a chart —
and quiet stretches are what risk communication actually turns on.

### 5.1 Encoding

- **x** — linear time, 1970 to now, right edge is the present moment.
- **y (height)** — magnitude, on a mild power curve so that a major event
  visibly dominates without erasing the background of M4s. Linear-in-magnitude
  makes an M9 only about twice an M4; linear-in-energy makes everything else
  invisible. Because the curve is non-linear, it **must be labelled**: draw
  faint horizontal reference lines at M5, M6 and M7 so the mapping is auditable
  rather than felt.
- **colour** — depth, using `MagnitudeBadge`'s exact thresholds from
  `CLAUDE.md`: `<30km` red, `<100km` seismic orange, else depth blue. Do not
  invent a new scale. This makes shallow clusters visible at a glance, which is
  the thing that actually correlates with damage.
- **`SourceAttribution` renders with it**, per `CLAUDE.md`'s mandatory rule.

### 5.2 Computed annotations

Two annotations only, both derived, neither decorative:

- **The longest quiet stretch** — the largest gap containing no M5+ event.
  Shaded, with its duration stated. This is a real finding about the record and
  it is the single most communicative feature of the trace.
- **The largest event** — labelled with name, date and magnitude.

Nothing else. No trend line: a trend line on a seismic record implies a
direction of travel over time, which edges toward prediction, and `CLAUDE.md`
forbids that framing.

### 5.3 The live feed becomes the right edge

The last 24 hours are the final pixels of the trace. The feed's real job in
*this* product is not news — it is evidence that the record is live and the
score is current.

- Homepage: a thin ticker strip, not a 440px map card.
- The trace's right edge carries a subtle live marker.
- `LiveMap` survives on `/map`, where a map of recent events genuinely belongs.
- `EventList` survives as the ticker's expanded view and keeps its BMKG/USGS
  dedup footnote.

### 5.4 Comparison mode

Two traces stacked, yours above the reference, sharing **one y-scale and one
x-scale**. Different scales would make the comparison a lie, and this is the
single most important constraint in this component.

This is what `/compare` was for, done inline. Default reference is the nearest
large city; the reference is user-changeable via the existing
`CompareSelector` logic, reduced to one select.

### 5.5 What it does not absorb

`MagnitudeFreqChart` (Gutenberg-Richter counts) and `DepthHistogram` are
distributions, not time series. They share no axis with the trace. They stay as
separate Recharts figures below it, keeping their `ChartFigure` sr-only tables.
See §2.3 — absorption without shared axes is pattern-copying, not design.

### 5.6 Accessibility

The trace is `aria-hidden` and wrapped in `ChartFigure`, which already emits a
real `<table class="sr-only">` — extend that table with the quiet-stretch and
largest-event annotations so the derived findings are not visual-only. Spikes
are not individually focusable; the table is the keyboard path.

---

## 6. `/` — the homepage

```
┌──────────────────────────────────────────────────────────────┐
│  nav                                                         │
├──────────────────────────────────────────────────────────────┤
│  Seberapa rawan gempa tempat kamu?          ← the question   │
│                                                              │
│  [ picker map ]     [ Gunakan lokasi saya ]                  │
│                     [ Jakarta ][ Bandung ][ Surabaya ]...    │
├──────────────────────────────────────────────────────────────┤
│  ── answer appears in place, no navigation ──                │
│                                                              │
│  [ score + tier ]   [ 50-year seismogram for this point ]    │
│  [ comparison trace: reference city ]                        │
│  [ score breakdown ] [ share ] [ full profile → ]            │
├──────────────────────────────────────────────────────────────┤
│  ticker: gempa 24 jam terakhir · BMKG                        │
├──────────────────────────────────────────────────────────────┤
│  footer: sumber, disclaimer, methodology link                │
└──────────────────────────────────────────────────────────────┘
```

`RiskCheckTool` already orchestrates the picker map, geolocation, five shortcut
cities and an idle/loading/error/report state union with an `role="status"`
live region. It is built correctly and in the wrong place. Move it, do not
rewrite it.

The answer renders **in place**. No route change, no page transition — the
question and its answer occupy one screen. `RiskReportView` becomes the
in-place answer body; `/risk/[lat]/[lng]` remains as its shareable permalink in
live builds.

Delete the four-`StatTile` row. Nationwide 24-hour counts are not the product's
question and they are the first thing a doom-feed shows.

---

## 7. `/region/[slug]`

Order changes; components mostly survive.

1. `PageHeader`, `ShareButton`
2. **Headline sentence** — the finding in prose, not a stat row: *"Dalam 50
   tahun terakhir tercatat 14 gempa M5 ke atas dalam radius 100km dari
   Balikpapan. Yang terbesar M6.3 pada 1998."*
3. **`RegionSeismogram`**, full width, with the comparison trace directly below
4. `RiskProfileCard` (gauge, tier, stat rows) and `ScoreBreakdown`
5. Ranking context — where this region sits among all regions, absorbed from
   `/explore`'s `Leaderboard`, as a single positioned row rather than a list
6. `MagnitudeFreqChart`, `DepthHistogram`, `CoverageNote`,
   `LargestEventSensitivity`
7. `TsunamiEvidencePanel` (coastal regions only)
8. `PreparednessChecklist`
9. `SourceAttribution`

The four `StatTile`s at the top go. Their content is either in the headline
sentence or in `RiskProfileCard`, and a row of tiles before the evidence is the
dashboard reflex this rework exists to remove.

---

## 8. Deletions

- `/risk-check`, `/risk`, `/compare`, `/explore` as destinations (stubs remain)
- `EventScatterTimeline` — replaced by `RegionSeismogram`
- The homepage's four-`StatTile` row and the 440px `DynamicLiveMap` card
- The region page's four-`StatTile` row
- `CompareSelector`'s two-select-plus-swap form — reduced to one reference
  select inside the seismogram

Kept but relocated: `Leaderboard` (region page ranking row, and `/about` if it
still earns a place), `EventList` (ticker expansion), `LiveMap` (`/map` only).

---

## 9. `/map`, `/timeline`, `/about`

Largely unchanged; three targeted notes.

**`/map`** is the only route where a map should fill the viewport. Raise
`HazardMap` from `height: 600` inside a `Card` to a full-bleed height with the
layer toggles floating over it. Exploring space is what this page is for, and a
bounded card is fighting it.

**`/timeline`** is the app's emotional and educational layer and is currently
its best-judged page — `DisasterEntry` escalating above 5000 casualties is
exactly right restraint. One addition: each entry gets a small seismogram
fragment showing that event in its regional context, which ties the archive to
the signature object and shows a 2004 or a 2018 as the outlier it was.

**`/about`** carries `ScoreLab`, the four-slider interactive that recomputes
the score live. That is the most credibility-building thing in the product and
it is on the least-visited page. Link to it directly from every
`ScoreBreakdown`, with the region's own values pre-loaded.

---

## 10. Migration order

1. **`RegionSeismogram`** standalone, against fixture data from the existing
   golden fixtures, before wiring it anywhere. Get the magnitude curve, the
   reference lines, the depth colours and the quiet-stretch detection right.
2. **Region page reorder** — seismogram in, `EventScatterTimeline` out, stat
   tiles out, headline sentence in.
3. **Comparison mode** on the seismogram, shared scales enforced.
4. **Homepage rebuild** — `RiskCheckTool` moved up, answer in place, ticker in,
   stat tiles and map card out.
5. **Route consolidation** — ranking row into region pages, redirect stubs for
   the four retired paths.
6. **`/map` full-bleed**, `/timeline` seismogram fragments, `ScoreLab`
   deep-links.
7. **Contrast measurement** and any lightness fixes, recorded in `tokens.css`.
8. **Type change** (§3.2) only if everything above is done.

Check the seismogram at 375px after step 1. Fifty years of spikes on a phone is
the hardest case here — expect to need a reduced density mode (M5+ only) below
some breakpoint, and decide that deliberately rather than letting spikes
overlap into a smear.

---

## 11. `CLAUDE.md` amendments required

1. `PRD.md`'s tech stack lists "Recharts + D3.js" — D3 is not in the codebase
   and is not needed. Remove it.
2. `PRD.md`'s "Signature Element: Magnitude badges" → `MagnitudeBadge` remains
   the universal *component*, but the signature *object* is now
   `RegionSeismogram`. Both entries should say so.
3. `PRD.md`'s homepage layout sketch shows the live map as the hero. Replace it
   with §6.
4. Add the seismogram's magnitude curve and depth-colour reuse to the frontend
   conventions, so the encoding is specified in one place.

---

## 12. Do not

- Do not colour chrome. If it is coloured, it encodes depth or a risk tier.
- Do not put the live feed back at the top of the homepage under any framing —
  "users expect it" is exactly the reasoning this rework rejects.
- Do not draw a trend line on the seismogram, or any element implying what
  happens next. `CLAUDE.md`'s prohibition on predictive framing is absolute.
- Do not let the two comparison traces use different scales.
- Do not strip, hide, or defer `SourceAttribution`. BMKG credit is a legal
  requirement, not a design element.
- Do not use red as page chrome. It belongs to the risk tier and to shallow
  depth, and nowhere else.
- Do not absorb the distribution charts into the seismogram. They do not share
  its axes.
- Do not reintroduce a keyed third-party tile host. The basemap is the
  self-hosted Protomaps extract (`public/tiles/`, `scripts/fetch-tiles.sh`).

---

## 13. "Kertas & Tinta" rework (2026-09-27)

Owner-approved redesign, delivered in five commits' worth of phases:

1. **Foundations** — self-hosted basemap (CARTO began returning "API KEY
   REQUIRED" tiles, so every map in production showed no geography), the
   Kertas/Malam tokens, Plus Jakarta Sans, ink primitives.
2. **Homepage + result** — the hero is the earthquake record itself (every
   M4.5+ event since 1970, drawn on canvas, no basemap needed) with a floating
   ask panel; the result renders full width: verdict, a dot plot of all scored
   regions (the score's referent, §0 point 2), a ruled fact row, the trace,
   actions, and methodology as expandable sections.
3. **Regions** — `/regions` index (label "Wilayah") grouped by island with a
   mini M5+ trace per region; region pages reuse the result blocks with a
   radius locator. Navigation becomes Cek Lokasi · Wilayah · Peta · Sejarah ·
   Metodologi, a "Gempa terkini" pill replaces the homepage ticker, and phones
   get a bottom tab bar.
4. **Map + timeline** — a year scrubber replays the record on `/map`; the
   timeline gets one national trace with disaster flags.
5. **Polish** — the result's one motion moment, persistent checklist,
   an expanded, sourced disaster archive.

Route paths stay English (§1 decision 5): the index is `/regions`, the
methodology page stays `/about`.
