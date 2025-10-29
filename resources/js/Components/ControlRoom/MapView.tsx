import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ScanTag {
  id: number;
  tags: {
    scanned_at: string;
    site_name: string;
    client_name: string;
    supervisor_id: string;
    latitude: number;
    longitude: number;
    location_quality: string;
    geohash: string;
  };
}

interface MapViewProps {
  tags: ScanTag[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

// Fix Leaflet icon issues
const icon = new Icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function MapView({
  tags,
  defaultCenter = [-26.2041, 28.0473],
  defaultZoom = 12
}: MapViewProps) {
  // Some react-leaflet typings are strict about allowed JSX props; cast to any for JSX spread
  const containerProps = { center: defaultCenter, zoom: defaultZoom, style: { height: '100%', width: '100%' }, scrollWheelZoom: false } as any;

  return (
    <MapContainer {...containerProps}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {tags.map((tag) => (
        // Marker props typing can be strict; cast to any when spreading
        <Marker
          key={tag.id}
          {...({ position: [tag.tags.latitude, tag.tags.longitude], icon } as any)}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{tag.tags.site_name}</h3>
              <p className="text-sm">{tag.tags.client_name}</p>
              <p className="text-xs text-gray-600">{new Date(tag.tags.scanned_at).toLocaleString()}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}