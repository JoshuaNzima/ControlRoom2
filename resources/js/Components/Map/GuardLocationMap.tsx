import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  guards: number;
  alerts: number;
}

interface GuardLocationMapProps {
  guards: Guard[];
  sites: Site[];
  center?: LatLngExpression;
  zoom?: number;
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

export default function GuardLocationMap({ guards, sites, center = [-26.2041, 28.0473], zoom = 13 }: GuardLocationMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-[500px] w-full rounded-lg"
      style={{ zIndex: 1 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater center={center} zoom={zoom} />
      
      {/* Render Guards */}
      {guards.map((guard) => (
        <Marker
          key={`guard-${guard.id}`}
          position={[guard.location.lat, guard.location.lng]}
          icon={guardIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-medium">{guard.name}</h3>
              <p className="text-sm text-gray-600">Status: {guard.status}</p>
              {guard.currentSite && (
                <p className="text-sm text-gray-600">Site: {guard.currentSite}</p>
              )}
              <p className="text-sm text-gray-600">
                Last Activity: {new Date(guard.lastActivity).toLocaleTimeString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Render Sites */}
      {sites.map((site) => (
        <Marker
          key={`site-${site.id}`}
          position={[site.location.lat, site.location.lng]}
          icon={siteIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-medium">{site.name}</h3>
              <p className="text-sm text-gray-600">Status: {site.status}</p>
              <p className="text-sm text-gray-600">Guards: {site.guards}</p>
              {site.alerts > 0 && (
                <p className="text-sm text-red-600">Active Alerts: {site.alerts}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}