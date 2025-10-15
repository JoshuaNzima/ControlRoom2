import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';

export default function ZoneReports() {
  const { zone, stats } = usePage().props as any;

  return (
    <ControlRoomLayout title={`Zone Reports • ${zone.name}`}>
      <Head title={`Zone Reports • ${zone.name}`} />
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Coverage & Attendance (7 days)</h3>
              <Link href={route('control-room.zones.index')} className="text-sm text-indigo-600">Back to Zones</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.map((s: any, idx: number) => (
                <div key={idx} className="p-3 rounded border dark:border-gray-600">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{s.date}</div>
                  <div className="text-sm">Coverage: <span className="font-semibold">{s.coverage_rate}%</span></div>
                  <div className="text-sm">Attendance: <span className="font-semibold">{s.attendance_rate}%</span></div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active {s.active_guards} / Required {s.required_guards} • Present {s.present_guards}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
