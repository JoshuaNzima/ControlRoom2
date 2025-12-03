import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';

export default function ClientsIndex() {
  const { clients, filters = {} } = usePage().props as any;
  const [search, setSearch] = React.useState<string>(filters.search || '');
  const [status, setStatus] = React.useState<string>(filters.status || '');

  const gotoTab = (next: string) => {
    router.get(route('control-room.clients'), { search, status: next || undefined }, { preserveState: true, preserveScroll: true });
  };

  const apply = () => {
    router.get(route('control-room.clients'), { search: search || undefined, status: status || undefined }, { preserveState: true, preserveScroll: true });
  };

  return (
    <ControlRoomLayout title="Clients">
      <Head title="Clients" />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Clients</h2>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All Clients</h3>
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100" placeholder="Name..." />
                </div>
                <div className="flex gap-2">
                  <button onClick={apply} className="px-4 py-2 rounded-md bg-coin-700 hover:bg-coin-800 text-white">Apply</button>
                  <button onClick={() => { setSearch(''); setStatus(''); router.get(route('control-room.clients'), {}, { preserveState: true, preserveScroll: true }); }} className="px-4 py-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
                </div>
              </div>
              <div className="flex gap-4">
                <button className={`px-3 py-2 text-sm font-medium border-b-2 ${!status ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => { setStatus(''); gotoTab(''); }}>All</button>
                <button className={`px-3 py-2 text-sm font-medium border-b-2 ${status === 'active' ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => { setStatus('active'); gotoTab('active'); }}>Active</button>
                <button className={`px-3 py-2 text-sm font-medium border-b-2 ${status === 'inactive' ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => { setStatus('inactive'); gotoTab('inactive'); }}>Inactive</button>
              </div>
            </div>
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
              {clients?.data?.length === 0 && (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">No clients found.</div>
              )}
            </div>
            {clients?.links && (
              <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">Page {clients?.meta?.current_page ?? ''} of {clients?.meta?.last_page ?? ''}</div>
                <div className="flex flex-wrap gap-2">
                  {clients.links.filter((l: any) => l.url).map((l: any, idx: number) => (
                    <button
                      key={idx}
                      className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                      onClick={() => router.get(l.url, { search: search || undefined, status: status || undefined }, { preserveScroll: true, preserveState: true })}
                      dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
