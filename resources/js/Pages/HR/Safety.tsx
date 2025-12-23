import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

export default function HRSafety() {
  const { auth, incidents, nearMisses, guards = [], filters = {} } = usePage().props as any;
  const [openIncident, setOpenIncident] = React.useState(false);
  const [openNearMiss, setOpenNearMiss] = React.useState(false);

  const [flt, setFlt] = React.useState<any>({ q: filters.q || '', type: filters.type || '', status: filters.status || '', perPage: filters.perPage || 15 });
  React.useEffect(() => { setFlt({ q: filters.q || '', type: filters.type || '', status: filters.status || '', perPage: filters.perPage || 15 }); }, [filters]);

  const applyFilters = () => router.get(route('hr.safety.index'), { ...flt }, { preserveState: true, replace: true, preserveScroll: true });
  const resetFilters = () => { const base = { q: '', type: '', status: '', perPage: 15 }; setFlt(base); router.get(route('hr.safety.index'), base, { preserveState: true, replace: true, preserveScroll: true }); };

  const resolveIncident = (inc: any) => { if (!confirm('Resolve this incident?')) return; router.post(route('hr.safety.incidents.resolve', { incident: inc.id }), {}, { preserveScroll: true }); };

  return (
    <HRLayout title="HR - Safety" user={auth?.user as any}>
      <Head title="Safety" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Safety</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Report incidents and near-misses. Track and resolve.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setOpenNearMiss(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white">
                <IconMapper name="AlertCircle" className="w-4 h-4" /> Near-miss
              </button>
              <button onClick={() => setOpenIncident(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">
                <IconMapper name="OctagonAlert" className="w-4 h-4" /> Incident
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <input placeholder="Search site/type/notes..." value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
              </div>
              <input placeholder="Type" value={flt.type} onChange={(e) => setFlt((s: any) => ({ ...s, type: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
              <select value={flt.status} onChange={(e) => setFlt((s: any) => ({ ...s, status: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
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
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                <span>Incidents</span>
                <a href={route('hr.safety.incidents.export')} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs">
                  <IconMapper name="Download" className="w-3 h-3" /> Export CSV
                </a>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!incidents || (incidents.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No incidents.</div>
                )}
                {(incidents?.data || []).map((it: any) => (
                  <div key={it.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{it.type} · {it.severity || '—'} · {it.site || '—'}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{it.occurred_at || '-'} {it.guard ? `· ${it.guard.name}${it.guard.employee_id ? ` (${it.guard.employee_id})` : ''}` : ''}</div>
                        {it.notes && <div className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{it.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${it.status === 'open' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'}`}>{it.status}</span>
                        {it.status === 'open' && (
                          <button onClick={() => resolveIncident(it)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs"><IconMapper name="Check" className="w-3 h-3" /> Resolve</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {incidents && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {incidents.current_page} of {incidents.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!incidents.prev_page_url} onClick={() => router.visit(incidents.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!incidents.next_page_url} onClick={() => router.visit(incidents.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                <span>Near-misses</span>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!nearMisses || (nearMisses.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No near-misses.</div>
                )}
                {(nearMisses?.data || []).map((nm: any) => (
                  <div key={nm.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{nm.site || '—'}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{nm.description}</div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{nm.occurred_at || '-'}</div>
                    </div>
                  </div>
                ))}
              </div>
              {nearMisses && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {nearMisses.current_page} of {nearMisses.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!nearMisses.prev_page_url} onClick={() => router.visit(nearMisses.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!nearMisses.next_page_url} onClick={() => router.visit(nearMisses.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <IncidentModal open={openIncident} onClose={() => setOpenIncident(false)} guards={guards} />
          <NearMissModal open={openNearMiss} onClose={() => setOpenNearMiss(false)} />
        </div>
      </div>
    </HRLayout>
  );
}

function IncidentModal({ open, onClose, guards }: { open: boolean; onClose: () => void; guards: any[] }) {
  const form: any = useForm<any>({ guard_id: '', site: '', type: '', severity: '', occurred_at: '', notes: '' } as any);
  const submit = (e: React.FormEvent) => { e.preventDefault(); form.post(route('hr.safety.incidents.store'), { onSuccess: onClose, preserveScroll: true }); };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Report Incident</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Guard (optional)</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.guard_id as any} onChange={(e) => form.setData('guard_id', e.target.value)}>
              <option value="">—</option>
              {(guards || []).map((g: any) => <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Site</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.site as any} onChange={(e) => form.setData('site', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.type as any} onChange={(e) => form.setData('type', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Severity</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.severity as any} onChange={(e) => form.setData('severity', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Occurred At</label>
              <input type="datetime-local" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.occurred_at as any} onChange={(e) => form.setData('occurred_at', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea rows={3} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.notes as any} onChange={(e) => form.setData('notes', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700">{form.processing ? 'Saving…' : 'Report'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function NearMissModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const form: any = useForm<any>({ site: '', description: '', occurred_at: '' } as any);
  const submit = (e: React.FormEvent) => { e.preventDefault(); form.post(route('hr.safety.near-misses.store'), { onSuccess: onClose, preserveScroll: true }); };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Record Near-miss</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Site</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.site as any} onChange={(e) => form.setData('site', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea rows={3} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.description as any} onChange={(e) => form.setData('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Occurred At</label>
            <input type="datetime-local" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.occurred_at as any} onChange={(e) => form.setData('occurred_at', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-slate-700 text-white hover:bg-slate-800">{form.processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
