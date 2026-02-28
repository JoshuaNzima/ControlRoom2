import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Card } from '@/Components/ui/card';
import { StatCard } from '@/Components/StatCard';
import { ActionTile } from '@/Components/ActionTile';
import IconMapper from '@/Components/IconMapper';
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
  downs: {
    data: Down[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    meta?: { current_page: number; last_page: number; total?: number };
  };
};

export default function DownsIndex() {
  const { auth, downs } = usePage<PageProps>().props;
  const { data, setData, post, processing, reset } = useForm({
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

  const [guardModalOpen, setGuardModalOpen] = React.useState(false);
  const [guardLoading, setGuardLoading] = React.useState(false);
  const [guardDetails, setGuardDetails] = React.useState<any | null>(null);

  const loadSites = React.useCallback(async () => {
    try {
      setLoadingSites(true);
      const params = new URLSearchParams();
      if (siteSearch) params.set('search', siteSearch);
      const url = `${route('admin.clients.sites.json')}?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
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
      const url = `${route('admin.guards.search')}?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
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
    post(route('admin.downs.store'), {
      onSuccess: () => reset(),
    });
  }

  function escalate(id: number) {
    router.post(route('admin.downs.escalate', id));
  }

  function resolve(id: number) {
    router.post(route('admin.downs.resolve', id));
  }

  function abscond(id: number) {
    router.post(route('admin.downs.abscond', id));
  }

  async function openGuardDetails(guardId: number) {
    try {
      setGuardModalOpen(true);
      setGuardLoading(true);
      setGuardDetails(null);
      const res = await fetch(route('admin.guards.json', guardId), { headers: { Accept: 'application/json' } });
      const json = await res.json();
      setGuardDetails(json);
    } catch {
      setGuardDetails({ error: 'Failed to load guard details' });
    } finally {
      setGuardLoading(false);
    }
  }

  return (
    <AdminLayout title="Downs Management" user={auth?.user as any}>
      <Head title="Downs Management" />

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="AlertTriangle" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Downs Management</h1>
                  <p className="text-red-100 mt-1">Report, track, and resolve coverage downs</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-200">Open Downs</p>
                  <p className="text-lg font-semibold">{downs.data.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<IconMapper name="AlertCircle" size={24} />} title="Open Downs" value={downs.data.filter((d: Down) => d.status === 'open').length} subtitle="Awaiting resolution" color="red" />
          <StatCard icon={<IconMapper name="TrendingUp" size={24} />} title="Escalated" value={downs.data.filter((d: Down) => d.status === 'escalated').length} subtitle="Needs attention" color="amber" />
          <StatCard icon={<IconMapper name="CheckCircle" size={24} />} title="Resolved" value={downs.data.filter((d: Down) => d.status === 'resolved').length} subtitle="This session" color="green" />
          <StatCard icon={<IconMapper name="ShieldAlert" size={24} />} title="Absconding" value={downs.data.filter((d: Down) => d.status === 'absconding').length} subtitle="Guard issues" color="purple" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionTile icon={<IconMapper name="Plus" size={18} />} title="Report Down" description="Log new incident" color="bg-red-600" href="#report-form" />
          <ActionTile icon={<IconMapper name="RefreshCw" size={18} />} title="Refresh" description="Reload data" color="bg-emerald-600" onClick={() => router.reload()} />
          <ActionTile icon={<IconMapper name="Filter" size={18} />} title="Filter" description="(coming soon)" color="bg-blue-600" onClick={() => {}} />
          <ActionTile icon={<IconMapper name="History" size={18} />} title="History" description="(coming soon)" color="bg-purple-600" onClick={() => {}} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 p-6" id="report-form">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Report a Down</h2>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" value={data.type} onChange={(e) => setData('type', e.target.value as any)}>
                  <option value="guard_absent">Guard absent</option>
                  <option value="site_unmanned">Site unmanned</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Site</label>
                    <input value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadSites())} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="Search site or client name" />
                  </div>
                  <button type="button" onClick={loadSites} className="h-9 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                    {loadingSites ? 'Loading…' : 'Search'}
                  </button>
                </div>

                {selectedSiteName && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Selected site: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSiteName}</span>
                  </div>
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
                      {siteResults.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setData('client_site_id', String(s.id));
                              setSelectedSiteName(`${s.client_name} • ${s.name}`);
                            }}
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
                    <input value={guardSearch} onChange={(e) => setGuardSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadGuards())} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="Search guard name or employee ID" />
                  </div>
                  <button type="button" onClick={loadGuards} className="h-9 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                    {loadingGuards ? 'Loading…' : 'Search'}
                  </button>
                </div>

                {selectedGuardName && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Selected guard: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedGuardName}</span>
                  </div>
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
                      {guardResults.map((g) => (
                        <li key={g.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setData('guard_id', String(g.id));
                              setSelectedGuardName(`${g.name}${g.employee_id ? ' • ' + g.employee_id : ''}`);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
                            {g.employee_id && <div className="text-xs text-gray-500 dark:text-gray-400">{g.employee_id}</div>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-coin-700 text-white hover:bg-coin-800 disabled:opacity-50">
                  Report
                </button>
              </div>
            </form>
          </Card>

          <Card className="lg:col-span-2 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Open Downs</h2>
            <div className="divide-y dark:divide-gray-700">
              {downs.data.map((d: any) => (
                <div key={d.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {d.title}{' '}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-gray-700 dark:text-gray-100">{d.type.replace('_', ' ')}</span>
                    </div>
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
                    {d.description && <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{d.description}</div>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {d.status !== 'resolved' && <button onClick={() => escalate(d.id)} className="px-3 py-1 rounded-md bg-yellow-500 text-white hover:bg-yellow-600">Escalate</button>}
                    {d.status !== 'resolved' && <button onClick={() => resolve(d.id)} className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700">Resolve</button>}
                    {d.status !== 'resolved' && d.status !== 'absconding' && <button onClick={() => abscond(d.id)} className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700">Mark Absconding</button>}
                  </div>
                </div>
              ))}

              {downs.data.length === 0 && (
                <EmptyState title="No open downs" description="You’re clear right now. New downs will appear here." size="sm" contentClassName="py-6" />
              )}
            </div>

            {(downs as any)?.links && (downs as any).meta?.last_page > 1 && (
              <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">Page {downs?.meta?.current_page ?? ''} of {downs?.meta?.last_page ?? ''}</div>
                <div className="flex flex-wrap gap-2">
                  {(downs as any).links
                    ?.filter((l: any) => l.url)
                    .map((l: any, idx: number) => (
                      <button
                        key={idx}
                        className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                        onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                        dangerouslySetInnerHTML={{ __html: l.label }}
                      />
                    ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Modal show={guardModalOpen} onClose={() => setGuardModalOpen(false)} maxWidth="xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Guard Details</h3>
              <button onClick={() => setGuardModalOpen(false)} className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
                Close
              </button>
            </div>

            {guardLoading && <div className="text-sm text-gray-500">Loading…</div>}

            {!guardLoading && guardDetails && !guardDetails.error && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-gray-500">Name</span>
                    <div className="font-medium">{guardDetails.name}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Employee ID</span>
                    <div className="font-medium">{guardDetails.employee_id}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone</span>
                    <div className="font-medium">{guardDetails.phone || '—'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status</span>
                    <div className="font-medium">{guardDetails.status || '—'}</div>
                  </div>
                </div>
              </div>
            )}

            {!guardLoading && guardDetails?.error && <div className="text-sm text-red-500">{String(guardDetails.error)}</div>}
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
