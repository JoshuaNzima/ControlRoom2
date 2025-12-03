import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Basic marker icon fix for Leaflet in many build setups
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type LatLng = { lat: number; lng: number };

interface LocationPickerProps {
  value?: LatLng | null;
  onChange?: (coords: LatLng) => void;
  heightClassName?: string;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ value, onChange, heightClassName = 'h-64' }: LocationPickerProps) {
  const [isDark, setIsDark] = React.useState(false);
  const [position, setPosition] = React.useState<LatLng | null>(value ?? null);
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  React.useEffect(() => {
    setPosition(value ?? null);
  }, [value?.lat, value?.lng]);

  const center: [number, number] = position ? [position.lat, position.lng] : [-26.2041, 28.0473];

  const handlePick = (lat: number, lng: number) => {
    const next = { lat, lng };
    setPosition(next);
    onChange?.(next);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePick(pos.coords.latitude, pos.coords.longitude);
        setGeoLoading(false);
      },
      () => {
        setGeoError('Unable to get current location');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  function CenterOnPosition({ p }: { p: LatLng | null }) {
    const map = useMap();
    React.useEffect(() => {
      if (p) {
        map.setView([p.lat, p.lng], Math.max(map.getZoom(), 14));
      }
    }, [p?.lat, p?.lng]);
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={handleUseMyLocation} disabled={geoLoading} className="px-2 py-1 text-xs rounded-md border dark:border-gray-600 dark:text-gray-200 disabled:opacity-60">
          {geoLoading ? 'Locating…' : 'Use my location'}
        </button>
        {position && (
          <span className="text-xs text-gray-600 dark:text-gray-400">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
        )}
        {geoError && (
          <span className="text-xs text-red-500">{geoError}</span>
        )}
      </div>
      <MapContainer center={center} zoom={14} className={`w-full rounded-md ${heightClassName}`} style={{ zIndex: 1 }}>
        <TileLayer
          url={isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
          attribution='&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ClickHandler onPick={handlePick} />
        <CenterOnPosition p={position} />
        {position && <Marker position={[position.lat, position.lng]} icon={defaultIcon} />}
      </MapContainer>
    </div>
  );
}
