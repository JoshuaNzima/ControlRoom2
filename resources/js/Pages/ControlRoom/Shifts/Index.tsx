import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

export default function ShiftsIndex() {
  const { shifts } = usePage().props as any;

  return (
    <ControlRoomLayout title="Shift Management">
      <Head title="Shift Management" />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Shifts</h2>
          <Link href={route('control-room.shifts.create')} className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm">Create Shift</Link>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Shifts</h3>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {shifts?.data?.map((s: any) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.start_time} - {s.end_time} • Required guards: {s.required_guards}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={route('control-room.shifts.show', s.id)} className="text-sm text-indigo-600">View</Link>
                    <Link href={route('control-room.shifts.edit', s.id)} className="text-sm text-gray-600">Edit</Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
