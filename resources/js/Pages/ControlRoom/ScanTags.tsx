import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import MapView from '@/Components/ControlRoom/MapView';
import useEcho from '@/Hooks/useEcho';
import debounce from 'lodash/debounce';
import { format } from 'date-fns';
import ScanTagFilters from '@/Components/ControlRoom/ScanTagFilters';
import NotificationBell from '@/Components/ControlRoom/NotificationBell';
import 'leaflet/dist/leaflet.css';

interface ScanTag {
  id: number;
  tags: {
    scan_id?: number;
    scanned_at: string;
    site_name: string;
    client_name: string;
    supervisor_id: number;
    supervisor_name?: string;
    latitude: number | null;
    longitude: number | null;
    location_quality: string;
    location_verified?: boolean;
    geohash: string | null;
    zone_id?: number | null;
  };
}

interface Filters {
  site?: string;
  client?: string;
  supervisor?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  locationRadius?: {
    lat: number;
    lng: number;
    radius: number; // in kilometers
  };
}

export default function ScanTags() {
  const { props } = usePage();
  const tagsPage = (props as any).tags;
  const [tags, setTags] = useState<ScanTag[]>(tagsPage.data || []);
  const [filters, setFilters] = useState<Filters>({});
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [meta] = useState(tagsPage.meta || {});

  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      if (filters.site && tag.tags.site_name !== filters.site) return false;
      if (filters.client && tag.tags.client_name !== filters.client) return false;
      if (filters.supervisor && (tag.tags.supervisor_name || String(tag.tags.supervisor_id)) !== filters.supervisor) return false;
      
      if (filters.dateRange) {
        const scanDate = new Date(tag.tags.scanned_at);
        if (filters.dateRange.start && scanDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && scanDate > new Date(filters.dateRange.end)) return false;
      }

      if (filters.locationRadius) {
        if (tag.tags.latitude == null || tag.tags.longitude == null) return false;
        const distance = getDistance(
          filters.locationRadius.lat,
          filters.locationRadius.lng,
          tag.tags.latitude,
          tag.tags.longitude
        );
        if (distance > filters.locationRadius.radius) return false;
      }

      return true;
    });
  }, [tags, filters]);

  // Helper function to calculate distance between two points in kilometers
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // subscribe to control-room channel
  useEffect(() => {
    if ((window as any).Echo) {
      const channel = (window as any).Echo.private('control-room');
      channel.listen('.ScanTagged', (e: any) => {
        const newTag = { 
          id: e.scan_tag.id, 
          tags: e.scan_tag.tags 
        };
        setTags(prev => [newTag, ...prev]);
      });
      return () => channel.stopListening('.ScanTagged');
    }
  }, []);

  return (
    <ControlRoomLayout title="Scan Tags">
      <Head title="Scan Tags" />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/5 p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Scan Tags</h2>
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'table'
                  ? 'bg-coin-700 text-white hover:bg-coin-600'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
             }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'map'
                  ? 'bg-coin-700 text-white hover:bg-coin-600'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
             }`}
            >
              Map
            </button>
          </div>
        </div>

        <ScanTagFilters
          onFilterChange={setFilters}
          sites={[...new Set(tags.map(t => t.tags.site_name).filter(Boolean))]}
          clients={[...new Set(tags.map(t => t.tags.client_name).filter(Boolean))]}
          supervisors={[...new Set(tags.map(t => t.tags.supervisor_name || String(t.tags.supervisor_id)).filter(Boolean))]}
        />

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">Supervisor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTags.map((t: ScanTag) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">{format(new Date(t.tags.scanned_at), 'PPp')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">{t.tags.site_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">{t.tags.client_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">{t.tags.supervisor_name || `ID: ${t.tags.supervisor_id}` || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {t.tags.latitude != null && t.tags.longitude != null
                        ? `${Number(t.tags.latitude).toFixed(6)}, ${Number(t.tags.longitude).toFixed(6)}`
                        : <span className="text-gray-400 italic">No GPS</span>}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.tags.location_quality === 'high'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : t.tags.location_quality === 'medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {t.tags.location_verified && '✓ '}{t.tags.location_quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[600px] w-full">
            <MapView tags={filteredTags} defaultCenter={[-26.2041, 28.0473]} defaultZoom={12} />
          </div>
        )}
      </div>
    </ControlRoomLayout>
  );
}
