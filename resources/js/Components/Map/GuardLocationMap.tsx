import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngExpression, LatLngTuple } from 'leaflet';
import './GuardLocationMap.css';

interface Location {
  lat: number;
  lng: number;
}

interface Guard {
  id: number;
  name: string;
  status: string;
  location: Location;
  currentSite?: string;
  lastActivity: string;
}

interface Site {
  id: number;
  name: string;
  status: string;
  location: Location;
  alerts: number;
  required?: number;
  onDuty?: number;
  coverageStatus?: 'full' | 'partial' | 'none' | 'unknown';
}

interface GuardLocationMapProps {
  guards: Guard[];
  sites: Site[];
  center?: LatLngExpression;
  zoom?: number;
  onSiteClick?: (site: Site) => void;
  showCountsOverlay?: boolean;
  scaleByRequired?: boolean;
}

// Create custom guard icon using default Leaflet icon
const guardIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create custom site icon using default Leaflet icon with different color
const siteIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'site-marker'
});

function MapUpdater({ center, zoom }: { center?: LatLngExpression; zoom?: number }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

function BoundsUpdater({ points }: { points: LatLngTuple[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [24, 24] as any });
    } else if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 14));
    }
  }, [JSON.stringify(points)]);
  return null;
}

export default function GuardLocationMap({ guards, sites, center = [-26.2041, 28.0473], zoom = 13, onSiteClick, showCountsOverlay = true, scaleByRequired = true }: GuardLocationMapProps) {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);
  const statusColor = (status?: Site['coverageStatus']) => {
    switch (status) {
      case 'full':
        return '#16a34a'; // green-600
      case 'partial':
        return '#f59e0b'; // amber-500
      case 'none':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  };
  const markerRadius = (site: Site) => {
    const req = Math.max(0, site.required ?? 0);
    const base = 8;
    const extra = Math.min(req, 12); // cap growth
    return base + extra * 0.8; // max ~17.6
  };
  const siteCountIcon = (site: Site) => {
    const onDuty = site.onDuty ?? 0;
    const required = site.required ?? 0;
    return L.divIcon({
      className: 'site-count-label',
      html: `<span>${onDuty}/${required}</span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-[500px] w-full rounded-lg"
      style={{ zIndex: 1 }}
    >
      <TileLayer
        url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        attribution='&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapUpdater center={center} zoom={zoom} />
      <BoundsUpdater points={sites.map(s => [s.location.lat, s.location.lng] as LatLngTuple)} />

      {/* Render Sites */}
      {sites.map((site) => (
        <React.Fragment key={`site-${site.id}`}>
          <CircleMarker
            center={[site.location.lat, site.location.lng]}
            radius={scaleByRequired ? markerRadius(site) : 10}
            pathOptions={{ color: statusColor(site.coverageStatus), fillColor: statusColor(site.coverageStatus), fillOpacity: 0.85, weight: 2 }}
            eventHandlers={{ click: () => onSiteClick?.(site) }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-medium">{site.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Coverage: {site.coverageStatus || 'unknown'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">On duty: {site.onDuty ?? 0} / Required: {site.required ?? 0}</p>
                {site.alerts > 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400">Active Alerts: {site.alerts}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
          {showCountsOverlay && (
            <Marker position={[site.location.lat, site.location.lng]} icon={siteCountIcon(site)} />
          )}
        </React.Fragment>
      ))}
    </MapContainer>
  );
}