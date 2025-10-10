import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';

type Down = {
  id: number;
  title: string;
  type: 'guard_absent' | 'site_unmanned' | 'other';
  status: 'open' | 'escalated' | 'resolved';
  description?: string;
  escalation_level: number;
  reporter?: { id: number; name: string };
  client?: { id: number; name: string };
  client_site?: { id: number; name: string };
};

type PageProps = {
  auth: { user?: { name?: string } };
  downs: { data: Down[] };
};

export default function DownsIndex() {
  const { auth, downs } = usePage<PageProps>().props;
  const { data, setData, post, processing, reset, errors } = useForm({
    title: '',
    type: 'site_unmanned' as 'guard_absent' | 'site_unmanned' | 'other',
    description: '',
    client_id: '',
    client_site_id: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('control-room.downs.store'), {
      onSuccess: () => reset(),
    });
  }

  function escalate(id: number) {
    router.post(route('control-room.downs.escalate', id));
  }

  function resolve(id: number) {
    router.post(route('control-room.downs.resolve', id));
  }

  return (
    <AdminLayout title="Downs" user={auth?.user as any}>
      <Head title="Downs" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Report a Down</h2>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" value={data.title} onChange={e => setData('title', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" value={data.type} onChange={e => setData('type', e.target.value as any)}>
                <option value="guard_absent">Guard absent</option>
                <option value="site_unmanned">Site unmanned</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" rows={3} value={data.description} onChange={e => setData('description', e.target.value)} />
            </div>
            <div className="pt-2">
              <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Report</button>
            </div>
          </form>
        </section>

        <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Open Downs</h2>
          <div className="divide-y dark:divide-gray-700">
            {downs.data.map((d) => (
              <div key={d.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.title} <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-gray-700 dark:text-gray-100">{d.type.replace('_', ' ')}</span></div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Status: {d.status}{d.escalation_level ? ` • Escalation ${d.escalation_level}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  {d.status !== 'resolved' && (
                    <button onClick={() => escalate(d.id)} className="px-3 py-1 rounded-md bg-yellow-500 text-white hover:bg-yellow-600">Escalate</button>
                  )}
                  {d.status !== 'resolved' && (
                    <button onClick={() => resolve(d.id)} className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700">Resolve</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}


