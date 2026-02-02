import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngTuple } from 'leaflet';

type Zone = { id: number; name: string; code?: string };
type Site = { id: number; name: string; status?: 'active' | 'inactive' | string; latitude?: number | string | null; longitude?: number | string | null };

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function useIsDark(): boolean {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);
  return isDark;
}

function BoundsUpdater({ points }: { points: LatLngTuple[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [24, 24] as any });
    } else if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 14));
    }
  }, [map, JSON.stringify(points)]);
  return null;
}

function FocusUpdater({ focus }: { focus: { lat: number; lng: number } | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (!focus) return;
    map.setView([focus.lat, focus.lng], Math.max(map.getZoom(), 15));
  }, [map, focus?.lat, focus?.lng]);
  return null;
}

export default function ZoneMap() {
  const { zone, sites } = usePage().props as any;

  const z = zone as Zone;
  const allSites = (sites || []) as Site[];

  const isDark = useIsDark();
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive' | 'no_coords'>('all');
  const [selected, setSelected] = React.useState<Site | null>(null);
  const [focus, setFocus] = React.useState<{ lat: number; lng: number } | null>(null);

  const normalized = React.useMemo(() => {
    return allSites.map((s) => {
      const lat = toNumberOrNull(s.latitude);
      const lng = toNumberOrNull(s.longitude);
      return { ...s, latitude: lat, longitude: lng } as Site & { latitude: number | null; longitude: number | null };
    });
  }, [allSites]);

  const filteredSites = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized
      .filter((s) => {
        if (!q) return true;
        return String(s.name || '').toLowerCase().includes(q);
      })
      .filter((s) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'no_coords') return !s.latitude || !s.longitude;
        return (s.status || 'unknown') === statusFilter;
      });
  }, [normalized, query, statusFilter]);

  const mapSites = React.useMemo(() => {
    return normalized.filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number') as Array<Site & { latitude: number; longitude: number }>;
  }, [normalized]);

  const points = React.useMemo(() => {
    return mapSites.map((s) => [s.latitude, s.longitude] as LatLngTuple);
  }, [mapSites]);

  const defaultCenter: LatLngTuple = [-26.2041, 28.0473];

  const markerColor = (status?: string) => {
    if (status === 'active') return '#16a34a';
    if (status === 'inactive') return '#6b7280';
    return '#b45309';
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyCoords = async (lat: number, lng: number) => {
    try {
      await navigator.clipboard.writeText(`${lat}, ${lng}`);
    } catch {
      // no-op
    }
  };

  return (
    <ControlRoomLayout title={`Zone Map • ${z?.name || 'Zone'}`}>
      <Head title={`Zone Map • ${z?.name || 'Zone'}`} />
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sites in {z?.name || 'Zone'}</h3>
              <Link href={route('control-room.zones.index')} className="text-sm text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200">Back to Zones</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-3">
                <div className="h-[320px] sm:h-[420px] lg:h-[520px] rounded-md overflow-hidden border dark:border-gray-700">
                  <MapContainer
                    center={defaultCenter}
                    zoom={12}
                    className="h-full w-full"
                    style={{ zIndex: 1 }}
                  >
                    <TileLayer
                      url={isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                      attribution='&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <BoundsUpdater points={points} />
                    <FocusUpdater focus={focus} />

                    {mapSites.map((s) => (
                      <CircleMarker
                        key={s.id}
                        center={[s.latitude, s.longitude]}
                        radius={10}
                        pathOptions={{
                          color: markerColor(s.status),
                          fillColor: markerColor(s.status),
                          fillOpacity: 0.85,
                          weight: 2,
                        }}
                        eventHandlers={{ click: () => setSelected(s) }}
                      >
                        <Popup>
                          <div className="p-2">
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">Status: {s.status || 'unknown'}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{s.latitude.toFixed(6)}, {s.longitude.toFixed(6)}</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Showing {mapSites.length} site{mapSites.length === 1 ? '' : 's'} with GPS coordinates.
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search sites"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="no_coords">Missing GPS</option>
                  </select>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total: {normalized.length} • Active: {normalized.filter(s => s.status === 'active').length} • Missing GPS: {normalized.filter(s => !s.latitude || !s.longitude).length}
                </div>

                <div className="max-h-[420px] lg:max-h-[520px] overflow-y-auto space-y-2">
                  {filteredSites.length === 0 ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">No sites match your filters.</div>
                  ) : (
                    filteredSites.map((s) => {
                      const hasCoords = typeof s.latitude === 'number' && typeof s.longitude === 'number';
                      return (
                        <div
                          key={s.id}
                          className="p-3 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{s.name}</div>
                              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Status: {s.status || 'unknown'}
                              </div>
                              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {hasCoords ? `${(s.latitude as number).toFixed(6)}, ${(s.longitude as number).toFixed(6)}` : 'GPS not set'}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!hasCoords}
                                onClick={() => {
                                  if (!hasCoords) return;
                                  setFocus({ lat: s.latitude as number, lng: s.longitude as number });
                                }}
                              >
                                Focus
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="bg-coin-700 hover:bg-coin-600 text-white"
                                onClick={() => setSelected(s)}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="w-full max-w-lg dark:bg-gray-800 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle>{selected?.name || 'Site details'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div>Status: {selected?.status || 'unknown'}</div>
                <div>
                  Location:{' '}
                  {typeof (selected as any)?.latitude === 'number' && typeof (selected as any)?.longitude === 'number'
                    ? `${(selected as any).latitude.toFixed(6)}, ${(selected as any).longitude.toFixed(6)}`
                    : 'GPS not set'}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const lat = (selected as any)?.latitude;
                    const lng = (selected as any)?.longitude;
                    if (typeof lat !== 'number' || typeof lng !== 'number') return;
                    setFocus({ lat, lng });
                    setSelected(null);
                  }}
                  disabled={typeof (selected as any)?.latitude !== 'number' || typeof (selected as any)?.longitude !== 'number'}
                >
                  Focus on map
                </Button>
                <Button
                  type="button"
                  className="bg-coin-700 hover:bg-coin-600 text-white"
                  onClick={() => {
                    const lat = (selected as any)?.latitude;
                    const lng = (selected as any)?.longitude;
                    if (typeof lat !== 'number' || typeof lng !== 'number') return;
                    openGoogleMaps(lat, lng);
                  }}
                  disabled={typeof (selected as any)?.latitude !== 'number' || typeof (selected as any)?.longitude !== 'number'}
                >
                  Open in Google Maps
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const lat = (selected as any)?.latitude;
                    const lng = (selected as any)?.longitude;
                    if (typeof lat !== 'number' || typeof lng !== 'number') return;
                    copyCoords(lat, lng);
                  }}
                  disabled={typeof (selected as any)?.latitude !== 'number' || typeof (selected as any)?.longitude !== 'number'}
                >
                  Copy coords
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ControlRoomLayout>
  );
}
