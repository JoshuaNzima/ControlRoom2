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
      if (filters.supervisor && tag.tags.supervisor_id !== filters.supervisor) return false;
      
      if (filters.dateRange) {
        const scanDate = new Date(tag.tags.scanned_at);
        if (filters.dateRange.start && scanDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && scanDate > new Date(filters.dateRange.end)) return false;
      }

      if (filters.locationRadius) {
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

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Scan Tags</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded ${
                viewMode === 'map' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Map
            </button>
          </div>
        </div>

        <ScanTagFilters
          onFilterChange={setFilters}
          sites={[...new Set(tags.map(t => t.tags.site_name))]}
          clients={[...new Set(tags.map(t => t.tags.client_name))]}
          supervisors={[...new Set(tags.map(t => t.tags.supervisor_id))]}
        />

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2">Time</th>
                  <th className="py-2">Site</th>
                  <th className="py-2">Client</th>
                  <th className="py-2">Supervisor</th>
                  <th className="py-2">Location</th>
                  <th className="py-2">Quality</th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map((t: ScanTag) => (
                  <tr key={t.id} className="border-t">
                    <td className="py-3 text-sm">{format(new Date(t.tags.scanned_at), 'PPp')}</td>
                    <td className="py-3 text-sm">{t.tags.site_name}</td>
                    <td className="py-3 text-sm">{t.tags.client_name}</td>
                    <td className="py-3 text-sm">{t.tags.supervisor_id || 'N/A'}</td>
                    <td className="py-3 text-sm">{t.tags.latitude.toFixed(6)}, {t.tags.longitude.toFixed(6)}</td>
                    <td className="py-3 text-sm">{t.tags.location_quality}</td>
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
