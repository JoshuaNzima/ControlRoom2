import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';

export default function ClientsIndex() {
  const { clients, filters } = usePage().props as any;

  return (
    <ControlRoomLayout title="Clients">
      <Head title="Clients" />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Clients</h2>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All Clients</h3>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {clients?.data?.map((c: any) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">Sites: {c.sites_count}</div>
                  </div>
                  <Link href={route('control-room.clients.show', c.id)} className="text-sm text-indigo-600">View</Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
