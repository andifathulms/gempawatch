# PRD — GempaWatch

> A public earthquake risk intelligence platform for Indonesia. Combines real-time
> BMKG and USGS data with 50+ years of historical seismic patterns to help people
> understand earthquake risk in their own area — not just react to the latest shake.

---

## Vision

Indonesia sits on the Ring of Fire — the most seismically active country on Earth —
yet there is no free, polished, public platform that turns this risk into something
people can actually understand for their own location. Most earthquake apps just
list recent events. GempaWatch answers a different question: **"What is my actual
risk, based on decades of data?"**

---

## Target Users

| User | Need |
|---|---|
| General public | "Is my city earthquake-prone? Should I worry?" |
| Coastal residents | Tsunami risk awareness |
| Students / researchers | Historical seismic data, magnitude-frequency stats |
| Journalists | Quick factual context during breaking earthquake news |
| BNPB / local government (potential) | Public-facing risk communication tool |
| Content creators (you) | "Kota kamu rawan gempa nggak?" TikTok series |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5 + Django REST Framework |
| Task Queue | Celery + Redis |
| Database | PostgreSQL 16 + PostGIS (spatial queries) |
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Maps | Leaflet.js + OpenStreetMap / CartoDB tiles |
| Charts | Recharts + D3.js |
| Container | Docker + Docker Compose |
| Deployment | GCP VM + Nginx |

---

## Data Sources

### Primary — BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)
Official Indonesian source. Free, open, XML/JSON, no key required.

```
https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json          # latest single event
https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json       # last 15, M5.0+
https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json     # last 15 felt events
```
**Mandatory attribution**: BMKG must be credited as data source on every page
displaying their data — this is a legal requirement from BMKG, not optional.

Limitation: BMKG only exposes the most recent 15 events per feed — no deep
historical query. Use Celery to poll and accumulate history into our own DB.

### Secondary — USGS Earthquake API
Free, no key, global coverage, full historical archive back to 1900+, supports
date-range queries — fills the historical gap BMKG can't.

```
https://earthquake.usgs.gov/fdsnws/event/1/query
  ?format=geojson
  &starttime=2000-01-01
  &endtime=2025-01-01
  &minlatitude=-11&maxlatitude=6
  &minlongitude=95&maxlongitude=141    # Indonesia bounding box
  &minmagnitude=4.0
```

### Bootstrap Strategy
Since BMKG has no historical query, use **USGS for all historical backfill**
(bounded to Indonesia coordinates), then switch to **BMKG polling for live/recent
events** going forward, cross-referencing both by time+location to avoid duplicates.

### Reference Data (static, manually sourced once)
- Indonesian fault line GeoJSON (Sumatra Fault, Sunda Megathrust, Palu-Koro Fault,
  etc.) — sourced from published USGS/academic fault datasets, stored as static
  GeoJSON in the repo
- Major historical disaster events (Aceh 2004, Yogyakarta 2006, Padang 2009,
  Palu 2018, Cianjur 2022) — manually curated dataset with casualty figures,
  for the Disaster Timeline feature

---

## Core Features

### 1. Live Earthquake Feed (Homepage)
Real-time map of Indonesia, last 24h of detected earthquakes, magnitude-scaled
circle markers, merged from BMKG + USGS (deduplicated).

