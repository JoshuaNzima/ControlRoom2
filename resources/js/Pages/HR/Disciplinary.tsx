import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

export default function DisciplinaryPage() {
  const { auth, cases, guards = [], stats = {}, filters = {} } = usePage().props as any;
  const [openNew, setOpenNew] = React.useState(false);
  const [openSchedule, setOpenSchedule] = React.useState(false);
  const [openOutcome, setOpenOutcome] = React.useState(false);
  const [activeCase, setActiveCase] = React.useState<any | null>(null);

  const [flt, setFlt] = React.useState<any>({
    q: filters.q || '',
    status: filters.status || '',
    type: filters.type || '',
    guard_id: filters.guard_id || '',
    perPage: filters.perPage || 15,
  });
  React.useEffect(() => {
    setFlt({ q: filters.q || '', status: filters.status || '', type: filters.type || '', guard_id: filters.guard_id || '', perPage: filters.perPage || 15 });
  }, [filters]);

  const applyFilters = () => router.get(route('hr.disciplinary.index'), { ...flt }, { preserveState: true, replace: true, preserveScroll: true });
  const resetFilters = () => { const base = { q: '', status: '', type: '', guard_id: '', perPage: 15 }; setFlt(base); router.get(route('hr.disciplinary.index'), base, { preserveState: true, replace: true, preserveScroll: true }); };

  const closeCase = (c: any) => {
    if (!confirm('Close this case?')) return;
    router.post(route('hr.disciplinary.close', { case: c.id }), {}, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout header="HR - Disciplinary" user={auth?.user as any}>
      <Head title="Disciplinary" />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-rose-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="Scale" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Disciplinary & Grievance</h1>
                <p className="text-red-100 dark:text-gray-400 text-sm mt-1">Track cases, schedule hearings, and record outcomes</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setOpenNew(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <IconMapper name="FilePlus" size={16} className="mr-1" /> New Case
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Open" value={stats.open || 0} color="from-rose-600 to-red-500" icon="AlertTriangle" />
          <MiniStat label="Closed" value={stats.closed || 0} color="from-emerald-600 to-green-500" icon="CheckCircle" />
          <MiniStat label="Per Page" value={flt.perPage} color="from-slate-600 to-gray-500" icon="List" />
          <MiniStat label="Total" value={cases?.total ?? '—'} color="from-indigo-600 to-violet-500" icon="BarChart3" />
        </div>

        {/* Filter Card */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="sm:col-span-2">
              <div className="relative">
                <IconMapper name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Search case/guard/type..." value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} className="w-full border rounded-md pl-9 pr-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm" />
              </div>
            </div>
            <select value={flt.status} onChange={(e) => setFlt((s: any) => ({ ...s, status: e.target.value }))} className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm">
              <option value="">All status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <input placeholder="Type (e.g. misconduct)" value={flt.type} onChange={(e) => setFlt((s: any) => ({ ...s, type: e.target.value }))} className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm" />
            <select value={flt.guard_id} onChange={(e) => setFlt((s: any) => ({ ...s, guard_id: e.target.value }))} className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm">
              <option value="">All guards</option>
              {(guards || []).map((g: any) => <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>)}
            </select>
            <select value={flt.perPage} onChange={(e) => setFlt((s: any) => ({ ...s, perPage: Number(e.target.value) }))} className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm">
              {[10,15,20,30].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">Apply</Button>
              <Button onClick={resetFilters} variant="ghost">Reset</Button>
            </div>
          </div>
        </Card>

        {/* Cases Card */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {(!cases || (cases.data || []).length === 0) && (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No cases found.</div>
              )}
              {(cases?.data || []).map((c: any) => (
                <div key={c.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.case_no} · {c.guard?.name || 'Guard'} {c.guard?.employee_id ? `(${c.guard.employee_id})` : ''}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{c.type} · {c.stage || '—'} · Opened: {c.opened_at || '-'} · Next hearing: {c.next_hearing_at || '-'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${c.status === 'open' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'}`}>{c.status}</span>
                      {c.status === 'open' && (
                        <>
                          <button onClick={() => { setActiveCase(c); setOpenSchedule(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs"><IconMapper name="calendar" className="w-3 h-3" /> Schedule</button>
                          <button onClick={() => { setActiveCase(c); setOpenOutcome(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"><IconMapper name="check-circle" className="w-3 h-3" /> Outcome</button>
                          <button onClick={() => closeCase(c)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs"><IconMapper name="lock" className="w-3 h-3" /> Close</button>
                        </>
                      )}
                    </div>
                  </div>
                  {c.description && <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">{c.description}</div>}
                </div>
              ))}
            </div>

            {cases && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-600 dark:text-gray-400">Page {cases.current_page} of {cases.last_page}</div>
                <div className="flex items-center gap-2">
                  <button disabled={!cases.prev_page_url} onClick={() => router.visit(cases.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                  <button disabled={!cases.next_page_url} onClick={() => router.visit(cases.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                </div>
              </div>
            )}
        </Card>

        <NewCaseModal open={openNew} onClose={() => setOpenNew(false)} guards={guards} />
        <ScheduleModal open={openSchedule} onClose={() => setOpenSchedule(false)} current={activeCase} />
        <OutcomeModal open={openOutcome} onClose={() => setOpenOutcome(false)} current={activeCase} />
      </div>
    </AuthenticatedLayout>
  );
}

function MiniStat({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white`}>
          <IconMapper name={icon} className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
        </div>
      </div>
    </div>
  );
}

function NewCaseModal({ open, onClose, guards }: { open: boolean; onClose: () => void; guards: any[] }) {
  const form: any = useForm<any>({ guard_id: '', type: '', description: '', opened_at: '' } as any);
  const submit = (e: React.FormEvent) => { e.preventDefault(); form.post(route('hr.disciplinary.store'), { onSuccess: onClose, preserveScroll: true }); };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Disciplinary Case</h2>
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
          <div>
            <label className="block text-sm font-medium">Type</label>
            <input placeholder="e.g. misconduct, lateness" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.type as any} onChange={(e) => form.setData('type', e.target.value)} />
            {form.errors.type && <p className="text-xs text-red-600 mt-1">{form.errors.type}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Opened At</label>
            <input type="datetime-local" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.opened_at as any} onChange={(e) => form.setData('opened_at', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea rows={4} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.description as any} onChange={(e) => form.setData('description', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{form.processing ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ScheduleModal({ open, onClose, current }: { open: boolean; onClose: () => void; current: any | null }) {
  const form: any = useForm<any>({ next_hearing_at: '', stage: current?.stage || '' } as any);
  React.useEffect(() => { form.setData({ next_hearing_at: '', stage: current?.stage || '' }); }, [current]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!current) return; form.post(route('hr.disciplinary.schedule', { case: current.id }), { onSuccess: onClose, preserveScroll: true }); };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Schedule Hearing</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Hearing At</label>
            <input type="datetime-local" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.next_hearing_at as any} onChange={(e) => form.setData('next_hearing_at', e.target.value)} />
            {form.errors.next_hearing_at && <p className="text-xs text-red-600 mt-1">{form.errors.next_hearing_at}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Stage (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.stage as any} onChange={(e) => form.setData('stage', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-slate-700 text-white hover:bg-slate-800">{form.processing ? 'Saving…' : 'Schedule'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function OutcomeModal({ open, onClose, current }: { open: boolean; onClose: () => void; current: any | null }) {
  const form: any = useForm<any>({ outcome_type: '', outcome: '', corrective_actions: '' } as any);
  React.useEffect(() => { form.setData({ outcome_type: '', outcome: '', corrective_actions: '' }); }, [current]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!current) return; form.post(route('hr.disciplinary.outcome', { case: current.id }), { onSuccess: onClose, preserveScroll: true }); };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Record Outcome</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Outcome Type</label>
            <input placeholder="e.g. warning, suspension" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.outcome_type as any} onChange={(e) => form.setData('outcome_type', e.target.value)} />
            {form.errors.outcome_type && <p className="text-xs text-red-600 mt-1">{form.errors.outcome_type}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Outcome Notes</label>
            <textarea rows={3} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.outcome as any} onChange={(e) => form.setData('outcome', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Corrective Actions</label>
            <textarea rows={3} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.corrective_actions as any} onChange={(e) => form.setData('corrective_actions', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{form.processing ? 'Saving…' : 'Save Outcome'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
