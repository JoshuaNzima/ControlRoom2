import React from 'react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import EmptyState from '@/Components/ui/empty-state';
import { formatDistanceToNow } from '@/Components/format';

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
  created_at: string;
};

type PageProps = {
  auth: { user?: { name?: string } };
  downs: { 
    data: Down[]; 
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    meta?: { current_page: number; last_page: number; total?: number };
  };
};

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  open: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40', icon: 'AlertCircle', label: 'Open' },
  escalated: { color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40', icon: 'TrendingUp', label: 'Escalated' },
  resolved: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40', icon: 'CheckCircle', label: 'Resolved' },
  absconding: { color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40', icon: 'ShieldAlert', label: 'Absconding' },
};

const typeConfig: Record<string, { color: string; label: string }> = {
  guard_absent: { color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40', label: 'Guard Absent' },
  site_unmanned: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40', label: 'Site Unmanned' },
  other: { color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600', label: 'Other' },
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

  // Stats
  const stats = React.useMemo(() => [
    { icon: 'AlertCircle', title: 'Open', value: downs.data.filter((d: Down) => d.status === 'open').length, color: 'bg-blue-500' },
    { icon: 'TrendingUp', title: 'Escalated', value: downs.data.filter((d: Down) => d.status === 'escalated').length, color: 'bg-amber-500' },
    { icon: 'CheckCircle', title: 'Resolved', value: downs.data.filter((d: Down) => d.status === 'resolved').length, color: 'bg-emerald-500' },
    { icon: 'ShieldAlert', title: 'Absconding', value: downs.data.filter((d: Down) => d.status === 'absconding').length, color: 'bg-purple-500' },
  ], [downs.data]);

  return (
    <ControlRoomLayout title="Downs Management" user={auth?.user as any}>
      <Head title="Downs Management" />
      <div className="space-y-6">
        {/* Hero Header */}
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-xl bg-gray-900 dark:bg-gray-800 p-4"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${stat.color}`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-20`}>
                  <IconMapper name={stat.icon} size={20} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

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
          <div className="space-y-3">
            {downs.data.map((d: Down) => {
              const status = statusConfig[d.status] || statusConfig.open;
              const type = typeConfig[d.type] || typeConfig.other;

              return (
                <Card
                  key={d.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Left accent bar based on status */}
                    <div className={`w-full sm:w-1.5 ${
                      d.status === 'escalated' ? 'bg-rose-500' :
                      d.status === 'absconding' ? 'bg-purple-500' :
                      d.status === 'resolved' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} />

                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${status.color} text-xs`}>
                              <IconMapper name={status.icon} size={12} className="mr-1 inline" />
                              {status.label}
                              {d.escalation_level > 0 && ` • L${d.escalation_level}`}
                            </Badge>
                            <Badge className={`${type.color} text-xs`}>
                              {type.label}
                            </Badge>
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                            {d.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {d.reporter && (
                              <span className="flex items-center gap-1">
                                <IconMapper name="User" size={14} />
                                {d.reporter.name}
                              </span>
                            )}
                            {d.client && (
                              <span className="flex items-center gap-1">
                                <IconMapper name="Building" size={14} />
                                {d.client.name}
                              </span>
                            )}
                            {d.client_site && (
                              <span className="flex items-center gap-1">
                                <IconMapper name="MapPin" size={14} />
                                {d.client_site.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <IconMapper name="Clock" size={14} />
                              {formatDistanceToNow(d.created_at)}
                            </span>
                          </div>
                          {d.description && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {d.description}
                            </div>
                          )}
                          {d.guard_relation?.id && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => openGuardDetails(d.guard_relation!.id)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                              >
                                <IconMapper name="Shield" size={12} />
                                View Guard {d.guard_relation.employee_id ? `(${d.guard_relation.employee_id})` : ''}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {d.status !== 'resolved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => escalate(d.id)}
                              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                            >
                              <IconMapper name="TrendingUp" size={14} className="mr-1" />
                              Escalate
                            </Button>
                          )}
                          {d.status !== 'resolved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolve(d.id)}
                              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            >
                              <IconMapper name="CheckCircle" size={14} className="mr-1" />
                              Resolve
                            </Button>
                          )}
                          {d.status !== 'resolved' && d.status !== 'absconding' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abscond(d.id)}
                              className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                            >
                              <IconMapper name="ShieldAlert" size={14} className="mr-1" />
                              Abscond
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {downs.data.length === 0 && (
              <EmptyState
                title="No open downs"
                description="You're clear right now. New downs will appear here."
                size="sm"
                contentClassName="py-6"
              />
            )}
          </div>
          {/* Pagination */}
          {(downs as any)?.links && (downs as any).meta?.last_page > 1 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Page {downs?.meta?.current_page ?? ''} of {downs?.meta?.last_page ?? ''}</div>
              <div className="flex flex-wrap gap-2">
                {(downs as any).links?.filter((l: any) => l.url).map((l: any, idx: number) => (
                  <button
                    key={idx}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      l.active
                        ? 'bg-red-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                  />
                ))}
              </div>
            </div>
          )}
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
