import React from 'react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
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
    guard_id: '',
    flag_guard: false as boolean,
    flag_reason: '',
    flag_details: '',
  });

  const [siteSearch, setSiteSearch] = React.useState('');
  const [siteResults, setSiteResults] = React.useState<Array<{ id: number; name: string; client_name: string }>>([]);
  const [loadingSites, setLoadingSites] = React.useState(false);
  const [selectedSiteName, setSelectedSiteName] = React.useState<string>('');

  const [guardSearch, setGuardSearch] = React.useState('');
  const [guardResults, setGuardResults] = React.useState<Array<{ id: number; name: string; employee_id?: string; status?: string }>>([]);
  const [loadingGuards, setLoadingGuards] = React.useState(false);
  const [selectedGuardName, setSelectedGuardName] = React.useState<string>('');

  const loadSites = React.useCallback(async () => {
    try {
      setLoadingSites(true);
      const params = new URLSearchParams();
      if (siteSearch) params.set('search', siteSearch);
      const url = `${route('control-room.clients.sites.json')}?${params.toString()}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const list = await res.json();
      setSiteResults(Array.isArray(list) ? list : []);
    } catch {
      setSiteResults([]);
    } finally {
      setLoadingSites(false);
    }
  }, [siteSearch]);

  const loadGuards = React.useCallback(async () => {
    try {
      setLoadingGuards(true);
      const params = new URLSearchParams();
      if (guardSearch) params.set('q', guardSearch);
      const url = `${route('control-room.guards.search')}?${params.toString()}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const list = await res.json();
      setGuardResults(Array.isArray(list) ? list : []);
    } catch {
      setGuardResults([]);
    } finally {
      setLoadingGuards(false);
    }
  }, [guardSearch]);

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
    <ControlRoomLayout title="Downs Management" user={auth?.user as any}>
      <Head title="Downs Management" />
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
              <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" value={data.type} onChange={e => setData('type', e.target.value as 'guard_absent' | 'site_unmanned' | 'other')}>
                <option value="guard_absent">Guard absent</option>
                <option value="site_unmanned">Site unmanned</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" rows={3} value={data.description} onChange={e => setData('description', e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Site</label>
                  <input
                    value={siteSearch}
                    onChange={e => setSiteSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), loadSites())}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="Search site or client name"
                  />
                </div>
                <button type="button" onClick={loadSites} className="h-9 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm">{loadingSites ? 'Loading…' : 'Search'}</button>
              </div>
              {selectedSiteName && (
                <div className="text-xs text-gray-500">Selected site: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSiteName}</span></div>
              )}
              <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {siteResults.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">{loadingSites ? 'Loading…' : 'No sites found'}</div>
                ) : (
                  <ul>
                    {siteResults.map(s => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => { setData('client_site_id', String(s.id)); setSelectedSiteName(`${s.client_name} • ${s.name}`); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.client_name}</div>
                          <div className="text-xs text-gray-500">{s.name}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Guard</label>
                  <input
                    value={guardSearch}
                    onChange={e => setGuardSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), loadGuards())}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="Search guard name or employee ID"
                  />
                </div>
                <button type="button" onClick={loadGuards} className="h-9 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm">{loadingGuards ? 'Loading…' : 'Search'}</button>
              </div>
              {selectedGuardName && (
                <div className="text-xs text-gray-500">Selected guard: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedGuardName}</span></div>
              )}
              <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {guardResults.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">{loadingGuards ? 'Loading…' : 'No guards found'}</div>
                ) : (
                  <ul>
                    {guardResults.map(g => (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => { setData('guard_id', String(g.id)); setSelectedGuardName(`${g.name}${g.employee_id ? ' • ' + g.employee_id : ''}`); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
                          {g.employee_id && (<div className="text-xs text-gray-500">{g.employee_id}</div>)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={!!data.flag_guard} onChange={e => setData('flag_guard', e.target.checked)} />
                Flag involved guard now
              </label>
              {data.flag_guard && (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Flag Reason</label>
                    <input
                      value={data.flag_reason as string}
                      onChange={e => setData('flag_reason', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      placeholder="Reason for flag"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Flag Details</label>
                    <textarea
                      value={data.flag_details as string}
                      onChange={e => setData('flag_details', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      placeholder="Additional details"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="pt-2">
              <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Report</button>
            </div>
          </form>
        </section>

        <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Open Downs</h2>
          <div className="divide-y dark:divide-gray-700">
            {downs.data.map((d: any) => (
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
    </ControlRoomLayout>
  );
}


