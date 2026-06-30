# CLAUDE.md — GempaWatch

## What You Are Building

GempaWatch is a public earthquake risk intelligence platform for Indonesia. It merges
real-time BMKG (official Indonesian) and historical USGS (global) earthquake data,
stores it in PostGIS-enabled PostgreSQL, and computes regional risk profiles so users
can understand earthquake risk for their specific location — not just see a list of
recent quakes.

Read PRD.md first. This file contains build conventions and exact build order.

---

## Repository Structure

```
gempawatch/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── local.py
│   │   │   └── production.py
│   │   ├── celery.py
│   │   └── urls.py
│   ├── apps/
│   │   ├── earthquakes/         # EarthquakeEvent model, ingestion tasks
│   │   │   ├── tasks/
│   │   │   │   ├── bmkg.py
│   │   │   │   ├── usgs.py
│   │   │   │   └── dedup.py
│   │   │   └── management/commands/earthquake_bootstrap.py
│   │   ├── regions/             # AdminRegion, RegionRiskProfile
│   │   │   └── tasks/risk_profile.py
│   │   ├── faults/              # FaultLine model + static data loader
│   │   ├── disasters/           # HistoricalDisaster model
│   │   └── api/                 # All DRF viewsets
│   ├── data/
│   │   ├── fault_lines.geojson           # static reference data
│   │   ├── admin_regions.geojson         # Indonesian province/kabupaten boundaries
│   │   └── historical_disasters.json     # curated disaster dataset
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── map/             # LiveMap, FaultLineLayer, HeatmapLayer
│   │   │   ├── risk/            # RiskProfile, RiskCheckTool, MagnitudeFreqChart
│   │   │   ├── timeline/        # DisasterTimeline, EventScatter
│   │   │   └── ui/              # MagnitudeBadge, RiskTierBadge, SourceAttribution
│   │   ├── lib/api.ts
│   │   └── styles/tokens.css
│   └── package.json
├── docker-compose.yml
└── nginx/gempawatch.conf
```

---

## Environment Variables

```env
SECRET_KEY=
DEBUG=False
ALLOWED_HOSTS=
DATABASE_URL=postgis://gempawatch:password@db:5432/gempawatch
REDIS_URL=redis://redis:6379/0

# No API keys needed — BMKG and USGS are both fully open, no auth

NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Django Conventions

- Django 5 + DRF 3.15+ + `django.contrib.gis` (GeoDjango)
- PostgreSQL must have PostGIS extension enabled:
  `CREATE EXTENSION IF NOT EXISTS postgis;`
- Use `django.contrib.gis.db.models.PointField`, `LineStringField`, `PolygonField`
- All apps under `backend/apps/`

### Base Model
```python
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

### Spatial Query Pattern
```python
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance

# Find events within 50km of a point
nearby = EarthquakeEvent.objects.filter(
    location__distance_lte=(user_point, D(km=50))
).annotate(
    distance=Distance('location', user_point)
).order_by('distance')
```

---

## BMKG Ingestion Conventions

### Endpoints (no auth required)
```python
BMKG_ENDPOINTS = {
    "latest": "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
    "recent_m5": "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json",
    "felt": "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json",
}
```

### Response Shape (BMKG JSON)
```json
{
  "Infogempa": {
    "gempa": {
      "Tanggal": "30 Mar 2025",
      "Jam": "09:58:35 WIB",
      "DateTime": "2025-03-30T02:58:35+00:00",
      "Coordinates": "5.63,95.47",
      "Lintang": "5.63 LU",
      "Bujur": "95.47 BT",
      "Magnitude": "5.4",
      "Kedalaman": "10 km",
      "Wilayah": "Pusat gempa berada di darat 18 Km TimurLaut Banda Aceh",
      "Potensi": "Gempa ini dirasakan untuk diteruskan pada masyarakat",
      "Dirasakan": "IV Banda Aceh, IV Aceh Besar, III Takengon",
      "Shakemap": "20250330025835.mmi.jpg"
    }
  }
}
```
Note: `gempaterkini.json` and `gempadirasakan.json` wrap an array under
`Infogempa.gempa` (list) instead of a single object — handle both shapes.

