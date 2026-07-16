import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

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
    <AuthenticatedLayout header="HR - Benefits & Rewards" user={auth?.user as any}>
      <Head title="Benefits" />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-rose-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="Gift" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Benefits & Rewards</h1>
                <p className="text-red-100 dark:text-gray-400 text-sm mt-1">Manage benefits catalog and enroll guards</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setEditingBenefit(null); setOpenBenefit(true); }} className="bg-indigo-600 hover:bg-indigo-700">
                <IconMapper name="FilePlus" size={16} className="mr-1" /> New Benefit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filter Card */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="sm:col-span-2">
              <div className="relative">
                <IconMapper name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Search name/code/description..." value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} className="w-full border rounded-md pl-9 pr-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm" />
              </div>
            </div>
            <input placeholder="Category" value={flt.category} onChange={(e) => setFlt((s: any) => ({ ...s, category: e.target.value }))} className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm" />
            <select value={flt.active} onChange={(e) => setFlt((s: any) => ({ ...s, active: e.target.value }))} className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm">
              <option value="">All</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
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

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Benefits Column */}
          <Card className="lg:col-span-2 p-4 dark:bg-gray-800 dark:border-gray-700">
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
          </Card>

          {/* Enrollments Column */}
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
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
          </Card>
        </div>

        <BenefitModal open={openBenefit} onClose={() => setOpenBenefit(false)} benefit={editingBenefit} />
        <EnrollModal open={openEnroll} onClose={() => setOpenEnroll(false)} guards={guards} benefit={benefitForEnroll} />
      </div>
    </AuthenticatedLayout>
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
