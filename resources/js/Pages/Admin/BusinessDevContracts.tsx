import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import BusinessDevLayout from '@/Layouts/BusinessDevLayout';
import Modal from '@/Components/Modal';

interface Contract { id: number; client_name?: string | null; title: string; value: number; status: string; start_date?: string | null; end_date?: string | null; renewal_date?: string | null }

function statusBadgeClass(status: string) {
  const s = (status || '').toLowerCase();

  if (s === 'active') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
  if (s === 'expired') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
  if (s === 'draft') return 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200';

  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}
interface Paginated<T> { data: T[]; links: any[]; meta: any }
interface Option { id: number; name: string }

interface Props {
  auth?: any;
  contracts?: Paginated<Contract>;
  filters?: { status?: string; search?: string };
  summary?: { total?: number; active?: number; expired?: number; draft?: number };
  clients?: Option[];
  statuses?: string[];
}

interface ContractForm { client_id: number | ''; title: string; start_date: string; end_date: string; value: string; status: string; renewal_date: string; contact_person: string; contact_email: string; terms: string }

export default function BusinessDevContracts({ auth = {}, contracts, filters, summary = {}, clients = [], statuses = [] }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);

  const [status, setStatus] = useState(filters?.status || '');
  const [search, setSearch] = useState(filters?.search || '');

  const applyFilters = () => router.get(route('admin.business-dev.contracts.index'), { status, search }, { preserveState: true });

  return (
    <BusinessDevLayout title="Contracts" user={auth?.user as any}>
      <Head title="Contracts" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Contracts</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-300 mt-1">Manage client contracts and renewals.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex w-full sm:w-auto justify-center items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-700 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50 dark:focus:ring-offset-gray-900"
              >
                New Contract
              </button>
              <Link
                href={route('admin.business-dev')}
                className="inline-flex w-full sm:w-auto justify-center items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-900/60 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-gray-800/60"
              >
                Business Dev
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total" value={summary.total || 0} color="gray" />
            <StatCard label="Active" value={summary.active || 0} color="emerald" />
            <StatCard label="Expired" value={summary.expired || 0} color="red" />
            <StatCard label="Draft" value={summary.draft || 0} color="coin" />
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or client"
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                <option value="">All Status</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={applyFilters}
                  className="w-full sm:w-auto px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                >
                  Apply
                </button>
                <button
                  onClick={() => { setStatus(''); setSearch(''); router.get(route('admin.business-dev.contracts.index')); }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow overflow-hidden">
            <div className="md:hidden p-4 space-y-3">
              {contracts?.data?.length ? (
                contracts.data.map((c) => (
                  <div key={c.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{c.title}</div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{c.client_name || '—'}</div>
                      </div>
                      <span className={`shrink-0 px-2 py-1 rounded text-xs ${statusBadgeClass(c.status)}`}>{c.status}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500 dark:text-gray-400">Value</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">MWK {Number(c.value || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500 dark:text-gray-400">Dates</span>
                        <span className="text-gray-700 dark:text-gray-200 text-right">{c.start_date || '—'}{c.end_date ? ` → ${c.end_date}` : ''}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelected(c); setEditOpen(true); }}
                        className="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/60 dark:text-gray-100 dark:hover:bg-gray-800/60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (confirm('Delete contract?')) router.delete(route('admin.business-dev.contracts.destroy', c.id)); }}
                        className="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-medium bg-red-700 text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No contracts yet.
                </div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Client</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Title</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Value</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Dates</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {contracts?.data?.length ? contracts.data.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{c.client_name || '—'}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{c.title}</td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">MWK {Number(c.value || 0).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">{c.status}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{c.start_date || '—'}{c.end_date ? ` → ${c.end_date}` : ''}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => { setSelected(c); setEditOpen(true); }} className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100">Edit</button>
                          <button onClick={() => { if (confirm('Delete contract?')) router.delete(route('admin.business-dev.contracts.destroy', c.id)); }} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No contracts yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {(contracts?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-950 px-4 py-3 flex flex-wrap justify-center gap-2 border-t border-gray-200 dark:border-gray-800">
                {(contracts?.links ?? []).map((link: any, idx: number) => (
                  <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-1 rounded text-xs ${
                      link.active
                        ? 'bg-red-700 text-white'
                        : 'bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>

          <ContractModal open={createOpen} onClose={() => setCreateOpen(false)} clients={clients} statuses={statuses} />
          {selected && (
            <ContractModal open={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }} clients={clients} statuses={statuses} contract={selected} />
          )}
        </div>
      </div>
    </BusinessDevLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string,string> = {
    gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:border-gray-800 dark:text-gray-100',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-100',
    red: 'from-red-50 to-red-100 border-red-200 text-red-900 dark:from-red-900/20 dark:to-red-900/10 dark:border-red-900/30 dark:text-red-100',
    coin: 'from-coin-50 to-coin-100 border-coin-200 text-coin-900 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30 dark:text-coin-100',
  };
  return (
    <div className={`p-4 rounded-xl border bg-gradient-to-br ${colors[color]}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ContractModal({ open, onClose, clients, statuses, contract }: { open: boolean; onClose: () => void; clients: Option[]; statuses: string[]; contract?: Contract }) {
  const { data, setData, post, put, processing, errors, reset } = useForm<ContractForm>({
    client_id: '' as any,
    title: contract?.title || '',
    start_date: contract?.start_date || '',
    end_date: contract?.end_date || '',
    value: String(contract?.value ?? ''),
    status: contract?.status || statuses[0] || 'draft',
    renewal_date: contract?.renewal_date || '',
    contact_person: '',
    contact_email: '',
    terms: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contract) {
      put(route('admin.business-dev.contracts.update', contract.id), { onSuccess: () => { reset(); onClose(); } });
    } else {
      post(route('admin.business-dev.contracts.store'), { onSuccess: () => { reset(); onClose(); } });
    }
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{contract ? 'Edit Contract' : 'New Contract'}</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.client_id as any} onChange={(e) => setData('client_id', e.target.value ? Number(e.target.value) : ('' as any))}>
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.client_id && <p className="text-sm text-red-600">{errors.client_id}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.title} onChange={(e) => setData('title', e.target.value)} />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input type="date" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
            {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input type="date" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
            {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value (MWK)</label>
            <input type="number" min={0} step="0.01" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.value} onChange={(e) => setData('value', e.target.value)} />
            {errors.value && <p className="text-sm text-red-600">{errors.value}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.status} onChange={(e) => setData('status', e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Renewal Date</label>
            <input type="date" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.renewal_date} onChange={(e) => setData('renewal_date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.contact_email} onChange={(e) => setData('contact_email', e.target.value)} />
            {errors.contact_email && <p className="text-sm text-red-600">{errors.contact_email}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terms</label>
            <textarea className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" rows={3} value={data.terms} onChange={(e) => setData('terms', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-600 disabled:bg-gray-400">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
