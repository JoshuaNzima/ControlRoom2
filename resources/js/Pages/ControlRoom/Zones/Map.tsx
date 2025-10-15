import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';

export default function ZoneMap() {
  const { zone, sites } = usePage().props as any;

  return (
    <ControlRoomLayout title={`Zone Map • ${zone.name}`}>
      <Head title={`Zone Map • ${zone.name}`} />
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sites in {zone.name}</h3>
              <Link href={route('control-room.zones.index')} className="text-sm text-indigo-600">Back to Zones</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Map integration (Leaflet/Mapbox) can be added here.</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sites?.map((s: any) => (
                <div key={s.id} className="p-3 rounded border dark:border-gray-600">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.status ?? 'unknown'} • lat {s.latitude ?? '-'}, lng {s.longitude ?? '-'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
