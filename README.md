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

## Project Layout

```
backend/    Django project (config + apps: earthquakes, regions, faults, disasters, api)
frontend/   Next.js App Router frontend
nginx/      Reverse-proxy config for deployment
```
