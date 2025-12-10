import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// No external API key required. Using Carto vector styles for light/dark.

export type LatLng = { lat: number; lng: number };

interface LocationPickerProps {
  value?: LatLng | null;
  onChange?: (coords: LatLng) => void;
  heightClassName?: string;
}

export default function LocationPicker({ value, onChange, heightClassName = 'h-64' }: LocationPickerProps) {
  const [isDark, setIsDark] = React.useState(false);
  const [position, setPosition] = React.useState<LatLng | null>(value ?? null);
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  React.useEffect(() => {
    setPosition(value ?? null);
  }, [value?.lat, value?.lng]);

  const center: [number, number] = position ? [position.lat, position.lng] : [-13.9626, 33.7741];

  React.useEffect(() => {
    // Initialize map once
    if (mapRef.current || !containerRef.current) return;
    const styleUrl = isDark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [center[1], center[0]], // [lng, lat]
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl({ showZoom: true }));

    map.on('click', (e) => {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      handlePick(lat, lng);
    });

    mapRef.current = map;

    return () => {
      try { map.remove(); } catch (_) {}
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current]);

  // Update style on theme change
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const styleUrl = isDark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    try { map.setStyle(styleUrl); } catch (_) {}
  }, [isDark]);

  const handlePick = (lat: number, lng: number) => {
    const next = { lat, lng };
    setPosition(next);
    onChange?.(next);
    const map = mapRef.current;
    if (map) {
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: '#ef4444' })
          .setLngLat([lng, lat])
          .addTo(map);
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }
      map.setCenter([lng, lat]);
      map.setZoom(Math.max(map.getZoom(), 14));
    }
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
    React.useEffect(() => {
      const map = mapRef.current;
      if (p && map) {
        if (!markerRef.current) {
          markerRef.current = new maplibregl.Marker({ color: '#ef4444' })
            .setLngLat([p.lng, p.lat])
            .addTo(map);
        } else {
          markerRef.current.setLngLat([p.lng, p.lat]);
        }
        map.setCenter([p.lng, p.lat]);
        map.setZoom(Math.max(map.getZoom(), 14));
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
      <div ref={containerRef} className={`w-full rounded-md ${heightClassName}`} style={{ zIndex: 1 }} />
      <CenterOnPosition p={position} />
    </div>
  );
}
