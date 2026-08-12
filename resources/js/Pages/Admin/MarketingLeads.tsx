import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

interface Lead {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status: string;
  score?: number | null;
  assigned?: string | null;
  campaign?: string | null;
  created_at?: string | null;
}

interface Paginated<T> {
  data: T[];
  links: any[];
  meta: any;
}

interface Option { id: number; name: string }

interface Props {
  auth?: any;
  leads?: Paginated<Lead>;
  filters?: { status?: string; source?: string; search?: string };
  summary?: { total?: number; new?: number; contacted?: number; qualified?: number; converted?: number };
  statuses?: string[];
  sources?: string[];
  campaigns?: Option[];
}

interface LeadForm {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  score: number | '';
  campaign_id: number | '';
  notes: string;
}

export default function MarketingLeads({ auth = {}, leads, filters, summary = {}, statuses = [], sources = [], campaigns = [] }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);

  const [status, setStatus] = useState(filters?.status || '');
  const [source, setSource] = useState(filters?.source || '');
  const [search, setSearch] = useState(filters?.search || '');

  const applyFilters = () => {
    router.get(route('admin.marketing.leads.index'), { status, source, search }, { preserveState: true });
  };

  return (
    <AuthenticatedLayout header="Marketing Leads" user={auth?.user as any}>
      <Head title="Marketing Leads" />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-coin-900 via-coin-800 to-coin-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="Users" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Leads</h1>
                <p className="text-coin-100 dark:text-gray-400 text-sm mt-1">Capture, qualify, and convert prospects</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCreateOpen(true)} className="bg-coin-600 hover:bg-coin-500">
                <IconMapper name="Plus" size={16} className="mr-1" /> New Lead
              </Button>
              <Link href={route('admin.marketing')}>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <IconMapper name="Megaphone" size={16} className="mr-1" /> Marketing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={summary.total || 0} color="gray" />
          <StatCard label="New" value={summary.new || 0} color="coin" />
          <StatCard label="Contacted" value={summary.contacted || 0} color="coin" />
          <StatCard label="Qualified" value={summary.qualified || 0} color="emerald" />
          <StatCard label="Converted" value={summary.converted || 0} color="coin" />
        </div>

        {/* Filter Card */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <IconMapper name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                  placeholder="Search name, email, phone"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
                />
              </div>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
            >
              <option value="">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
            >
              <option value="">All Sources</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">Apply</Button>
              <Button onClick={() => { setStatus(''); setSource(''); setSearch(''); router.get(route('admin.marketing.leads.index')); }} variant="ghost">Reset</Button>
            </div>
          </div>
        </Card>

        {/* Leads Table Card */}
        <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <div className="md:hidden p-4 space-y-3">
              {leads?.data?.length ? (
                leads.data.map((l) => (
                  <div key={l.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{l.name}</div>
                        <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-300 truncate">
                          {l.email || '—'}{l.phone ? ` • ${l.phone}` : ''}
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-1 rounded text-xs bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200">{l.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Source</div>
                        <div className="text-gray-900 dark:text-gray-100 truncate">{l.source || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Campaign</div>
                        <div className="text-gray-900 dark:text-gray-100 truncate">{l.campaign || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Score</div>
                        <div className="text-gray-900 dark:text-gray-100">{l.score ?? 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Created</div>
                        <div className="text-gray-900 dark:text-gray-100 truncate">{l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setSelected(l); setEditOpen(true); }}
                        className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/60 dark:text-gray-100 dark:hover:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (confirm('Delete lead?')) router.delete(route('admin.marketing.leads.destroy', l.id)); }}
                        className="w-full px-3 py-2 rounded-lg bg-red-700 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No leads yet.
                </div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Contact</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Source</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Campaign</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Score</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {leads?.data?.length ? leads.data.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{l.name}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{l.email || '—'}{l.phone ? ` • ${l.phone}` : ''}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{l.source || '—'}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{l.campaign || '—'}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded text-xs bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200">{l.status}</span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">{l.score ?? 0}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => { setSelected(l); setEditOpen(true); }} className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100">Edit</button>
                          <button onClick={() => { if (confirm('Delete lead?')) router.delete(route('admin.marketing.leads.destroy', l.id)); }} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No leads yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {(leads?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-950 px-4 py-3 flex flex-wrap justify-center gap-2 border-t border-gray-200 dark:border-gray-800">
                {(leads?.links ?? []).map((link: any, idx: number) => (
                  <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-coin-700 text-white' : 'bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
        </Card>

        <LeadModal open={createOpen} onClose={() => setCreateOpen(false)} campaigns={campaigns} statuses={statuses} />
        {selected && (
          <LeadModal open={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }} campaigns={campaigns} statuses={statuses} lead={selected} />
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string,string> = {
    gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:border-gray-800 dark:text-gray-100',
    coin: 'from-coin-50 to-coin-100 border-coin-200 text-coin-900 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30 dark:text-coin-100',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-100',
  };
  return (
    <Card className={`p-4 bg-gradient-to-br ${colors[color]}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </Card>
  );
}

function LeadModal({ open, onClose, campaigns, statuses, lead }: { open: boolean; onClose: () => void; campaigns: Option[]; statuses: string[]; lead?: Lead }) {
  const { data, setData, post, put, processing, errors, reset } = useForm<LeadForm>({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    source: lead?.source || '',
    status: lead?.status || statuses[0] || 'new',
    score: lead?.score ?? '',
    campaign_id: '' as any,
    notes: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lead) {
      put(route('admin.marketing.leads.update', lead.id), { onSuccess: () => { reset(); onClose(); } });
    } else {
      post(route('admin.marketing.leads.store'), { onSuccess: () => { reset(); onClose(); } });
    }
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{lead ? 'Edit Lead' : 'New Lead'}</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500" value={data.name} onChange={(e) => setData('name', e.target.value)} />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500" value={data.email} onChange={(e) => setData('email', e.target.value)} />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500" value={data.source} onChange={(e) => setData('source', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500" value={data.status} onChange={(e) => setData('status', e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score</label>
            <input type="number" min={0} max={100} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500" value={data.score} onChange={(e) => setData('score', e.target.value ? Number(e.target.value) : '')} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500" value={data.campaign_id as any} onChange={(e) => setData('campaign_id', e.target.value ? Number(e.target.value) : ('' as any))}>
              <option value="">None</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-200 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
