import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GuardOnSite {
  id: number;
  name: string;
  check_in_time: string;
}

interface SiteCoverage {
  site_id: number;
  site_name: string;
  client_name: string;
  required_guards: number;
  checked_in_guards: number;
  coverage_percentage: number;
  status: 'covered' | 'partial' | 'uncovered';
  latitude: number | null;
  longitude: number | null;
  guards_on_site: GuardOnSite[];
}

interface SiteCoverageMapProps {
  sites: SiteCoverage[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

const STATUS_COLORS = {
  covered: '#22c55e',
  partial: '#eab308',
  uncovered: '#ef4444',
} as const;

const STATUS_LABELS = {
  covered: 'Covered',
  partial: 'Partial',
  uncovered: 'Uncovered',
} as const;

// Create color-coded markers
function createSiteIcon(status: 'covered' | 'partial' | 'uncovered'): Icon {
  const color = STATUS_COLORS[status];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="42" viewBox="0 0 28 42">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#333" stroke-width="1"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>`;
  
  return new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -42],
  });
}

export default function SiteCoverageMap({
  sites,
  defaultCenter = [-13.9626, 33.7741],
  defaultZoom = 11,
}: SiteCoverageMapProps) {
  const sitesWithCoords = sites.filter(
    (site) => site.latitude != null && site.longitude != null
  );

  if (sitesWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400">
        No site location data available
      </div>
    );
  }

  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <MapContainer
        {...({ center: defaultCenter, zoom: defaultZoom, style: { height: '100%', width: '100%' }, scrollWheelZoom: true } as any)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {sitesWithCoords.map((site) => (
          <Marker
            key={site.site_id}
            position={[site.latitude!, site.longitude!]}
            icon={createSiteIcon(site.status)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-gray-900 text-base">{site.site_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{site.client_name}</p>
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Coverage:</span>
                    <span className="font-medium">{site.coverage_percentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Guards:</span>
                    <span className="font-medium">{site.checked_in_guards}/{site.required_guards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className="font-medium capitalize"
                      style={{ color: STATUS_COLORS[site.status] }}
                    >
                      {STATUS_LABELS[site.status]}
                    </span>
                  </div>
                </div>
                {site.guards_on_site.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Guards on site:</p>
                    {site.guards_on_site.map((guard) => (
                      <div key={guard.id} className="flex justify-between text-xs text-gray-700">
                        <span>{guard.name}</span>
                        <span className="text-gray-500">{guard.check_in_time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-900 rounded-lg shadow-md p-2 text-xs z-[1000] border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.covered }} />
          <span className="text-gray-700 dark:text-gray-300">Covered</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.partial }} />
          <span className="text-gray-700 dark:text-gray-300">Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.uncovered }} />
          <span className="text-gray-700 dark:text-gray-300">Uncovered</span>
        </div>
      </div>
    </div>
  );
}
