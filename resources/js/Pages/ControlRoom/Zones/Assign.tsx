import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

export default function ZoneAssign() {
  const { zone, sites = [], guards = [], assignments = [] } = usePage().props as any;
  const { data, setData, post, processing, reset, errors } = useForm({
    guard_id: '',
    client_site_id: '',
    start_date: '',
  });

  const endForm = useForm<{ end_date: string }>({
    end_date: new Date().toISOString().slice(0,10),
  });
  const [endFor, setEndFor] = React.useState<{ id: number; guard?: { id: number; name: string }; site?: { id: number; name: string } } | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.zones.assignments.store', zone.id), { onSuccess: () => reset() });
  };

  const onEndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endFor) return;
    endForm.post(route('control-room.zones.assignments.end', [zone.id, endFor.id]), {
      onSuccess: () => {
        setEndFor(null);
        endForm.reset('end_date');
      }
    });
  };

  return (
    <AuthenticatedLayout header={`Assign Guards • ${zone.name}`}>
      <Head title={`Assign Guards • ${zone.name}`} />
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Assign Guards to {zone.name}</h3>
              <Link href={route('control-room.zones.index')} className="text-sm text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200">Back to Zones</Link>
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
                  <Button size="sm" variant="destructive" onClick={() => { setEndFor(a); endForm.setData('end_date', new Date().toISOString().slice(0,10)); }}>End Assignment</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!endFor} onOpenChange={(o) => { if (!o) setEndFor(null); }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>End Assignment {endFor ? `• ${endFor.guard?.name} @ ${endFor.site?.name}` : ''}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={onEndSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={endForm.data.end_date} onChange={(e) => endForm.setData('end_date', e.target.value)} className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-600" />
                {endForm.errors.end_date && <p className="text-sm text-red-600 mt-1">{endForm.errors.end_date}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEndFor(null)}>Cancel</Button>
                <Button type="submit" disabled={endForm.processing}>Confirm End</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