Shakemap images: prefix with `https://data.bmkg.go.id/DataMKG/TEWS/` to get
full URL.

### Parsing Rules
- Parse `Kedalaman` ("10 km") → strip " km" → float
- Parse `Coordinates` ("5.63,95.47") → split on comma → (lat, lon) — note BMKG
  gives lat,lon order, NOT lon,lat (PostGIS Point wants lon,lat — flip it)
- `Potensi` field containing "tsunami" (case-insensitive) → set `potensi_tsunami=True`
- Generate `external_id` as hash of `DateTime + Coordinates` since BMKG provides
  no native event ID

```python
import hashlib

def generate_bmkg_external_id(datetime_str: str, coordinates: str) -> str:
    raw = f"BMKG-{datetime_str}-{coordinates}"
    return hashlib.md5(raw.encode()).hexdigest()
```

### Required Attribution
Every BMKG-sourced response in the API must include a `source_attribution` field:
```python
SOURCE_ATTRIBUTION = {
    "BMKG": "Data: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)",
    "USGS": "Data: United States Geological Survey (USGS)",
}
```
Frontend must render this text wherever earthquake data is displayed — this is
a hard requirement, not optional styling.

---

## USGS Ingestion Conventions

```python
USGS_ENDPOINT = "https://earthquake.usgs.gov/fdsnws/event/1/query"

INDONESIA_BBOX = {
    "minlatitude": -11,
    "maxlatitude": 6,
    "minlongitude": 95,
    "maxlongitude": 141,
}

def fetch_usgs_historical(start_date: str, end_date: str, min_magnitude: float = 4.0):
    params = {
        "format": "geojson",
        "starttime": start_date,
        "endtime": end_date,
        "minmagnitude": min_magnitude,
        **INDONESIA_BBOX,
    }
    # USGS returns GeoJSON FeatureCollection
    # geometry.coordinates = [lon, lat, depth_km]  <- note depth is in coordinates[2]
    # properties.mag, properties.place, properties.time (epoch ms)
```

**Pagination**: USGS caps at 20,000 results per request. For full historical
bootstrap (1970–present), chunk requests by year or by magnitude tier to stay
under the limit.

---

## Deduplication Logic

Lives in `apps/earthquakes/tasks/dedup.py`. Must run after every BMKG poll.

```python
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from datetime import timedelta

DEDUP_TIME_WINDOW_MINUTES = 5
DEDUP_DISTANCE_KM = 50

def find_duplicate(new_event: dict, source: str) -> EarthquakeEvent | None:
    """
    Check if an incoming event (from either source) already exists from
    the other source within the time/distance window. BMKG takes priority
    as the authoritative record for Indonesian events when both exist.
    """
    time_lower = new_event['event_time'] - timedelta(minutes=DEDUP_TIME_WINDOW_MINUTES)
    time_upper = new_event['event_time'] + timedelta(minutes=DEDUP_TIME_WINDOW_MINUTES)

    candidates = EarthquakeEvent.objects.filter(
        event_time__range=(time_lower, time_upper),
        location__distance_lte=(new_event['location'], D(km=DEDUP_DISTANCE_KM))
    )
    return candidates.first()

def upsert_event(new_event: dict, source: str):
    existing = find_duplicate(new_event, source)
    if existing:
        if source == "BMKG" and existing.source == "USGS":
            # Upgrade USGS record to BMKG — more locally accurate
            for key, value in new_event.items():
                setattr(existing, key, value)
            existing.source = "BMKG"
            existing.save()
        # else: keep existing record, do nothing
        return existing, False
    else:
        return EarthquakeEvent.objects.create(**new_event), True
```

---

## Region Risk Profile Computation

Lives in `apps/regions/tasks/risk_profile.py`. Runs nightly — never compute
live on request (expensive spatial aggregation across full history).

