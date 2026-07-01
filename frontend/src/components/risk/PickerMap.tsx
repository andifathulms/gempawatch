"use client";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";

// A minimal pin icon that doesn't depend on Leaflet's asset paths (which break
// under bundlers). Uses an inline SVG data URL.
const PIN = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
        <path fill="#E8743B" stroke="#1A1A1A" stroke-width="1.5"
          d="M15 1C7.8 1 2 6.8 2 14c0 9 13 27 13 27s13-18 13-27C28 6.8 22.2 1 15 1z"/>
        <circle cx="15" cy="14" r="5" fill="#1A1A1A"/>
      </svg>`,
    ),
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

interface Props {
  position: [number, number];
  onPick: (lat: number, lng: number) => void;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function PickerMap({ position, onPick }: Props) {
  return (
    <MapContainer
      center={position}
      zoom={5}
      style={{ height: 420, width: "100%", borderRadius: 12 }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      <ClickHandler onPick={onPick} />
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
