"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { BaseMap, INDONESIA_BOUNDS } from "@/components/map/BaseMap";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";

// The pin is an HTML divIcon rather than an image so it can take the theme
// tokens: an ink drop with a paper core, legible on both the Kertas and the
// Malam basemap. (An <img> data-URL cannot resolve CSS variables.)
const PIN = divIcon({
  className: "gw-pin",
  html: `<svg width="34" height="46" viewBox="0 0 34 46" aria-hidden="true">
      <ellipse cx="17" cy="43" rx="6" ry="2.5" fill="rgba(0,0,0,0.3)"/>
      <path fill="var(--ink)" stroke="var(--paper)" stroke-width="2"
        d="M17 1.5C9.3 1.5 3 7.8 3 15.5c0 9.6 14 27 14 27s14-17.4 14-27C31 7.8 24.7 1.5 17 1.5z"/>
      <circle cx="17" cy="15.5" r="5.5" fill="var(--paper)"/>
      <circle cx="17" cy="15.5" r="2.5" fill="var(--depth-shallow-fill)"/>
    </svg>`,
  iconSize: [34, 46],
  iconAnchor: [17, 44],
});

interface Props {
  position: [number, number];
  onPick: (lat: number, lng: number) => void;
  height?: number;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Keeps the viewport with the pin.
 *
 * Without this, pressing "use my location" moved the marker to somewhere off
 * the current view and the map sat still — so the tool looked broken at the
 * exact moment it had just succeeded.
 */
function FollowPin({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 8), { duration: 0.8 });
  }, [map, position]);
  return null;
}

export function PickerMap({ position, onPick, height = 440 }: Props) {
  const reduceMotion = prefersReducedMotion();

  return (
    <MapContainer
      // Leaflet animates zoom/pan itself, out of reach of the CSS
      // reduced-motion rule that covers the rest of the site.
      zoomAnimation={!reduceMotion}
      markerZoomAnimation={!reduceMotion}
      fadeAnimation={!reduceMotion}
      center={position}
      zoom={5}
      style={{ height, width: "100%", borderRadius: 12 }}
      scrollWheelZoom
      minZoom={4}
      maxZoom={13}
      maxBounds={INDONESIA_BOUNDS}
      maxBoundsViscosity={0.8}
    >
        <BaseMap />
      <ClickHandler onPick={onPick} />
      <FollowPin position={position} />
      <Marker
        position={position}
        icon={PIN}
        draggable
        eventHandlers={{
          dragend(e) {
            const { lat, lng } = e.target.getLatLng();
            onPick(lat, lng);
          },
        }}
      />
    </MapContainer>
  );
}
