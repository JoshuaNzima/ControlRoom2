import React, { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

interface Job { id: number; title: string; location: string; type: string }

export default function Careers({ jobs = [] as Job[] }: { jobs: Job[] }) {
  const [selected, setSelected] = useState<Job | null>(null);
  const { data, setData, post, processing, reset, errors } = useForm({
    candidate_name: '',
    email: '',
    phone: '',
    notes: '',
    resume: null as File | null,
    website: ''
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    post(route('public.careers.apply', selected.id), {
      forceFormData: true,
      onSuccess: () => { reset(); setSelected(null); }
    });
  };


  return (
    <PublicLayout title="Careers — Coin Security">
      <Head title="Careers" />
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-black text-white">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold">Join Our Team</h1>
          <p className="mt-4 text-gray-300 max-w-2xl">Grow your career with a mission-driven security company.</p>
        </div>
      </section>
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{job.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{job.location} • {job.type}</div>
                </div>
                <button onClick={() => setSelected(job)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium">
                  <IconMapper name="FileText" className="w-4 h-4" />
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Modal show={!!selected} onClose={() => setSelected(null)} maxWidth="xl">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Apply — {selected?.title}</div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <IconMapper name="X" className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <input type="text" name="website" value={data.website} onChange={(e) => setData('website', e.target.value)} className="hidden" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Full Name *</label>
                <input value={data.candidate_name} onChange={(e) => setData('candidate_name', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" />
                {errors.candidate_name && <div className="text-sm text-red-600">{errors.candidate_name}</div>}
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Email *</label>
                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" />
                {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Phone</label>
              <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" />
              {errors.phone && <div className="text-sm text-red-600">{errors.phone}</div>}
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Resume (PDF/DOC/DOCX, max 5MB)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setData('resume', e.currentTarget.files?.[0] ?? null)} className="w-full mt-1 block text-sm text-gray-900 dark:text-gray-200" />
              {errors.resume && <div className="text-sm text-red-600">{errors.resume}</div>}
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Notes</label>
              <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 min-h-[120px]" />
              {errors.notes && <div className="text-sm text-red-600">{errors.notes}</div>}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={processing} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium disabled:opacity-60">
                <IconMapper name="Send" className="w-5 h-5" />
                Submit
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </PublicLayout>
  );
}
