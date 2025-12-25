import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';

interface Scheme { id: number; name: string; provider?: string|null; plan?: string|null; status: string; created_at?: string }
interface Membership { id: number; member_no?: string|null; status: string; start_date?: string|null; end_date?: string|null; scheme?: { id: number; name: string } | null; guard?: { id: number; name: string; employee_id?: string|null } | null; created_at?: string }
interface Paginated<T> { data: T[]; links: any[]; meta: any }
interface GuardOpt { id: number; name: string; employee_id?: string|null }

export default function Medical() {
  const { auth, schemes, memberships, guards, filters }: any = usePage().props;
  const [schemeSearch, setSchemeSearch] = useState<string>(filters?.scheme_search || '');
  const [schemeStatus, setSchemeStatus] = useState<string>(filters?.scheme_status || '');
  const [filterSchemeId, setFilterSchemeId] = useState<number>(filters?.scheme_id || 0);
  const [memberStatus, setMemberStatus] = useState<string>(filters?.member_status || '');
  const [memberSearch, setMemberSearch] = useState<string>(filters?.member_search || '');
  const [perPage, setPerPage] = useState<number>(filters?.per_page || 15);
  const [createSchemeOpen, setCreateSchemeOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [editScheme, setEditScheme] = useState<Scheme | null>(null);

  const schemeRows: Scheme[] = useMemo(() => (schemes?.data || schemes || []), [schemes]);
  const membershipRows: Membership[] = useMemo(() => (memberships?.data || memberships || []), [memberships]);

  const doFilter = () => router.get(route('hr.medical.index'), { scheme_search: schemeSearch, scheme_status: schemeStatus, scheme_id: filterSchemeId, member_status: memberStatus, member_search: memberSearch, per_page: perPage }, { preserveState: true, replace: true });
  const reset = () => router.get(route('hr.medical.index'), {}, { preserveState: false });

  return (
    <HRLayout title="Medical Schemes" user={auth?.user as any}>
      <Head title="Medical Schemes" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Medical Schemes</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Manage medical schemes and guard memberships.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a href={route('hr.medical.memberships.export', { scheme_id: filterSchemeId, member_status: memberStatus, member_search: memberSearch })} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700">Export Memberships</a>
              <button onClick={() => setEnrollOpen(true)} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700">Enroll Member</button>
              <button onClick={() => setCreateSchemeOpen(true)} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700">New Scheme</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="grid grid-cols-1 gap-3">
                  <input placeholder="Search schemes" value={schemeSearch} onChange={(e)=>setSchemeSearch(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                  <select value={schemeStatus} onChange={(e)=>setSchemeStatus(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="flex gap-3">
                    <button onClick={doFilter} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Filter</button>
                    <button onClick={reset} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Provider/Plan</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {schemeRows.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{s.name}</td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{[s.provider, s.plan].filter(Boolean).join(' / ') || '—'}</td>
                          <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">{s.status}</span></td>
                          <td className="px-4 py-2 text-right">
                            <div className="inline-flex gap-2">
                              <button onClick={()=>setEditScheme(s)} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Edit</button>
                              <button onClick={()=>{ if(confirm('Delete scheme?')) router.delete(route('hr.medical.schemes.destroy', s.id)); }} className="text-red-600 hover:text-red-800">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(schemes?.meta?.last_page ?? 1) > 1 && (
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-center gap-2">
                    {(schemes?.links ?? []).map((link: any, idx: number) => (
                      <Link key={idx} href={link.url || '#'} className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <select value={filterSchemeId} onChange={(e)=>setFilterSchemeId(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value={0}>All Schemes</option>
                    {schemeRows.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={memberStatus} onChange={(e)=>setMemberStatus(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input placeholder="Search guard" value={memberSearch} onChange={(e)=>setMemberSearch(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 md:col-span-2" />
                  <select value={perPage} onChange={(e)=>setPerPage(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    {[15,25,50].map(n => <option key={n} value={n}>{n}/page</option>)}
                  </select>
                  <div className="flex gap-3 md:col-span-5">
                    <button onClick={doFilter} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Filter</button>
                    <button onClick={reset} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left">Guard</th>
                      <th className="px-4 py-2 text-left">Scheme</th>
                      <th className="px-4 py-2 text-left">Member No</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Period</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {membershipRows.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{m.guard?.name} <span className="text-xs text-gray-500 dark:text-gray-400">{m.guard?.employee_id}</span></td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{m.scheme?.name}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{m.member_no || '—'}</td>
                        <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">{m.status}</span></td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{m.start_date || '—'} — {m.end_date || '—'}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex gap-2">
                            <Link href={route('hr.medical.memberships.update', m.id)} method="put" as="button" data={{ status: m.status === 'active' ? 'inactive' : 'active' }} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Toggle</Link>
                            <button onClick={()=>{ if (confirm('Delete membership?')) router.delete(route('hr.medical.memberships.destroy', m.id)); }} className="text-red-600 hover:text-red-800">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(memberships?.meta?.last_page ?? 1) > 1 && (
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-center gap-2">
                    {(memberships?.links ?? []).map((link: any, idx: number) => (
                      <Link key={idx} href={link.url || '#'} className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <SchemeModal open={createSchemeOpen || !!editScheme} onClose={()=>{ setCreateSchemeOpen(false); setEditScheme(null); }} scheme={editScheme || undefined} />
          <EnrollModal open={enrollOpen} onClose={()=>setEnrollOpen(false)} guards={guards || []} schemes={(schemes?.data || schemes || [])} />
        </div>
      </div>
    </HRLayout>
  );
}

function SchemeModal({ open, onClose, scheme }: { open: boolean; onClose: () => void; scheme?: Scheme }) {
  const { data, setData, post, put, processing, errors, reset } = useForm<{ name: string; provider: string; plan: string; status: string }>({
    name: scheme?.name || '',
    provider: scheme?.provider || '',
    plan: scheme?.plan || '',
    status: scheme?.status || 'active',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scheme) {
      put(route('hr.medical.schemes.update', scheme.id), { onSuccess: () => { reset(); onClose(); } });
    } else {
      post(route('hr.medical.schemes.store'), { onSuccess: () => { reset(); onClose(); } });
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:m-auto md:max-w-xl bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{scheme ? 'Edit Scheme' : 'New Scheme'}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={submit} className="px-6 py-4 grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.name} onChange={(e)=>setData('name', e.target.value)} required />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.provider} onChange={(e)=>setData('provider', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.plan} onChange={(e)=>setData('plan', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.status} onChange={(e)=>setData('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EnrollModal({ open, onClose, guards, schemes }: { open: boolean; onClose: () => void; guards: GuardOpt[]; schemes: Scheme[] }) {
  const { data, setData, post, processing, reset, errors } = useForm<{ hr_medical_scheme_id: number|''; guard_id: number|''; start_date: string; end_date: string; member_no: string; status: string }>({
    hr_medical_scheme_id: '' as any,
    guard_id: '' as any,
    start_date: '',
    end_date: '',
    member_no: '',
    status: 'active',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('hr.medical.memberships.store'), { onSuccess: () => { reset(); onClose(); } });
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:m-auto md:max-w-xl bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enroll Member</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={submit} className="px-6 py-4 grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheme</label>
            <select required className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.hr_medical_scheme_id as any} onChange={(e) => setData('hr_medical_scheme_id', e.target.value ? Number(e.target.value) : '' as any)}>
              <option value="">Select scheme…</option>
              {schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.hr_medical_scheme_id && <p className="text-xs text-red-600 mt-1">{errors.hr_medical_scheme_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guard</label>
            <select required className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.guard_id as any} onChange={(e) => setData('guard_id', e.target.value ? Number(e.target.value) : '' as any)}>
              <option value="">Select guard…</option>
              {guards.map((g) => <option key={g.id} value={g.id}>{g.name} {g.employee_id ? `• ${g.employee_id}` : ''}</option>)}
            </select>
            {errors.guard_id && <p className="text-xs text-red-600 mt-1">{errors.guard_id}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.start_date} onChange={(e)=>setData('start_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.end_date} onChange={(e)=>setData('end_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Member No</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.member_no} onChange={(e)=>setData('member_no', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.status} onChange={(e)=>setData('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400">Enroll</button>
          </div>
        </form>
      </div>
    </div>
  );
}
