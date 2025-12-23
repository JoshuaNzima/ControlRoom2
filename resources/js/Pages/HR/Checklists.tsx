import React, { useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

export default function HRChecklists() {
  const { auth, templates = [], assignments = [], guards = [], filters = {}, tracker } = (usePage().props as any);
  const [openAssign, setOpenAssign] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [openItem, setOpenItem] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [templateForItem, setTemplateForItem] = useState<any | null>(null);

  const [flt, setFlt] = useState<any>({
    type: (filters as any)?.type || '',
    status: (filters as any)?.status || '',
    guard_id: (filters as any)?.guard_id || '',
    q: (filters as any)?.q || '',
    due: (filters as any)?.due || '',
    sort: (filters as any)?.sort || 'created_desc',
    perPage: (filters as any)?.perPage || 10,
  });
  React.useEffect(() => {
    setFlt({
      type: (filters as any)?.type || '',
      status: (filters as any)?.status || '',
      guard_id: (filters as any)?.guard_id || '',
      q: (filters as any)?.q || '',
      due: (filters as any)?.due || '',
      sort: (filters as any)?.sort || 'created_desc',
      perPage: (filters as any)?.perPage || 10,
    });
  }, [filters]);
  const applyFilters = () => {
    router.get(route('hr.checklists.index'), { ...flt }, { preserveState: true, replace: true, preserveScroll: true });
  };
  const resetFilters = () => {
    const base = { type: '', status: '', guard_id: '', q: '', due: '', sort: 'created_desc', perPage: 10 };
    setFlt(base);
    router.get(route('hr.checklists.index'), base, { preserveState: true, replace: true, preserveScroll: true });
  };

  const onboardingCount = useMemo(() => (assignments || []).filter((a: any) => a.type === 'onboarding' && a.status === 'active').length, [assignments]);
  const offboardingCount = useMemo(() => (assignments || []).filter((a: any) => a.type === 'offboarding' && a.status === 'active').length, [assignments]);

  const markItemDone = (id: number) => {
    setCompletingId(id);
    router.patch(route('hr.checklists.items.update', { item: id }), { status: 'done' }, {
      preserveScroll: true,
      onFinish: () => setCompletingId(null),
    });
  };

  return (
    <HRLayout title="HR - Checklists" user={auth?.user as any}>
      <Head title="Checklists" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Checklists</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage onboarding and offboarding progress.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditingTemplate(null); setOpenTemplate(true); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                <IconMapper name="Plus" className="w-4 h-4" /> New Template
              </button>
              <button onClick={() => setOpenAssign(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                <IconMapper name="ClipboardCheck" className="w-4 h-4" /> Assign Checklist
              </button>
              <a href={route('hr.dashboard')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                <IconMapper name="ArrowLeft" className="w-4 h-4" /> Back
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Onboarding Active" value={onboardingCount} color="from-emerald-600 to-green-500" icon="ClipboardCheck" />
            <StatCard label="Offboarding Active" value={offboardingCount} color="from-blue-600 to-sky-500" icon="ClipboardList" />
            <StatCard label="Templates" value={(templates || []).length} color="from-slate-600 to-gray-500" icon="List" />
            <StatCard label="Assignments (recent)" value={(assignments || []).length} color="from-indigo-600 to-violet-500" icon="Users" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Templates</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(templates || []).length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No templates created.</div>
                )}
                {(templates || []).map((t: any) => (
                  <div key={t.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name} <span className="text-xs text-gray-500 dark:text-gray-400">• {t.type}</span></div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Items: {(t.items || []).length}</div>
                        <div className="mt-2 space-y-1">
                          {(t.items || []).slice(0, 4).map((it: any) => (
                            <div key={it.id} className="flex items-center justify-between gap-2">
                              <div className="text-xs text-gray-800 dark:text-gray-200">• {it.title}</div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setEditingItem(it); setTemplateForItem(t); setOpenItem(true); }} className="px-2 py-1 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">Edit</button>
                                <button onClick={() => { if (confirm('Delete item?')) router.delete(route('hr.checklist-template-items.destroy', { item: it.id }), { preserveScroll: true }); }} className="px-2 py-1 text-[10px] rounded bg-rose-600 text-white">Delete</button>
                              </div>
                            </div>
                          ))}
                          {(t.items || []).length > 4 && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">+ more…</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${t.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>{t.active ? 'Active' : 'Inactive'}</span>
                        <button onClick={() => { setTemplateForItem(t); setEditingItem(null); setOpenItem(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs"><IconMapper name="Plus" className="w-3 h-3" /> Item</button>
                        <button onClick={() => { setEditingTemplate(t); setOpenTemplate(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs"><IconMapper name="Pencil" className="w-3 h-3" /> Edit</button>
                        <button onClick={() => { if (confirm('Delete template and its items?')) router.delete(route('hr.checklist-templates.destroy', { template: t.id }), { preserveScroll: true }); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs"><IconMapper name="Trash" className="w-3 h-3" /> Del</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Assignments</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(assignments || []).length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No recent assignments.</div>
                )}
                {(assignments || []).map((a: any) => (
                  <div key={a.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.guard?.name || 'Guard'} <span className="text-xs text-gray-500 dark:text-gray-400">{a.guard?.employee_id ? `(${a.guard.employee_id})` : ''}</span></div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{a.type} · Status: {a.status} · Start: {a.start_date || '-'} · Due: {a.due_date || '-'}</div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{a.progress?.done || 0}/{a.progress?.total || 0}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {(a.items || []).slice(0, 5).map((it: any) => (
                        <div key={it.id} className="flex items-center justify-between gap-2">
                          <div className="text-xs text-gray-800 dark:text-gray-200">• {it.title}</div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${it.status === 'done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>{it.status}</span>
                            {it.status !== 'done' && (
                              <button onClick={() => markItemDone(it.id)} disabled={completingId === it.id} className="px-2 py-1 text-[10px] rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60">{completingId === it.id ? '...' : 'Done'}</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Checklist Tracker</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                <input placeholder="Search guard or ID…" value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
              </div>
              <select value={flt.type} onChange={(e) => { const v = e.target.value; setFlt((s: any) => ({ ...s, type: v })); }} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All types</option>
                <option value="onboarding">Onboarding</option>
                <option value="offboarding">Offboarding</option>
              </select>
              <select value={flt.status} onChange={(e) => setFlt((s: any) => ({ ...s, status: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <select value={flt.guard_id} onChange={(e) => setFlt((s: any) => ({ ...s, guard_id: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All guards</option>
                {(guards || []).map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>
                ))}
              </select>
              <select value={flt.due} onChange={(e) => setFlt((s: any) => ({ ...s, due: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">Any due</option>
                <option value="overdue">Overdue</option>
                <option value="due_7d">Due in 7d</option>
              </select>
              <select value={flt.sort} onChange={(e) => setFlt((s: any) => ({ ...s, sort: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="created_desc">Newest</option>
                <option value="due_asc">Due ↑</option>
                <option value="due_desc">Due ↓</option>
              </select>
              <select value={flt.perPage} onChange={(e) => setFlt((s: any) => ({ ...s, perPage: Number(e.target.value) }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                {[10,20,30,50].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button onClick={applyFilters} className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white w-full">Apply</button>
                <button onClick={resetFilters} className="px-3 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 w-full">Reset</button>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {(!tracker || (tracker.data || []).length === 0) && (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No matching checklists.</div>
              )}
              {(tracker?.data || []).map((c: any) => {
                const total = c.progress?.total || 0;
                const done = c.progress?.done || 0;
                const pct = total > 0 ? Math.round((done/total)*100) : 0;
                const overdue = (c.items || []).some((it: any) => it.status === 'pending' && it.due_date && new Date(it.due_date) < new Date());
                return (
                  <div key={c.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.guard?.name || 'Guard'} <span className="text-xs text-gray-500 dark:text-gray-400">{c.guard?.employee_id ? `(${c.guard.employee_id})` : ''}</span></div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{c.type} · Status: {c.status} · Start: {c.start_date || '-'} · Due: {c.due_date || '-'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {overdue && <span className="px-2 py-0.5 text-[10px] rounded bg-rose-600 text-white">Overdue</span>}
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{done}/{total}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full h-2 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <div className="h-2 bg-emerald-600" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        {(c.items || []).slice(0, 4).map((it: any) => (
                          <div key={it.id} className="flex items-center justify-between gap-2">
                            <div className="text-xs text-gray-800 dark:text-gray-200">• {it.title}</div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${it.status === 'done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>{it.status}</span>
                              {it.status !== 'done' && (
                                <button onClick={() => markItemDone(it.id)} disabled={completingId === it.id} className="px-2 py-1 text-[10px] rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60">{completingId === it.id ? '...' : 'Done'}</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {tracker && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-600 dark:text-gray-400">Page {tracker.current_page} of {tracker.last_page}</div>
                <div className="flex items-center gap-2">
                  <button disabled={!tracker.prev_page_url} onClick={() => router.visit(tracker.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                  <button disabled={!tracker.next_page_url} onClick={() => router.visit(tracker.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                </div>
              </div>
            )}
          </div>

          <QuickAssignModal open={openAssign} onClose={() => setOpenAssign(false)} templates={templates || []} />
          <TemplateModal open={openTemplate} onClose={() => setOpenTemplate(false)} template={editingTemplate} />
          <TemplateItemModal open={openItem} onClose={() => setOpenItem(false)} template={templateForItem} item={editingItem} />
        </div>
      </div>
    </HRLayout>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
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

function QuickAssignModal({ open, onClose, templates }: { open: boolean; onClose: () => void; templates: any[] }) {
  const form: any = useForm<any>({ guard_id: '', checklist_template_id: '', start_date: '' } as any);
  const [guards, setGuards] = useState<any[]>([]);

  React.useEffect(() => {
    if (open && guards.length === 0) {
      // attempt to reuse guards from window page props if available
      const pGuards = (usePage().props as any).guards || [];
      setGuards(pGuards);
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('hr.checklists.assign'), { onSuccess: onClose });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Checklist</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Guard</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.guard_id as any} onChange={(e) => form.setData('guard_id', e.target.value)}>
              <option value="">Select guard…</option>
              {(guards || []).map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>
              ))}
            </select>
            {form.errors.guard_id && <p className="text-xs text-red-600 mt-1">{form.errors.guard_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Template</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.checklist_template_id as any} onChange={(e) => form.setData('checklist_template_id', e.target.value)}>
              <option value="">Select template…</option>
              {(templates || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} • {t.type}</option>
              ))}
            </select>
            {form.errors.checklist_template_id && <p className="text-xs text-red-600 mt-1">{form.errors.checklist_template_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.start_date as any} onChange={(e) => form.setData('start_date', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{form.processing ? 'Assigning…' : 'Assign'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function TemplateModal({ open, onClose, template }: { open: boolean; onClose: () => void; template: any | null }) {
  const isEdit = !!template;
  const form: any = useForm<any>({
    name: template?.name || '',
    type: template?.type || 'onboarding',
    active: template?.active ?? true,
  } as any);
  React.useEffect(() => {
    form.setData({ name: template?.name || '', type: template?.type || 'onboarding', active: template?.active ?? true });
  }, [template]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      form.put(route('hr.checklist-templates.update', { template: template.id }), { onSuccess: onClose, preserveScroll: true });
    } else {
      form.post(route('hr.checklist-templates.store'), { onSuccess: onClose, preserveScroll: true });
    }
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Template' : 'New Template'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.name as any} onChange={(e) => form.setData('name', e.target.value)} />
            {form.errors.name && <p className="text-xs text-red-600 mt-1">{form.errors.name}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.type as any} onChange={(e) => form.setData('type', e.target.value)}>
                <option value="onboarding">Onboarding</option>
                <option value="offboarding">Offboarding</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.data.active} onChange={(e) => form.setData('active', e.target.checked)} />
                <span>Active</span>
              </label>
            </div>
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

function TemplateItemModal({ open, onClose, template, item }: { open: boolean; onClose: () => void; template: any | null; item: any | null }) {
  const isEdit = !!item;
  const form: any = useForm<any>({
    title: item?.title || '',
    description: item?.description || '',
    default_due_days: item?.default_due_days ?? '',
  } as any);
  React.useEffect(() => {
    form.setData({ title: item?.title || '', description: item?.description || '', default_due_days: item?.default_due_days ?? '' });
  }, [item]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!template && !isEdit) return;
    if (isEdit) {
      form.put(route('hr.checklist-template-items.update', { item: item.id }), { onSuccess: onClose, preserveScroll: true });
    } else {
      form.post(route('hr.checklist-template-items.store', { template: template.id }), { onSuccess: onClose, preserveScroll: true });
    }
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Item' : 'New Item'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.title as any} onChange={(e) => form.setData('title', e.target.value)} />
            {form.errors.title && <p className="text-xs text-red-600 mt-1">{form.errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" rows={3} value={form.data.description as any} onChange={(e) => form.setData('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Default Due Days</label>
            <input type="number" min={0} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.default_due_days as any} onChange={(e) => form.setData('default_due_days', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{form.processing ? 'Saving…' : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
