<p align="center">
  <img src="frontend/public/brand/lockup-horizontal-1280.png" alt="GempaWatch" width="420">
</p>

<p align="center">
  <a href="https://andifathulms.github.io/gempawatch/"><strong>Lihat situs →</strong></a>
</p>

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

## Data Durability

The static deployment has no server, so the scheduled workflow *is* the data
pipeline: it boots a PostGIS container, restores the previous run's database,
polls BMKG, re-syncs recent USGS, recomputes risk profiles, and freezes the API
to JSON. **No data is committed to this repository** — `frontend/public/api/`
and `frontend/public/data/` are generated per run and shipped straight to Pages.

That makes the database between runs the only copy of anything BMKG-sourced.
BMKG exposes just its last 15 events, so every older BMKG record exists solely
because a previous run saved it. It is carried across runs in the GitHub Actions
cache — which is a **working copy, not a backup**: caches are evicted after 7
days unused, can be purged manually, and are dropped when the repository hits
its cache limit. On a miss the job self-heals with a full USGS bootstrap, but
USGS never recorded the smaller felt quakes BMKG reports, so those are gone.

Two independent restore paths therefore run on every publish:

| | Where | Cadence | Retention |
|---|---|---|---|
| **Daily backup** | workflow artifact `db-backup-YYYY-MM-DD` | first run each day | 90 days |
| **Monthly snapshot** | release `db-snapshot-YYYY-MM` | first run each month | permanent |

Both are `continue-on-error`: a failed backup must never block publishing
earthquake data.

Release assets rather than a `data-snapshots` branch, deliberately — git never
forgets a blob, so committing ~8 MB a month would grow every clone by ~100 MB a
year, forever. Release assets live outside the object database.

### Restoring

Fetch the newest snapshot (a release for the long tail, an artifact for the last
90 days):

```bash
# Monthly release — pick the newest tag from the Releases page
gh release download db-snapshot-2026-08 --pattern '*.dump'

# …or a daily artifact, listed newest-first
gh run download --name db-backup-2026-08-04
```

Load it into a PostGIS database:

```bash
createdb gempawatch
psql -d gempawatch -c 'CREATE EXTENSION IF NOT EXISTS postgis;'
pg_restore --no-owner --no-privileges -d gempawatch gempawatch-db-2026-08.dump

# Apply anything added to the schema since the snapshot was taken
cd backend && python manage.py migrate
```

To push a restored database back into the pipeline, run the workflow manually
(`workflow_dispatch`) after seeding the cache, or simply let the next scheduled
run rebuild forward from it — `refresh_for_export` is idempotent and dedupes
against existing events.

### What differs in static mode

| | live | static |
|---|---|---|
| Data freshness | 5 min (Celery beat) | cron says 30 min; observed 70–90 min, as GitHub's scheduler defers under load |
| Email watch alerts | yes | no — needs a server to store and send |
| Shareable risk URL | `/risk/{lat}/{lng}` | `/risk?lat=&lng=` |
| Site-wide OG unfurl card | yes | yes |
| Per-region OG unfurl images | yes | no — Next 14 cannot prerender metadata image routes under `output: export`, so these fall back to the site-wide card |

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