**Components:**
- Map: circle size = magnitude, color = depth (shallow = red, deep = blue)
- List view: sortable by time/magnitude, with "felt" badge if BMKG dirasakan data
- Auto-refresh every 5 minutes (matching BMKG's typical update cadence)
- Click marker → mini detail panel: magnitude, depth, location, time, source

### 2. Regional Risk Profile
Pick any kabupaten/kota (or use geolocation) → full historical risk breakdown.

**Components:**
- **Risk Summary Card**: total M4+ events within 100km in last 50 years,
  largest recorded event, average frequency (events/year)
- **Magnitude-Frequency Chart**: Gutenberg-Richter style — bar chart showing
  count of M4+, M5+, M6+, M7+ events for the region
- **Depth Distribution**: histogram of event depths (shallow quakes are more
  damaging — this matters)
- **Timeline**: scatter plot of all historical events for the region, magnitude
  on Y-axis, time on X-axis — visually shows clustering/quiet periods
- **Nearest Fault Line**: distance in km to nearest known fault, fault name

### 3. Fault Line & Hazard Map
Full Indonesia map overlaying:
- Known fault lines (static GeoJSON layer)
- Historical event density heatmap (kernel density estimation)
- Toggle layers: faults / heatmap / both

### 4. Tsunami Risk Zones
Coastal areas flagged based on:
- Proximity to coastline (< 10km)
- Historical tsunami-triggering event criteria (shallow depth < 70km,
  magnitude ≥ 6.5, offshore epicenter)
- Cross-reference with historical tsunami events dataset (manually curated,
  sourced from BMKG/BNPB public records)

**Output:** Risk tier per coastal region (Low / Moderate / High) with explanation
of the criteria used — always transparent about methodology, never alarmist
without basis.

### 5. Disaster Timeline / Memory
Curated historical archive of major Indonesian earthquakes/tsunamis:
Aceh 2004, Yogyakarta 2006, Padang 2009, Palu 2018, Lombok 2018, Cianjur 2022,
and others. Each entry: date, magnitude, casualties, brief context, photos
(public domain/CC only), link to further reading.

**Format:** Vertical scrolling timeline, most impactful entries get more visual
weight. This is the shareable, educational, emotional content layer.

### 6. "Am I In a Risk Zone?" Tool
User shares location (or selects on map) → instant report:
- Distance to nearest fault line
- Historical M4+ event count within 50km (last 50 years)
- Tsunami risk tier (if coastal)
- Comparison: "This is [higher/similar/lower] risk than [reference city]"

**Why this matters:** This is the single most shareable, practical feature —
designed to answer the question every visitor actually has.

---

## Database Models

### EarthquakeEvent
```
id, external_id (unique, source-specific),
source (BMKG | USGS),
event_time (datetime, UTC),
magnitude (float),
depth_km (float),
latitude, longitude (PointField via PostGIS),
location_description (text),
region (FK to AdminRegion, nullable — resolved via reverse geocoding),
felt_reports (text, nullable — BMKG "dirasakan" field),
potensi_tsunami (boolean, nullable),
shakemap_url (text, nullable),
raw_data (JSONField)
```

### AdminRegion
```
id, name, type (provinsi | kabupaten | kota),
parent FK (self, nullable),
centroid (PointField),
boundary (PolygonField, nullable — for choropleth, optional/future)
```

### FaultLine
```
id, name, geometry (LineStringField via PostGIS),
fault_type (e.g., 'strike-slip', 'thrust', 'megathrust'),
source_citation (text)
```

### HistoricalDisaster
```
id, name, event_date, magnitude, epicenter (PointField),
casualties (int, nullable), displaced (int, nullable),
description (text), image_url (nullable, CC-licensed only),
source_links (ArrayField)
```

### RegionRiskProfile (computed/cached)
```
id, region FK, computed_at,
event_count_m4 (int), event_count_m5 (int),
event_count_m6 (int), event_count_m7_plus (int),
largest_magnitude (float), largest_event FK (EarthquakeEvent),
avg_depth_km (float), nearest_fault FK (FaultLine, nullable),
nearest_fault_distance_km (float, nullable),
tsunami_risk_tier (LOW | MODERATE | HIGH | none),
last_updated
```
*Recomputed nightly via Celery, not on every request — these are expensive
spatial aggregations.*

---

## Ingestion Architecture (Celery Beat)

```
Every 5 minutes:
  → poll_bmkg_autogempa()           # latest single event
  → poll_bmkg_gempaterkini()        # last 15 M5.0+
  → poll_bmkg_gempadirasakan()      # last 15 felt
  → deduplicate_and_upsert()        # match against USGS by time+location proximity

Daily at 02:00 WIB:
  → sync_usgs_recent()              # last 7 days, fills any BMKG gaps
  → recompute_region_risk_profiles() # rebuild RegionRiskProfile for all regions

One-time bootstrap:
  → python manage.py earthquake_bootstrap
    → USGS historical pull, Indonesia bbox, 1970–present, M4.0+
    → Reverse-geocode each event to nearest AdminRegion (PostGIS ST_Distance)
    → Initial RegionRiskProfile computation for all regions
```

### Deduplication Logic
BMKG and USGS will both report major events — must merge, not duplicate.

```python
def is_duplicate(new_event, existing_events, time_window_min=5, distance_km=50):
    """
    Two events are considered the same if they occur within 5 minutes
    and 50km of each other. BMKG record takes priority when duplicate
    (more locally accurate), USGS used as fallback/historical fill.
    """
```

---

## DRF API Endpoints

```
GET /api/earthquakes/live/                    → last 24h, all sources merged
GET /api/earthquakes/{id}/                     → single event detail
GET /api/earthquakes/felt/                     → BMKG "dirasakan" feed

GET /api/regions/{id}/risk-profile/            → full risk profile for a region
GET /api/regions/{id}/timeline/                → historical event scatter data
GET /api/regions/search/?q={query}             → search regions by name
GET /api/regions/nearest/?lat=&lng=             → resolve coordinates to region

GET /api/faults/                               → all fault line GeoJSON
GET /api/faults/nearest/?lat=&lng=              → nearest fault to a point

GET /api/tsunami-risk/coastal-zones/           → all coastal risk tier data

GET /api/disasters/timeline/                   → curated historical disaster list
GET /api/disasters/{id}/                       → single disaster detail

POST /api/risk-check/                          → body: {lat, lng} → full risk report
```

---

## Frontend Pages (Next.js App Router)

```
/                          → Home: live map, recent events, risk-check CTA
/risk-check                → "Am I in a risk zone?" interactive tool
/region/[slug]              → Regional risk profile page
/map                        → Full fault line + heatmap explorer
/timeline                   → Disaster Timeline / Memory
/about                      → Methodology, data sources, BMKG attribution
```

### Homepage Layout
```
┌─────────────────────────────────────────────┐
│  GEMPAWATCH          [Cek Risiko Saya →]     │
├─────────────────────────────────────────────┤
│                                             │
│   [Live Map — last 24h events]              │
│   Magnitude-scaled markers, auto-refresh    │
│                                             │
├────────────────────┬────────────────────────┤
│  RECENT EVENTS      │  THIS WEEK IN NUMBERS  │
│  [scrollable list]  │  Total events: 47      │
│                     │  Largest: M5.8 Maluku  │
│                     │  Felt reports: 3       │
└────────────────────┴────────────────────────┘
│   [Disaster Timeline preview — scroll teaser]│
└─────────────────────────────────────────────┘
```

### Risk Check Tool Layout
- Map with draggable pin or geolocation button
- On location selected → side panel slides in with full risk report
- Shareable result card (designed for screenshot/social sharing)

---

## Design System — "Fault Line"

**Philosophy:** Calm authority, not alarmism. This is a safety/information tool —
the design should feel like a trusted government instrument, not a doom-scrolling
disaster app. Warm enough to not feel cold/bureaucratic, serious enough to be credible.

**Color Palette**
```
--earth-dark:      #1A1A1A    (background)
--surface:         #232323    (cards)
--surface-raised:  #2D2D2D    (elevated panels)
--border:          #3A3A3A    (dividers)

--seismic-orange:  #E8743B    (primary accent — magnitude indicators, CTAs)
--depth-blue:      #4A7C9E    (deep earthquakes, calm informational elements)
--risk-red:        #C0392B    (high risk indicators only — used sparingly)
--risk-amber:      #D4A12B    (moderate risk)
--risk-green:      #5B8C5A    (low risk — reassuring, not alarming)

--text-primary:    #F2EDE4    (warm off-white, not stark white)
--text-secondary:  #A8A39A
--text-muted:      #6B6660
```

**Typography**
- Headlines: `Inter` 600–700
- Data/Magnitude numbers: `DM Mono` — precise, scientific feel
- Body: `Inter` 400

**Signature Element:** Magnitude badges — circular, size scales with magnitude
(M4 small, M7+ large), color scales with depth. Used consistently everywhere
an earthquake is referenced (list, map popup, timeline).

**Map Style:** Warm-toned terrain base (not cold blue ocean default) — use
CartoDB Voyager or custom Indonesia-focused styling. Fault lines in seismic-orange,
dashed for inferred/uncertain sections.

---

## Phase Plan

### Phase 1 — Foundation + Live Feed (Week 1–2)
- [ ] Django + PostGIS setup, all models
- [ ] BMKG polling tasks (autogempa, gempaterkini, gempadirasakan)
- [ ] USGS historical bootstrap (Indonesia bbox, 1970–present)
- [ ] Deduplication logic
- [ ] Live feed DRF endpoint
- [ ] Homepage with live map + recent events list

### Phase 2 — Regional Risk Profiles (Week 3–4)
- [ ] AdminRegion model + Indonesian region boundary data (provinsi/kabupaten)
- [ ] Reverse geocoding: event → region (PostGIS spatial query)
- [ ] RegionRiskProfile computation + nightly Celery rebuild
- [ ] Region detail page: magnitude-frequency chart, timeline scatter, depth histogram
- [ ] Region search

### Phase 3 — Fault Lines + Risk Check Tool (Week 5–6)
- [ ] Source and load fault line GeoJSON data
- [ ] Fault line map layer + nearest-fault query
- [ ] Tsunami risk zone classification logic
- [ ] "Am I In a Risk Zone?" interactive tool with geolocation
- [ ] Shareable risk report card (designed for screenshot)

### Phase 4 — Disaster Timeline + Polish (Week 7)
- [ ] Curate historical disaster dataset (manual research, verified sources)
- [ ] Disaster Timeline page with scroll-based layout
- [ ] About/methodology page with full BMKG + USGS attribution
- [ ] Mobile responsive polish
- [ ] SEO: sitemap, region-level metadata

### Phase 5 — Future
- [ ] Push notification opt-in for significant nearby events
- [ ] Bahasa Indonesia full translation
- [ ] Embeddable widget for news sites / BNPB partnership potential
- [ ] Building vulnerability overlay (if open data becomes available)

---

## Data Quality & Attribution Rules

1. **BMKG attribution is mandatory by their terms of use** — every page showing
   BMKG-sourced data must display "Sumber: BMKG" with link
2. **USGS attribution** — credit USGS for historical/international data
3. **Never imply prediction** — this tool shows historical patterns and risk
   context, never "an earthquake will happen." Use language like "historically
   prone to" not "will experience"
4. **Magnitude data may be revised** — BMKG explicitly notes early readings can
   change; display a "preliminary" tag on events < 1 hour old
5. **Tsunami risk tiers are estimates** — always show methodology link, never
   present as official BMKG/BNPB tsunami warning (which has its own dedicated
   real-time alert system — we are not replacing that)

---

## Out of Scope (v1)
- Real-time tsunami warning/alert system (this is BMKG's official mandate —
  we link to it, never replace it)
- User accounts
- Push notifications (Phase 5)
- Building-level structural risk assessment
- Non-Indonesian earthquake coverage (USGS used only for ID bbox)
