"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";

// A minimal pin icon that doesn't depend on Leaflet's asset paths (which break
// under bundlers). Uses an inline SVG data URL.
const PIN = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
        <ellipse cx="17" cy="43" rx="6" ry="2.5" fill="rgba(0,0,0,0.45)"/>
        <path fill="#E8743B" stroke="#121110" stroke-width="1.75"
          d="M17 1.5C9.3 1.5 3 7.8 3 15.5c0 9.6 14 27 14 27s14-17.4 14-27C31 7.8 24.7 1.5 17 1.5z"/>
        <circle cx="17" cy="15.5" r="5" fill="#121110"/>
      </svg>`,
    ),
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
  return (
    <MapContainer
      center={position}
      zoom={5}
      style={{ height, width: "100%", borderRadius: 12 }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
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
