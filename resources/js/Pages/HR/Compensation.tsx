import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

export default function HRCompensation() {
  const { auth, bands, changes, guards = [], filters = {} } = usePage().props as any;
  const [openBand, setOpenBand] = React.useState(false);
  const [editingBand, setEditingBand] = React.useState<any | null>(null);
  const [openRequest, setOpenRequest] = React.useState(false);

  const [flt, setFlt] = React.useState<any>({ q: filters.q || '', active: filters.active ?? '', perPage: filters.perPage || 15 });
  React.useEffect(() => { setFlt({ q: filters.q || '', active: filters.active ?? '', perPage: filters.perPage || 15 }); }, [filters]);

  const applyFilters = () => router.get(route('hr.compensation.index'), { ...flt }, { preserveState: true, replace: true, preserveScroll: true });
  const resetFilters = () => { const base = { q: '', active: '', perPage: 15 }; setFlt(base); router.get(route('hr.compensation.index'), base, { preserveState: true, replace: true, preserveScroll: true }); };

  const approve = (change: any) => router.post(route('hr.compensation.changes.approve', { change: change.id }), {}, { preserveScroll: true });
  const decline = (change: any) => router.post(route('hr.compensation.changes.decline', { change: change.id }), {}, { preserveScroll: true });

  return (
    <HRLayout title="HR - Compensation" user={auth?.user as any}>
      <Head title="Compensation" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Compensation</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage salary bands and approve change requests.</p>
            </div>
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
              <button onClick={() => { setEditingBand(null); setOpenBand(true); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                <IconMapper name="FilePlus" className="w-4 h-4" /> New Band
              </button>
              <button onClick={() => setOpenRequest(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white">
                <IconMapper name="PlusCircle" className="w-4 h-4" /> Request Change
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <input placeholder="Search code/title..." value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
              </div>
              <select value={flt.active} onChange={(e) => setFlt((s: any) => ({ ...s, active: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
              <select value={flt.perPage} onChange={(e) => setFlt((s: any) => ({ ...s, perPage: Number(e.target.value) }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                {[10,15,20,30].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button onClick={applyFilters} className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white w-full">Apply</button>
                <button onClick={resetFilters} className="px-3 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 w-full">Reset</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Salary Bands</div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!bands || (bands.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No bands found.</div>
                )}
                {(bands?.data || []).map((b: any) => (
                  <div key={b.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.title} <span className="text-xs text-gray-500 dark:text-gray-400">({b.code})</span></div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{b.currency} {b.min_amount} – {b.mid_amount} – {b.max_amount}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${b.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>{b.active ? 'Active' : 'Inactive'}</span>
                        <button onClick={() => { setEditingBand(b); setOpenBand(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs"><IconMapper name="Pencil" className="w-3 h-3" /> Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {bands && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {bands.current_page} of {bands.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!bands.prev_page_url} onClick={() => router.visit(bands.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!bands.next_page_url} onClick={() => router.visit(bands.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                <span>Change Requests</span>
                <a href={route('hr.compensation.changes.export')} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs">
                  <IconMapper name="Download" className="w-3 h-3" /> Export CSV
                </a>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!changes || (changes.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No requests.</div>
                )}
                {(changes?.data || []).map((c: any) => (
                  <div key={c.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.guard?.name || 'Guard'} {c.guard?.employee_id ? `(${c.guard.employee_id})` : ''}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{c.change_type === 'band_change' ? `Band → ${c.band?.title || c.band?.code || '-'}` : `Adj → ${c.currency} ${c.amount || '-'}`} · Effective: {c.effective_date || '-'}</div>
                        {c.reason && <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">{c.reason}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${c.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' : c.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'}`}>{c.status}</span>
                        {c.status === 'pending' && (
                          <>
                            <button onClick={() => approve(c)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs"><IconMapper name="Check" className="w-3 h-3" /> Approve</button>
                            <button onClick={() => decline(c)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs"><IconMapper name="X" className="w-3 h-3" /> Decline</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {changes && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {changes.current_page} of {changes.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!changes.prev_page_url} onClick={() => router.visit(changes.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!changes.next_page_url} onClick={() => router.visit(changes.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <BandModal open={openBand} onClose={() => setOpenBand(false)} band={editingBand} />
          <RequestChangeModal open={openRequest} onClose={() => setOpenRequest(false)} guards={guards} />
        </div>
      </div>
    </HRLayout>
  );
}

function BandModal({ open, onClose, band }: { open: boolean; onClose: () => void; band: any | null }) {
  const isEdit = !!band;
  const form: any = useForm<any>({ code: band?.code || '', title: band?.title || '', min_amount: band?.min_amount || '', mid_amount: band?.mid_amount || '', max_amount: band?.max_amount || '', currency: band?.currency || 'USD', active: band?.active ?? true } as any);
  React.useEffect(() => { form.setData({ code: band?.code || '', title: band?.title || '', min_amount: band?.min_amount || '', mid_amount: band?.mid_amount || '', max_amount: band?.max_amount || '', currency: band?.currency || 'USD', active: band?.active ?? true }); }, [band]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (isEdit) { form.put(route('hr.compensation.bands.update', { band: band.id }), { onSuccess: onClose, preserveScroll: true }); } else { form.post(route('hr.compensation.bands.store'), { onSuccess: onClose, preserveScroll: true }); } };
  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Band' : 'New Band'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Code</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.code as any} onChange={(e) => form.setData('code', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.title as any} onChange={(e) => form.setData('title', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium">Min</label>
              <input type="number" step="0.01" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.min_amount as any} onChange={(e) => form.setData('min_amount', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Mid</label>
              <input type="number" step="0.01" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.mid_amount as any} onChange={(e) => form.setData('mid_amount', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Max</label>
              <input type="number" step="0.01" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.max_amount as any} onChange={(e) => form.setData('max_amount', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Currency</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.currency as any} onChange={(e) => form.setData('currency', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.data.active} onChange={(e) => form.setData('active', e.target.checked)} />
              <span>Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{form.processing ? 'Saving…' : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function RequestChangeModal({ open, onClose, guards }: { open: boolean; onClose: () => void; guards: any[] }) {
  const form: any = useForm<any>({ guard_id: '', hr_salary_band_id: '', amount: '', currency: 'USD', change_type: 'adjustment', effective_date: '', reason: '' } as any);
  const submit = (e: React.FormEvent) => { e.preventDefault(); form.post(route('hr.compensation.changes.request'), { onSuccess: onClose, preserveScroll: true }); };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Compensation Change</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Guard</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.guard_id as any} onChange={(e) => form.setData('guard_id', e.target.value)}>
              <option value="">Select guard…</option>
              {(guards || []).map((g: any) => <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>)}
            </select>
            {form.errors.guard_id && <p className="text-xs text-red-600 mt-1">{form.errors.guard_id}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Change Type</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.change_type as any} onChange={(e) => form.setData('change_type', e.target.value)}>
                <option value="adjustment">Adjustment</option>
                <option value="band_change">Band Change</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Band (if band change)</label>
              <input placeholder="Band ID (optional)" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.hr_salary_band_id as any} onChange={(e) => form.setData('hr_salary_band_id', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Amount</label>
              <input type="number" step="0.01" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.amount as any} onChange={(e) => form.setData('amount', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Currency</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.currency as any} onChange={(e) => form.setData('currency', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Effective Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.effective_date as any} onChange={(e) => form.setData('effective_date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <textarea rows={3} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.reason as any} onChange={(e) => form.setData('reason', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-slate-700 text-white hover:bg-slate-800">{form.processing ? 'Saving…' : 'Request'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
