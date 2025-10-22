import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

export default function ShiftsCreate() {
  const { guards = [], supervisors = [], sites = [] } = usePage().props as any;

  type ShiftForm = {
    name: string;
    start_time: string;
    end_time: string;
    description: string;
    supervisor_id: number | '';
    required_guards: number;
    sites: number[];
  };

  const { data, setData, post, processing, errors } = useForm<ShiftForm>({
    name: '',
    start_time: '',
    end_time: '',
    description: '',
    supervisor_id: '',
    required_guards: 1,
    sites: [] as number[],
  });

  const toggleSite = (siteId: number) => {
    const current = new Set(data.sites as any[]);
    if (current.has(siteId)) current.delete(siteId); else current.add(siteId);
    setData('sites', Array.from(current));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.shifts.store'));
  };

  return (
    <ControlRoomLayout title="Create Shift">
      <Head title="Create Shift" />
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">New Shift</h3>
              <Link href={route('control-room.shifts.index')} className="text-sm text-indigo-600">Back</Link>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input className="w-full border rounded-md p-2" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Supervisor</label>
                <select className="w-full border rounded-md p-2" value={data.supervisor_id as any} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('supervisor_id', e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select supervisor</option>
                  {supervisors.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.supervisor_id && <p className="text-sm text-red-600">{errors.supervisor_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Start Time</label>
                <input type="time" className="w-full border rounded-md p-2" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} />
                {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">End Time</label>
                <input type="time" className="w-full border rounded-md p-2" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} />
                {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Required Guards</label>
                <input type="number" min={1} className="w-full border rounded-md p-2" value={data.required_guards as any} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('required_guards', Number(e.target.value))} />
                {errors.required_guards && <p className="text-sm text-red-600">{errors.required_guards}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Sites</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
                  {sites.map((s: any) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(data.sites as any[]).includes(s.id)} onChange={() => toggleSite(s.id)} />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Description</label>
                <textarea className="w-full border rounded-md p-2" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="submit" disabled={processing}>Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
