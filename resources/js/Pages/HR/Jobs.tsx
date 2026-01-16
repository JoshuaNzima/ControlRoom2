import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import Modal from '@/Components/Modal';
import IconMapper from '@/Components/IconMapper';

interface JobPosting {
  id: number;
  title: string;
  location?: string;
  type: string;
  status: 'draft' | 'published';
  posted_at?: string | null;
  apply_email?: string | null;
}

export default function HRJobs() {
  const { auth, jobs, filters }: any = usePage().props;
  const [search, setSearch] = useState<string>(filters?.search || '');
  const [status, setStatus] = useState<string>(filters?.status || '');

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<JobPosting | null>(null);

  const createForm = useForm({
    title: '',
    location: '',
    type: 'Full-time',
    status: 'draft' as 'draft' | 'published',
    apply_email: '',
    description: '',
    requirements: '',
  });

  const editForm = useForm({
    title: '',
    location: '',
    type: 'Full-time',
    status: 'draft' as 'draft' | 'published',
    apply_email: '',
    description: '',
    requirements: '',
  });

  const doFilter = () => {
    router.get(route('hr.jobs.index'), { search, status }, { preserveState: true, replace: true });
  };

  const onOpenEdit = (job: JobPosting) => {
    setOpenEdit(job);
    editForm.setData({
      title: job.title || '',
      location: job.location || '',
      type: job.type || 'Full-time',
      status: job.status || 'draft',
      apply_email: job.apply_email || '',
      description: (job as any).description || '',
      requirements: (job as any).requirements || '',
    });
  };

  const publish = (job: JobPosting) => {
    router.post(route('hr.jobs.publish', job.id), {}, { preserveScroll: true });
  };

  const unpublish = (job: JobPosting) => {
    router.post(route('hr.jobs.unpublish', job.id), {}, { preserveScroll: true });
  };

  const destroy = (job: JobPosting) => {
    if (!confirm('Delete this job posting?')) return;
    router.delete(route('hr.jobs.destroy', job.id), { preserveScroll: true });
  };

  const jobsData: JobPosting[] = useMemo(() => (jobs?.data || jobs || []), [jobs]);

  return (
    <HRLayout title="HR Careers" user={auth?.user as any}>
      <Head title="HR Careers" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Careers</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage public job postings</p>
            </div>
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
              <Link href={route('hr.jobs.applicants')} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Applicants</Link>
              <Link href={route('hr.jobs.interviews')} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Interviews</Link>
              <a href={route('hr.jobs.export', { search, status })} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Export CSV</a>
              <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium">
                <IconMapper name="Plus" className="w-4 h-4" />
                New Job
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or location"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <div className="flex gap-3">
                <button onClick={doFilter} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Filter</button>
                <button onClick={() => { setSearch(''); setStatus(''); router.get(route('hr.jobs.index'), {}, { preserveState: false }); }} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Posted</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {jobsData.map((job: JobPosting) => (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{job.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{job.location || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{job.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${job.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'}`}>{job.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {job.status === 'published' ? (
                          <button onClick={() => unpublish(job)} className="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200">Unpublish</button>
                        ) : (
                          <button onClick={() => publish(job)} className="inline-flex items-center gap-1 px-3 py-1 rounded bg-green-600 text-white">Publish</button>
                        )}
                        <button onClick={() => onOpenEdit(job)} className="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200">Edit</button>
                        <button onClick={() => destroy(job)} className="inline-flex items-center gap-1 px-3 py-1 rounded border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal show={openCreate} onClose={() => setOpenCreate(false)} maxWidth="2xl">
        <div className="p-6">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Job Posting</div>
          <form onSubmit={(e) => { e.preventDefault(); createForm.post(route('hr.jobs.store'), { onSuccess: () => { setOpenCreate(false); createForm.reset(); } }); }} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Title *</label>
                <input value={createForm.data.title} onChange={(e) => createForm.setData('title', e.target.value)} required className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
                {createForm.errors.title && <div className="text-sm text-red-600">{createForm.errors.title}</div>}
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Location</label>
                <input value={createForm.data.location} onChange={(e) => createForm.setData('location', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Type *</label>
                <input value={createForm.data.type} onChange={(e) => createForm.setData('type', e.target.value)} required className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Status *</label>
                <select value={createForm.data.status} onChange={(e) => createForm.setData('status', e.target.value as any)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Apply Email</label>
                <input type="email" value={createForm.data.apply_email} onChange={(e) => createForm.setData('apply_email', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Description</label>
              <textarea value={createForm.data.description} onChange={(e) => createForm.setData('description', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 min-h-[100px]" />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Requirements</label>
              <textarea value={createForm.data.requirements} onChange={(e) => createForm.setData('requirements', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 min-h-[100px]" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpenCreate(false)} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Cancel</button>
              <button type="submit" disabled={createForm.processing} className="px-4 py-2 rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white">Save</button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal show={!!openEdit} onClose={() => setOpenEdit(null)} maxWidth="2xl">
        <div className="p-6">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Job Posting</div>
          <form onSubmit={(e) => { e.preventDefault(); if (!openEdit) return; editForm.put(route('hr.jobs.update', openEdit.id), { onSuccess: () => setOpenEdit(null) }); }} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Title *</label>
                <input value={editForm.data.title} onChange={(e) => editForm.setData('title', e.target.value)} required className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
                {editForm.errors.title && <div className="text-sm text-red-600">{editForm.errors.title}</div>}
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Location</label>
                <input value={editForm.data.location} onChange={(e) => editForm.setData('location', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Type *</label>
                <input value={editForm.data.type} onChange={(e) => editForm.setData('type', e.target.value)} required className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Status *</label>
                <select value={editForm.data.status} onChange={(e) => editForm.setData('status', e.target.value as any)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Apply Email</label>
                <input type="email" value={editForm.data.apply_email} onChange={(e) => editForm.setData('apply_email', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Description</label>
              <textarea value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 min-h-[100px]" />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Requirements</label>
              <textarea value={editForm.data.requirements} onChange={(e) => editForm.setData('requirements', e.target.value)} className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 min-h-[100px]" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpenEdit(null)} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Cancel</button>
              <button type="submit" disabled={editForm.processing} className="px-4 py-2 rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white">Save</button>
            </div>
          </form>
        </div>
      </Modal>
    </HRLayout>
  );
}
