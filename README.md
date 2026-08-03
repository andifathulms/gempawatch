# GempaWatch

A public **earthquake risk intelligence platform for Indonesia**. GempaWatch merges
real-time [BMKG](https://www.bmkg.go.id/) (official Indonesian) and historical
[USGS](https://earthquake.usgs.gov/) earthquake data, stores it in a PostGIS-enabled
PostgreSQL database, and computes regional risk profiles so people can understand the
earthquake risk for **their own location** — not just scroll a list of recent quakes.

> ⚠️ GempaWatch is **not** a tsunami warning system. It shows historical patterns and
> risk context only. For official real-time alerts always refer to BMKG.

## Stack

| Layer | Technology |
|---|---|
| Backend | Django 5 + Django REST Framework + GeoDjango |
| Task Queue | Celery + Redis |
| Database | PostgreSQL 16 + PostGIS |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| Maps | Leaflet / react-leaflet |
| Charts | Recharts |
| Container | Docker Compose |

## Data Sources

- **BMKG** — official Indonesian source, polled live every 5 minutes (no auth).
- **USGS** — historical backfill (1970–present), Indonesia bounding box, M4.0+.

BMKG attribution is **legally mandatory** and rendered on every page that shows
BMKG-sourced data.

## Quick Start (Local)

```bash
cp .env.example .env          # adjust SECRET_KEY etc.
docker-compose up --build     # db, redis, backend, celery, beat, frontend

# In another shell — one-time historical bootstrap:
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py earthquake_bootstrap
```

- Backend API: http://localhost:8000/api/
- Frontend: http://localhost:3000

See [PRD.md](PRD.md) for the product spec and [CLAUDE.md](CLAUDE.md) for build
conventions and exact build order.

## Deployment Modes

GempaWatch builds two ways from one codebase, selected by `NEXT_PUBLIC_DATA_MODE`.

**`live`** (default) — the full app: Django + DRF, Celery polling BMKG every five
minutes, and email watch alerts. This is what a VM deployment runs, and it is the
canonical implementation.

**`static`** — a backendless build for GitHub Pages. `manage.py export_static`
freezes the whole read-only API into JSON files by driving the real DRF views, so
the payloads cannot drift in shape. The single-point risk report is recomputed in
the browser by a TypeScript port of the Python engine.

```bash
# Backend: freeze the API
docker-compose exec backend python manage.py export_static --out ./out
cp -r backend/out/api backend/out/data frontend/public/

# Frontend: build the static site into frontend/out
cd frontend && npm run build:static
```

`.github/workflows/deploy-pages.yml` runs this on a schedule and publishes to
GitHub Pages.

### What differs in static mode

| | live | static |
|---|---|---|
| Data freshness | 5 min (Celery beat) | ~30 min, best-effort (GitHub cron) |
| Email watch alerts | yes | no — needs a server to store and send |
| Shareable risk URL | `/risk/{lat}/{lng}` | `/risk?lat=&lng=` |
| Per-region OG unfurl images | yes | no — Next 14 cannot prerender metadata image routes under `output: export` |

Nothing is deleted for static builds. Routes that need a backend are named
`*.live.tsx`, and the extension is only registered for live builds.

### The golden-fixture gate

Python is the source of truth for risk methodology. `manage.py
export_risk_fixtures` pins Django's output at ~39 points, and the Vitest suite
asserts the TypeScript engine reproduces every one exactly:

```bash
cd frontend && npm test
```

The deploy workflow runs this against fixtures regenerated from the data being
published, and refuses to deploy if it fails — a mismatch means the static site
would report different risk numbers than the API, which is a correctness bug, not
a cosmetic one. **When you change the scoring or classification logic, change it
in Python first, regenerate the fixtures, then bring the port back in line.**

## Project Layout

```
backend/    Django project (config + apps: earthquakes, regions, faults, disasters, api)
frontend/   Next.js App Router frontend
nginx/      Reverse-proxy config for deployment
```
