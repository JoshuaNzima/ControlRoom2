import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import Modal from '@/Components/Modal';
import IconMapper from '@/Components/IconMapper';

export default function Interviews() {
  const { auth, interviews, applications, filters }: any = usePage().props;
  const [status, setStatus] = useState<string>(filters?.status || '');
  const [from, setFrom] = useState<string>(filters?.from || '');
  const [to, setTo] = useState<string>(filters?.to || '');
  const [perPage, setPerPage] = useState<number>(filters?.per_page || 15);

  const [openCreate, setOpenCreate] = useState(false);

  const createForm: any = useForm<any>({
    job_application_id: '',
    scheduled_at: '',
    interviewer_id: '',
    mode: 'in_person',
    location_or_link: '',
    notes: '',
  } as any);

  const doFilter = () => {
    router.get(route('hr.jobs.interviews'), { status, from, to, per_page: perPage }, { preserveState: true, replace: true });
  };

  const reset = () => {
    setStatus('');
    setFrom('');
    setTo('');
    setPerPage(15);
    router.get(route('hr.jobs.interviews'), {}, { preserveState: false });
  };

  const rows = useMemo(() => (interviews?.data || interviews || []), [interviews]);
  const links = interviews?.links || [];

  const update = (id: number, data: any) => {
    router.put(route('hr.interviews.update', id), data, { preserveScroll: true });
  };
  const destroy = (id: number) => {
    if (!confirm('Delete this interview?')) return;
    router.delete(route('hr.interviews.destroy', id), { preserveScroll: true });
  };

  return (
    <HRLayout title="HR Interviews" user={auth?.user as any}>
      <Head title="HR Interviews" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Schedule and track interviews</div>
            </div>
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
              <Link href={route('hr.jobs.index')} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Jobs</Link>
              <Link href={route('hr.jobs.applicants')} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Applicants</Link>
              <a href={route('hr.jobs.interviews.export', { status, from, to })} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Export CSV</a>
              <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium">
                <IconMapper name="Calendar" className="w-4 h-4" />
                Schedule Interview
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="done">Done</option>
                <option value="no_show">No show</option>
                <option value="canceled">Canceled</option>
              </select>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
              <select value={perPage} onChange={(e) => setPerPage(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {[15,25,50].map((n) => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={doFilter} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Filter</button>
                <button onClick={reset} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">When</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {rows.map((iv: any) => (
                  <tr key={iv.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{iv.candidate?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{iv.candidate?.job?.title || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{iv.scheduled_at}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{iv.mode}{iv.location_or_link ? ` • ${iv.location_or_link}` : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select value={iv.status} onChange={(e) => update(iv.id, { status: e.target.value })} className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs px-2 py-1">
                        {['scheduled','done','no_show','canceled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => destroy(iv.id)} className="inline-flex items-center gap-1 px-3 py-1 rounded border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">{interviews?.from || 0}-{interviews?.to || 0} of {interviews?.total || 0}</div>
            <div className="flex items-center gap-2">
              {(links || []).map((l: any, i: number) => (
                <button key={i} disabled={!l.url} onClick={() => l.url && router.get(l.url, {}, { preserveState: true, replace: true })} className={`px-3 py-1.5 rounded-md text-sm ${l.active ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'} ${!l.url ? 'opacity-50 cursor-not-allowed' : ''}`}>{l.label.replace('&laquo;','«').replace('&raquo;','»')}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal show={openCreate} onClose={() => setOpenCreate(false)} maxWidth="2xl">
        <div className="p-6">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Schedule Interview</div>
          <form onSubmit={(e) => { e.preventDefault(); createForm.post(route('hr.interviews.store'), { onSuccess: () => { setOpenCreate(false); createForm.reset(); } }); }} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Application *</label>
                <select required value={createForm.data.job_application_id} onChange={(e) => createForm.setData('job_application_id', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2">
                  <option value="">Select application…</option>
                  {(applications || []).map((a: any) => (
                    <option key={a.id} value={a.id}>{a.candidate_name}{a.job?.title ? ` • ${a.job.title}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">When *</label>
                <input type="datetime-local" required value={createForm.data.scheduled_at} onChange={(e) => createForm.setData('scheduled_at', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Mode</label>
                <select value={createForm.data.mode} onChange={(e) => createForm.setData('mode', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2">
                  <option value="in_person">In person</option>
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Location/Link</label>
                <input value={createForm.data.location_or_link} onChange={(e) => createForm.setData('location_or_link', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Notes</label>
              <textarea value={createForm.data.notes} onChange={(e) => createForm.setData('notes', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 min-h-[90px]" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpenCreate(false)} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Cancel</button>
              <button type="submit" disabled={createForm.processing} className="px-4 py-2 rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white">Schedule</button>
            </div>
          </form>
        </div>
      </Modal>
    </HRLayout>
  );
}
