import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';

export default function ShiftsShow() {
  const { shift, availableGuards = [] } = usePage().props as any;

  return (
    <ControlRoomLayout title={`Shift • ${shift.name}`}>
      <Head title={`Shift • ${shift.name}`} />
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Details</h3>
              <Link href={route('control-room.shifts.index')} className="text-sm text-indigo-600">Back</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 dark:text-gray-300">{shift.start_time} - {shift.end_time} • Required {shift.required_guards}</div>
            <div className="text-sm text-gray-500">Sites: {Array.isArray(shift.sites) ? shift.sites.join(', ') : ''}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Assigned Guards</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shift.guards?.length === 0 && <div className="text-sm text-gray-500">No guards assigned.</div>}
              {shift.guards?.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between p-3 border rounded-md dark:border-gray-600">
                  <div className="font-medium">{g.name}</div>
                  <Link href={route('control-room.shifts.unassign', [shift.id, g.id])} method="post" as="button" className="text-sm text-red-600">Unassign</Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
