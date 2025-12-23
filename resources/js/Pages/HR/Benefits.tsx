import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

export default function HRBenefits() {
  const { auth, benefits, enrollments, guards = [], filters = {} } = usePage().props as any;
  const [openBenefit, setOpenBenefit] = React.useState(false);
  const [editingBenefit, setEditingBenefit] = React.useState<any | null>(null);
  const [openEnroll, setOpenEnroll] = React.useState(false);
  const [benefitForEnroll, setBenefitForEnroll] = React.useState<any | null>(null);

  const [flt, setFlt] = React.useState<any>({
    q: filters.q || '',
    category: filters.category || '',
    active: filters.active ?? '',
    perPage: filters.perPage || 15,
  });
  React.useEffect(() => {
    setFlt({ q: filters.q || '', category: filters.category || '', active: filters.active ?? '', perPage: filters.perPage || 15 });
  }, [filters]);

  const applyFilters = () => router.get(route('hr.benefits.index'), { ...flt }, { preserveState: true, replace: true, preserveScroll: true });
  const resetFilters = () => { const base = { q: '', category: '', active: '', perPage: 15 }; setFlt(base); router.get(route('hr.benefits.index'), base, { preserveState: true, replace: true, preserveScroll: true }); };

  const cancelEnrollment = (en: any) => {
    if (!confirm('Cancel this enrollment?')) return;
    router.post(route('hr.benefits.enrollments.cancel', { enrollment: en.id }), {}, { preserveScroll: true });
  };

  return (
    <HRLayout title="HR - Benefits & Rewards" user={auth?.user as any}>
      <Head title="Benefits" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Benefits & Rewards</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage benefits catalog and enroll guards.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditingBenefit(null); setOpenBenefit(true); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                <IconMapper name="FilePlus" className="w-4 h-4" /> New Benefit
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <input placeholder="Search name/code/description..." value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
              </div>
              <input placeholder="Category" value={flt.category} onChange={(e) => setFlt((s: any) => ({ ...s, category: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
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
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Benefits</div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!benefits || (benefits.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No benefits found.</div>
                )}
                {(benefits?.data || []).map((b: any) => (
                  <div key={b.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.name} <span className="text-xs text-gray-500 dark:text-gray-400">({b.code})</span></div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{b.category || '—'} · {b.start_date || '-'} → {b.end_date || '-'}</div>
                        {b.description && <div className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{b.description}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${b.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>{b.active ? 'Active' : 'Inactive'}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Enrolled: {b.enrollments_count || 0}</span>
                        <button onClick={() => { setEditingBenefit(b); setOpenBenefit(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs"><IconMapper name="Pencil" className="w-3 h-3" /> Edit</button>
                        <button onClick={() => { setBenefitForEnroll(b); setOpenEnroll(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"><IconMapper name="UserPlus" className="w-3 h-3" /> Enroll</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {benefits && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {benefits.current_page} of {benefits.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!benefits.prev_page_url} onClick={() => router.visit(benefits.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!benefits.next_page_url} onClick={() => router.visit(benefits.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                <span>Recent Enrollments</span>
                <a href={route('hr.benefits.enrollments.export')} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs">
                  <IconMapper name="Download" className="w-3 h-3" /> Export CSV
                </a>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!enrollments || (enrollments.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No enrollments.</div>
                )}
                {(enrollments?.data || []).map((en: any) => (
                  <div key={en.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{en.guard?.name || 'Guard'} {en.guard?.employee_id ? `(${en.guard.employee_id})` : ''}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{en.benefit?.name || 'Benefit'} · {en.start_date || '-'} → {en.end_date || '-'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${en.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>{en.status}</span>
                        {en.status === 'active' && (
                          <button onClick={() => cancelEnrollment(en)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs"><IconMapper name="X" className="w-3 h-3" /> Cancel</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {enrollments && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {enrollments.current_page} of {enrollments.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!enrollments.prev_page_url} onClick={() => router.visit(enrollments.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!enrollments.next_page_url} onClick={() => router.visit(enrollments.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <BenefitModal open={openBenefit} onClose={() => setOpenBenefit(false)} benefit={editingBenefit} />
          <EnrollModal open={openEnroll} onClose={() => setOpenEnroll(false)} guards={guards} benefit={benefitForEnroll} />
        </div>
      </div>
    </HRLayout>
  );
}

function BenefitModal({ open, onClose, benefit }: { open: boolean; onClose: () => void; benefit: any | null }) {
  const isEdit = !!benefit;
  const form: any = useForm<any>({
    name: benefit?.name || '',
    code: benefit?.code || '',
    category: benefit?.category || '',
    active: benefit?.active ?? true,
    description: benefit?.description || '',
    start_date: benefit?.start_date || '',
    end_date: benefit?.end_date || '',
  } as any);
  React.useEffect(() => {
    form.setData({ name: benefit?.name || '', code: benefit?.code || '', category: benefit?.category || '', active: benefit?.active ?? true, description: benefit?.description || '', start_date: benefit?.start_date || '', end_date: benefit?.end_date || '' });
  }, [benefit]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      form.put(route('hr.benefits.update', { benefit: benefit.id }), { onSuccess: onClose, preserveScroll: true });
    } else {
      form.post(route('hr.benefits.store'), { onSuccess: onClose, preserveScroll: true });
    }
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Benefit' : 'New Benefit'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.name as any} onChange={(e) => form.setData('name', e.target.value)} />
              {form.errors.name && <p className="text-xs text-red-600 mt-1">{form.errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Code</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.code as any} onChange={(e) => form.setData('code', e.target.value)} />
              {form.errors.code && <p className="text-xs text-red-600 mt-1">{form.errors.code}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Category</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.category as any} onChange={(e) => form.setData('category', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.start_date as any} onChange={(e) => form.setData('start_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.end_date as any} onChange={(e) => form.setData('end_date', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.data.active} onChange={(e) => form.setData('active', e.target.checked)} />
              <span>Active</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea rows={4} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.description as any} onChange={(e) => form.setData('description', e.target.value)} />
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

function EnrollModal({ open, onClose, guards, benefit }: { open: boolean; onClose: () => void; guards: any[]; benefit: any | null }) {
  const form: any = useForm<any>({ guard_id: '', start_date: '' } as any);
  React.useEffect(() => { form.setData({ guard_id: '', start_date: '' }); }, [benefit]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!benefit) return; form.post(route('hr.benefits.enroll', { benefit: benefit.id }), { onSuccess: onClose, preserveScroll: true }); };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enroll Guard</h2>
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
            <label className="block text-sm font-medium">Start Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.start_date as any} onChange={(e) => form.setData('start_date', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{form.processing ? 'Saving…' : 'Enroll'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