```python
@shared_task
def recompute_region_risk_profiles():
    for region in AdminRegion.objects.filter(type='kabupaten'):
        nearby_events = EarthquakeEvent.objects.filter(
            location__distance_lte=(region.centroid, D(km=100))
        )

        profile, _ = RegionRiskProfile.objects.update_or_create(
            region=region,
            defaults={
                'event_count_m4': nearby_events.filter(magnitude__gte=4.0).count(),
                'event_count_m5': nearby_events.filter(magnitude__gte=5.0).count(),
                'event_count_m6': nearby_events.filter(magnitude__gte=6.0).count(),
                'event_count_m7_plus': nearby_events.filter(magnitude__gte=7.0).count(),
                'largest_magnitude': nearby_events.aggregate(Max('magnitude'))['magnitude__max'],
                'avg_depth_km': nearby_events.aggregate(Avg('depth_km'))['depth_km__avg'],
                'nearest_fault': find_nearest_fault(region.centroid),
                'tsunami_risk_tier': classify_tsunami_risk(region),
                'last_updated': timezone.now(),
            }
        )
```

---

## Tsunami Risk Classification

Lives in `apps/regions/risk_logic.py`. Always document the criteria —
this directly affects how the frontend explains its methodology.

```python
def classify_tsunami_risk(region: AdminRegion) -> str:
    """
    Criteria (NOT an official warning system — historical pattern indicator only):
    - Must be within 10km of coastline
    - HIGH: 3+ historical events with depth<70km, magnitude>=6.5, offshore epicenter
    - MODERATE: 1-2 such events
    - LOW: coastal but no qualifying historical events
    - None: not a coastal region
    """
    if not region.is_coastal:  # precomputed flag based on distance to coast
        return None

    qualifying_events = EarthquakeEvent.objects.filter(
        location__distance_lte=(region.centroid, D(km=150)),
        depth_km__lt=70,
        magnitude__gte=6.5,
    ).count()

    if qualifying_events >= 3:
        return "HIGH"
    elif qualifying_events >= 1:
        return "MODERATE"
    return "LOW"
```

---

## DRF Conventions

- All list endpoints: `PageNumberPagination`, page_size=20
- Geo-enabled serializers: use `rest_framework_gis.serializers.GeoFeatureModelSerializer`
  for map-consumable GeoJSON responses
