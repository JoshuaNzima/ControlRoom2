import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

export default function ZoneAssign() {
  const { zone, sites = [], guards = [], assignments = [] } = usePage().props as any;
  const { data, setData, post, processing, reset, errors } = useForm({
    guard_id: '',
    client_site_id: '',
    start_date: '',
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.zones.assignments.store', zone.id), { onSuccess: () => reset() });
  };

  return (
    <ControlRoomLayout title={`Assign Guards • ${zone.name}`}>
      <Head title={`Assign Guards • ${zone.name}`} />
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Assign Guards to {zone.name}</h3>
              <Link href={route('control-room.zones.index')} className="text-sm text-indigo-600">Back to Zones</Link>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">Guard</label>
                <select value={data.guard_id} onChange={(e) => setData('guard_id', e.target.value)} className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-600">
                  <option value="">Select guard</option>
                  {guards.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                {errors.guard_id && <p className="text-sm text-red-600 mt-1">{errors.guard_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site</label>
                <select value={data.client_site_id} onChange={(e) => setData('client_site_id', e.target.value)} className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-600">
                  <option value="">Select site</option>
                  {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.client_site_id && <p className="text-sm text-red-600 mt-1">{errors.client_site_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-600" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={processing}>Assign</Button>
                <Button type="button" variant="outline" onClick={() => reset()}>Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Active Assignments</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments.length === 0 && <div className="text-sm text-gray-500">No active assignments in this zone.</div>}
              {assignments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 border rounded-md dark:border-gray-600">
                  <div>
                    <div className="font-medium">{a.guard?.name}</div>
                    <div className="text-xs text-gray-500">{a.site?.name} • since {a.start_date}</div>
                  </div>
                  <Link href={route('control-room.zones.assignments.destroy', [zone.id, a.id])} method="delete" as="button" className="text-sm text-red-600">Unassign</Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
