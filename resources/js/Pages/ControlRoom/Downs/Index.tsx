import React from 'react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Card } from '@/Components/ui/card';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';

type Down = {
  id: number;
  title: string;
  type: 'guard_absent' | 'site_unmanned' | 'other';
  status: 'open' | 'escalated' | 'resolved' | 'absconding';
  description?: string;
  escalation_level: number;
  reporter?: { id: number; name: string };
  client?: { id: number; name: string };
  client_site?: { id: number; name: string };
  guard_relation?: { id: number; name: string; employee_id?: string; status?: string };
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

  // Guard details modal state
  const [guardModalOpen, setGuardModalOpen] = React.useState(false);
  const [guardLoading, setGuardLoading] = React.useState(false);
  const [guardDetails, setGuardDetails] = React.useState<any | null>(null);

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

  function abscond(id: number) {
    router.post(route('control-room.downs.abscond', id));
  }

  async function openGuardDetails(guardId: number) {
    try {
      setGuardModalOpen(true);
      setGuardLoading(true);
      setGuardDetails(null);
      const res = await fetch(route('control-room.guards.json', guardId), { headers: { Accept: 'application/json' } });
      const json = await res.json();
      setGuardDetails(json);
    } catch (e) {
      setGuardDetails({ error: 'Failed to load guard details' });
    } finally {
      setGuardLoading(false);
    }
  }

  return (
    <ControlRoomLayout title="Downs Management" user={auth?.user as any}>
      <Head title="Downs Management" />
      <div className="space-y-6">
        <PageHeader
          title="Downs Management"
          description="Report, track, and resolve coverage downs."
        />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Report a Down</h2>
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
                <button type="button" onClick={loadSites} className="h-9 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                  {loadingSites ? 'Loading…' : 'Search'}
                </button>
              </div>
              {selectedSiteName && (
                <div className="text-xs text-gray-500 dark:text-gray-400">Selected site: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSiteName}</span></div>
              )}
              <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {siteResults.length === 0 ? (
                  loadingSites ? (
                    <div className="p-2">
                      <EmptyState title="Searching" description="Fetching site results…" size="sm" contentClassName="py-2" />
                    </div>
                  ) : (
                    <div className="p-2">
                      <EmptyState title="No sites found" description="Try a different search term." size="sm" contentClassName="py-2" />
                    </div>
                  )
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
                          <div className="text-xs text-gray-500 dark:text-gray-400">{s.name}</div>
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
                <button type="button" onClick={loadGuards} className="h-9 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                  {loadingGuards ? 'Loading…' : 'Search'}
                </button>
              </div>
              {selectedGuardName && (
                <div className="text-xs text-gray-500 dark:text-gray-400">Selected guard: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedGuardName}</span></div>
              )}
              <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {guardResults.length === 0 ? (
                  loadingGuards ? (
                    <div className="p-2">
                      <EmptyState title="Searching" description="Fetching guard results…" size="sm" contentClassName="py-2" />
                    </div>
                  ) : (
                    <div className="p-2">
                      <EmptyState title="No guards found" description="Try a different search term." size="sm" contentClassName="py-2" />
                    </div>
                  )
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
                          {g.employee_id && (<div className="text-xs text-gray-500 dark:text-gray-400">{g.employee_id}</div>)}
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
              <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-coin-700 text-white hover:bg-coin-800 disabled:opacity-50">Report</button>
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Open Downs</h2>
          <div className="divide-y dark:divide-gray-700">
            {downs.data.map((d: any) => (
              <div key={d.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{d.title} <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-gray-700 dark:text-gray-100">{d.type.replace('_', ' ')}</span></div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-2">
                    <span>Status: {d.status}{d.escalation_level ? ` • Escalation ${d.escalation_level}` : ''}</span>
                    {d.guard_relation?.id && (
                      <>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => openGuardDetails(d.guard_relation.id)}
                          className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                        >
                          View Guard {d.guard_relation.employee_id ? `(${d.guard_relation.employee_id})` : ''}
                        </button>
                      </>
                    )}
                  </div>
                  {d.description && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{d.description}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {d.status !== 'resolved' && (
                    <button onClick={() => escalate(d.id)} className="px-3 py-1 rounded-md bg-yellow-500 text-white hover:bg-yellow-600">Escalate</button>
                  )}
                  {d.status !== 'resolved' && (
                    <button onClick={() => resolve(d.id)} className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700">Resolve</button>
                  )}
                  {d.status !== 'resolved' && d.status !== 'absconding' && (
                    <button onClick={() => abscond(d.id)} className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700">Mark Absconding</button>
                  )}
                </div>
              </div>
            ))}
            {downs.data.length === 0 && (
              <EmptyState
                title="No open downs"
                description="You’re clear right now. New downs will appear here."
                size="sm"
                contentClassName="py-6"
              />
            )}
          </div>
        </Card>
      </div>
    {/* Guard Details Modal */}
    <Modal show={guardModalOpen} onClose={() => setGuardModalOpen(false)} maxWidth="xl">
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Guard Details</h3>
          <button onClick={() => setGuardModalOpen(false)} className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">Close</button>
        </div>
        {guardLoading && <div className="text-sm text-gray-500">Loading…</div>}
        {!guardLoading && guardDetails && !guardDetails.error && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><span className="text-sm text-gray-500">Name</span><div className="font-medium">{guardDetails.name}</div></div>
              <div><span className="text-sm text-gray-500">Employee ID</span><div className="font-medium">{guardDetails.employee_id}</div></div>
              <div><span className="text-sm text-gray-500">Phone</span><div className="font-medium">{guardDetails.phone || '—'}</div></div>
              <div><span className="text-sm text-gray-500">Status</span><div className="font-medium">{guardDetails.status || '—'}</div></div>
            </div>
            {Array.isArray(guardDetails.assignments) && guardDetails.assignments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assignments</h4>
                <ul className="mt-1 space-y-1 text-sm">
                  {guardDetails.assignments.map((a: any) => (
                    <li key={a.id} className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="font-medium">{a.site?.client?.name || 'Client'} • {a.site?.name || 'Site'}</div>
                        <div className="text-xs text-gray-500">Start {a.start_date || '—'}{a.end_date ? ` • End ${a.end_date}` : ''}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${a.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>{a.is_active ? 'Active' : 'Inactive'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {!guardLoading && guardDetails?.error && (
          <div className="text-sm text-red-500">{String(guardDetails.error)}</div>
        )}
      </div>
    </Modal>

    </div>
  </ControlRoomLayout>
);
}
