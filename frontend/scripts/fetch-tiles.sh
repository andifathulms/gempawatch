#!/usr/bin/env bash
# Regenerate public/tiles/indonesia.pmtiles — the self-hosted vector basemap
# (see components/map/BaseMap.tsx for why it replaced CARTO's raster tiles).
#
# Pulls an Indonesia-sized extract, zoom 0–9, from a Protomaps daily planet
# build using range requests (only ~18 MB is transferred, not the planet).
# Needs the `pmtiles` CLI: `brew install pmtiles`, or a release binary from
# https://github.com/protomaps/go-pmtiles/releases.
#
# Usage: scripts/fetch-tiles.sh [YYYYMMDD]   (defaults to yesterday, UTC)
set -euo pipefail
cd "$(dirname "$0")/.."

BUILD="${1:-$(date -u -v-1d +%Y%m%d 2>/dev/null || date -u -d yesterday +%Y%m%d)}"
mkdir -p public/tiles
pmtiles extract "https://build.protomaps.com/${BUILD}.pmtiles" public/tiles/indonesia.pmtiles \
  --bbox=94,-11.5,141.5,6.5 --maxzoom=9
ls -lh public/tiles/indonesia.pmtiles
