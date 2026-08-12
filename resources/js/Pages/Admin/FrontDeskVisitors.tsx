import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import Modal from '@/Components/Modal';

const frontDeskFieldClassName =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500';

const visitorStatusBadgeClassName = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('in') || s.includes('checked_in')) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
  }
  if (s.includes('out') || s.includes('checked_out')) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
};

interface Visitor { id: number; name: string; company?: string|null; purpose?: string|null; contact_person?: string|null; badge_number?: string|null; status: string; check_in_at?: string|null; check_out_at?: string|null }
interface Paginated<T> { data: T[]; links: any[]; meta: any }

interface Props {
  auth?: any;
  visitors?: Paginated<Visitor>;
  filters?: { status?: string; search?: string };
  options?: { statuses: string[] };
}

export default function FrontDeskVisitors({ auth = {}, visitors, filters = {}, options = { statuses: ['checked_in','checked_out'] } }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Visitor | null>(null);

  const [status, setStatus] = useState(filters.status || '');
  const [search, setSearch] = useState(filters.search || '');

  const applyFilters = () => router.get(route('admin.front-desk.visitors.index'), { status, search }, { preserveState: true });

  return (
    <AuthenticatedLayout header="Visitors" user={auth?.user as any}>
      <Head title="Visitors" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Visitors</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Track visitor check-ins and badges.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              >
                New Visitor
              </button>
              <Link href={route('admin.front-desk')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700">Front Desk</Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, badge" className={frontDeskFieldClassName} />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={frontDeskFieldClassName}>
                <option value="">All Status</option>
                {options.statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={applyFilters}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                >
                  Apply
                </button>
                <button
                  onClick={() => { setStatus(''); setSearch(''); router.get(route('admin.front-desk.visitors.index')); }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Badge</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Name</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Company</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Times</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {visitors?.data?.length ? visitors.data.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{v.badge_number || '—'}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{v.name}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{v.company || '—'}</td>
                      <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${visitorStatusBadgeClassName(v.status)}`}>{v.status}</span></td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{v.check_in_at || '—'}{v.check_out_at ? ` → ${v.check_out_at}` : ''}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => { setSelected(v); setEditOpen(true); }}
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete visitor?')) router.delete(route('admin.front-desk.visitors.destroy', v.id)); }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No visitors yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {(visitors?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-950 px-4 py-3 flex flex-wrap justify-center gap-2 border-t border-gray-200 dark:border-gray-800">
                {(visitors?.links ?? []).map((link: any, idx: number) => (
                  <Link key={idx} href={link.url || '#'} className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
              </div>
            )}
          </div>

          <VisitorModal open={createOpen} onClose={() => setCreateOpen(false)} statuses={options.statuses} />
          {selected && (
            <VisitorModal open={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }} statuses={options.statuses} visitor={selected} />
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function VisitorModal({ open, onClose, statuses, visitor }: { open: boolean; onClose: () => void; statuses: string[]; visitor?: Visitor }) {
  const { data, setData, post, put, processing, errors, reset } = useForm<{ name: string; company: string; purpose: string; contact_person: string; badge_number: string; status: string }>({
    name: visitor?.name || '',
    company: visitor?.company || '',
    purpose: visitor?.purpose || '',
    contact_person: visitor?.contact_person || '',
    badge_number: visitor?.badge_number || '',
    status: visitor?.status || statuses[0] || 'checked_in',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (visitor) {
      put(route('admin.front-desk.visitors.update', visitor.id), { onSuccess: () => { reset(); onClose(); } });
    } else {
      post(route('admin.front-desk.visitors.store'), { onSuccess: () => { reset(); onClose(); } });
    }
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{visitor ? 'Edit Visitor' : 'New Visitor'}</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input className={frontDeskFieldClassName} value={data.name} onChange={(e) => setData('name', e.target.value)} />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
            <input className={frontDeskFieldClassName} value={data.company} onChange={(e) => setData('company', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
            <input className={frontDeskFieldClassName} value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Badge Number</label>
            <input className={frontDeskFieldClassName} value={data.badge_number} onChange={(e) => setData('badge_number', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className={frontDeskFieldClassName} value={data.status} onChange={(e) => setData('status', e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
            <textarea className={frontDeskFieldClassName} rows={3} value={data.purpose} onChange={(e) => setData('purpose', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-700">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
