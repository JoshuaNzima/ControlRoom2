import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import Modal from '@/Components/Modal';
import IconMapper from '@/Components/IconMapper';

export default function Applicants() {
  const { auth, applications, jobs, filters }: any = usePage().props;
  const [search, setSearch] = useState<string>(filters?.search || '');
  const [status, setStatus] = useState<string>(filters?.status || '');
  const [job, setJob] = useState<string>(filters?.job || '');
  const [perPage, setPerPage] = useState<number>(filters?.per_page || 15);

  const [openCreate, setOpenCreate] = useState(false);

  const createForm: any = useForm<any>({
    job_posting_id: '',
    candidate_name: '',
    email: '',
    phone: '',
    status: 'applied',
    resume_url: '',
    notes: '',
  } as any);

  const doFilter = () => {
    router.get(route('hr.jobs.applicants'), { search, status, job, per_page: perPage }, { preserveState: true, replace: true });
  };

  const reset = () => {
    setSearch('');
    setStatus('');
    setJob('');
    setPerPage(15);
    router.get(route('hr.jobs.applicants'), {}, { preserveState: false });
  };

  const rows = useMemo(() => (applications?.data || applications || []), [applications]);
  const links = applications?.links || [];

  const updateStatus = (id: number, newStatus: string) => {
    router.put(route('hr.job-applications.update', id), { status: newStatus }, { preserveScroll: true });
  };
  const destroy = (id: number) => {
    if (!confirm('Delete this application?')) return;
    router.delete(route('hr.job-applications.destroy', id), { preserveScroll: true });
  };

  return (
    <HRLayout title="HR Applicants" user={auth?.user as any}>
      <Head title="HR Applicants" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Applicants</h1>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage candidates per job posting</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={route('hr.jobs.index')} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Jobs</Link>
              <Link href={route('hr.jobs.interviews')} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Interviews</Link>
              <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium">
                <IconMapper name="Plus" className="w-4 h-4" />
                Add Application
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate/email/phone/job" className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All Status</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={job} onChange={(e) => setJob(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All Jobs</option>
                {(jobs || []).map((j: any) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {rows.map((a: any) => (
                  <tr key={a.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{a.candidate_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{a.job?.title || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{a.email || '-'}{a.phone ? ` • ${a.phone}` : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs px-2 py-1">
                        {['applied','screening','interview','offered','hired','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{a.created_at}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => destroy(a.id)} className="inline-flex items-center gap-1 px-3 py-1 rounded border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">{applications?.from || 0}-{applications?.to || 0} of {applications?.total || 0}</div>
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
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Application</div>
          <form onSubmit={(e) => { e.preventDefault(); createForm.post(route('hr.job-applications.store'), { onSuccess: () => { setOpenCreate(false); createForm.reset(); } }); }} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Job *</label>
                <select required value={createForm.data.job_posting_id} onChange={(e) => createForm.setData('job_posting_id', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2">
                  <option value="">Select job…</option>
                  {(jobs || []).map((j: any) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Candidate Name *</label>
                <input required value={createForm.data.candidate_name} onChange={(e) => createForm.setData('candidate_name', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" value={createForm.data.email} onChange={(e) => createForm.setData('email', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Phone</label>
                <input value={createForm.data.phone} onChange={(e) => createForm.setData('phone', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Status</label>
                <select value={createForm.data.status} onChange={(e) => createForm.setData('status', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2">
                  {['applied','screening','interview','offered','hired','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Resume URL</label>
                <input value={createForm.data.resume_url} onChange={(e) => createForm.setData('resume_url', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Notes</label>
                <input value={createForm.data.notes} onChange={(e) => createForm.setData('notes', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpenCreate(false)} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Cancel</button>
              <button type="submit" disabled={createForm.processing} className="px-4 py-2 rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white">Save</button>
            </div>
          </form>
        </div>
      </Modal>
    </HRLayout>
  );
}