- No authentication required (public read-only)
- `POST /api/risk-check/` is the only POST endpoint — accepts `{lat, lng}`,
  returns full computed risk report (can compute live since it's a single point query)

```python
# Install: djangorestframework-gis
INSTALLED_APPS += ['rest_framework_gis']
```

---

## Frontend Conventions

- Next.js 14 App Router, TypeScript
- `react-leaflet` for all maps
- GeoJSON layers loaded via DRF GeoFeature endpoints directly into Leaflet
- Every component displaying earthquake data MUST render `<SourceAttribution />`

### MagnitudeBadge (universal component)
```tsx
// components/ui/MagnitudeBadge.tsx
// size scales with magnitude, color scales with depth
const getSize = (mag: number) => Math.max(24, Math.min(64, mag * 8))
const getDepthColor = (depthKm: number) => {
  if (depthKm < 30) return '#C0392B'   // shallow = most dangerous = red
  if (depthKm < 100) return '#E8743B'  // seismic-orange
  return '#4A7C9E'                      // deep = depth-blue
}
```

### SourceAttribution (mandatory component)
```tsx
// components/ui/SourceAttribution.tsx
// MUST appear on every page/card showing earthquake data
// Renders: "Sumber: BMKG" and/or "Data: USGS" depending on event.source
```

### Component Naming
```
components/
├── map/
│   ├── LiveMap.tsx              # homepage 24h map
│   ├── FaultLineLayer.tsx
│   ├── HeatmapLayer.tsx         # event density
│   └── RegionBoundaryLayer.tsx
├── risk/
│   ├── RiskCheckTool.tsx        # the "am I in a risk zone" feature
│   ├── RiskProfileCard.tsx      # region summary card
│   ├── MagnitudeFreqChart.tsx   # bar chart
│   ├── DepthHistogram.tsx
│   └── EventScatterTimeline.tsx
├── timeline/
│   ├── DisasterTimeline.tsx
│   └── DisasterEntry.tsx
└── ui/
    ├── MagnitudeBadge.tsx
    ├── RiskTierBadge.tsx        # LOW/MODERATE/HIGH pill
    ├── SourceAttribution.tsx    # mandatory, see above
    └── ShareableRiskCard.tsx    # designed for screenshot/social share
```

---

## Docker Compose (Local)

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: gempawatch
      POSTGRES_USER: gempawatch
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes: ["./backend:/app"]
    env_file: .env
    depends_on: [db, redis]
    ports: ["8000:8000"]

  celery:
    build: ./backend
    command: celery -A config worker -l info
    volumes: ["./backend:/app"]
    env_file: .env
    depends_on: [db, redis]

  celery-beat:
    build: ./backend
    command: celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    env_file: .env
    depends_on: [db, redis]

  frontend:
    build: ./frontend
    command: npm run dev
    volumes: ["./frontend:/app"]
    env_file: .env
    ports: ["3000:3000"]

volumes:
  pgdata:
```

---

## Build Order

### Step 1 — Django + PostGIS Foundation
1. Scaffold Django with GeoDjango (`django.contrib.gis`) enabled
2. Enable PostGIS extension on the database
3. Create all models with proper spatial fields
4. Run migrations, confirm PostGIS functions work (`ST_Distance` test query)
5. Register models in admin with map widgets (GeoDjango admin support)

### Step 2 — Historical Bootstrap
1. Write `earthquake_bootstrap` management command
2. Pull USGS data for Indonesia bbox, chunked by year, 1970–present, M4.0+
3. Load static fault line GeoJSON into FaultLine model
4. Load Indonesian admin region boundaries into AdminRegion model
5. Verify: `EarthquakeEvent.objects.count()` > 10,000

### Step 3 — Live BMKG Polling
1. Write BMKG polling tasks (3 endpoints)
2. Write deduplication logic
3. Configure Celery beat: 5-minute polling
4. Test: confirm new events appear, no duplicates against USGS backfill

### Step 4 — Risk Profile Computation
1. Implement `recompute_region_risk_profiles` task
2. Implement tsunami risk classification logic
3. Run nightly via Celery beat
4. Verify: spot-check a known high-risk region (e.g., Aceh) shows sensible numbers

### Step 5 — DRF Endpoints
1. Build all endpoints from PRD
2. Use GeoFeatureModelSerializer for map-bound endpoints
3. Build risk-check POST endpoint (live spatial query)
4. Test all in browsable API

### Step 6 — Frontend
1. Tailwind + Fault Line design tokens
2. Build MagnitudeBadge, SourceAttribution, RiskTierBadge primitives
3. Build LiveMap + homepage
4. Build Region Risk Profile page
5. Build Risk Check Tool with geolocation
6. Build Disaster Timeline page
7. Build About/methodology page with BMKG + USGS attribution

---

## Key Decisions (Do Not Change)

- **PostGIS is required** — do not attempt spatial queries with plain lat/lng floats
- **BMKG attribution is legally mandatory** — never strip or hide it
- **BMKG record always wins on duplicate** — more locally accurate than USGS
- **Risk profiles are precomputed nightly**, never live except the single-point
  risk-check tool
- **Never use predictive/alarmist language** — historical pattern framing only
- **This is NOT a tsunami warning system** — always link to official BMKG tsunami
  alerts, never imply this app replaces them

---

## Definition of Done (Phase 1–3)

- [ ] `earthquake_bootstrap` populates >10k historical events
- [ ] BMKG 5-min polling task runs without error, dedupes correctly
- [ ] `/api/earthquakes/live/` returns merged BMKG+USGS data, no duplicates
- [ ] `/api/regions/{id}/risk-profile/` returns sensible computed data for a test region
- [ ] `POST /api/risk-check/` returns full report for arbitrary coordinates
- [ ] Homepage live map renders with magnitude-scaled markers
- [ ] Region detail page renders magnitude-frequency chart + timeline scatter
- [ ] Risk Check Tool works end-to-end with geolocation
- [ ] Every earthquake-data-displaying page shows BMKG/USGS attribution
- [ ] `docker-compose up` works cleanly from fresh clone
