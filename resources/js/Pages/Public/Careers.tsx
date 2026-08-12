import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

interface Job { id: number; title: string; location: string; type: string }

export default function Careers({ jobs = [] as Job[] }: { jobs: Job[] }) {
  const [selected, setSelected] = useState<Job | null>(null);
  const { data, setData, post, processing, reset, errors } = useForm({
    candidate_name: '', email: '', phone: '', notes: '', resume: null as File | null, website: ''
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
      <section className="relative overflow-hidden bg-white pt-28 pb-16">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/20 to-transparent animate-scan-line" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-accent bg-coin-accent/10 px-4 py-1.5 rounded-full mb-4">Careers</div>
          <h1 className="text-4xl md:text-5xl font-bold text-coin-text">Join Our Team</h1>
          <p className="mt-4 text-coin-muted max-w-2xl">Grow your career with a mission-driven security company.</p>
        </div>
      </section>
      <section className="py-12 bg-coin-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {jobs.length === 0 && (
            <div className="text-center py-12 text-coin-muted">No open positions at this time. Check back later.</div>
          )}
          <div className="grid grid-cols-1 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="rounded-2xl border border-coin-border bg-white p-6 flex items-start justify-between shadow-sm hover:shadow-card-hover transition-all">
                <div>
                  <div className="text-lg font-semibold text-coin-text">{job.title}</div>
                  <div className="text-sm text-coin-muted">{job.location} • {job.type}</div>
                </div>
                <button onClick={() => setSelected(job)} className="inline-flex items-center gap-2 px-4 py-2 bg-coin-accent text-white rounded-lg font-medium hover:bg-coin-accent-light transition-colors">
                  <IconMapper name="FileText" className="w-4 h-4" /> Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Modal show={!!selected} onClose={() => setSelected(null)} maxWidth="xl">
        <div className="p-6 bg-white text-coin-text">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Apply — {selected?.title}</div>
            <button onClick={() => setSelected(null)} className="text-coin-muted hover:text-coin-text">
              <IconMapper name="X" className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <input type="text" name="website" value={data.website} onChange={(e) => setData('website', e.target.value)} className="hidden" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-coin-muted">Full Name *</label>
                <input value={data.candidate_name} onChange={(e) => setData('candidate_name', e.target.value)} required className="w-full mt-1 rounded-lg border border-coin-border bg-white text-coin-text px-3 py-2 focus:outline-none focus:border-coin-accent/50" />
                {errors.candidate_name && <div className="text-sm text-red-400">{errors.candidate_name}</div>}
              </div>
              <div>
                <label className="text-sm text-coin-muted">Email *</label>
                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required className="w-full mt-1 rounded-lg border border-coin-border bg-white text-coin-text px-3 py-2 focus:outline-none focus:border-coin-accent/50" />
                {errors.email && <div className="text-sm text-red-400">{errors.email}</div>}
              </div>
            </div>
            <div>
              <label className="text-sm text-coin-muted">Phone</label>
              <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="w-full mt-1 rounded-lg border border-coin-border bg-white text-coin-text px-3 py-2 focus:outline-none focus:border-coin-accent/50" />
              {errors.phone && <div className="text-sm text-red-400">{errors.phone}</div>}
            </div>
            <div>
              <label className="text-sm text-coin-muted">Resume (PDF/DOC/DOCX, max 5MB)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setData('resume', e.currentTarget.files?.[0] ?? null)} className="w-full mt-1 block text-sm text-coin-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-coin-accent/10 file:text-coin-accent hover:file:bg-coin-accent/20" />
              {errors.resume && <div className="text-sm text-red-400">{errors.resume}</div>}
            </div>
            <div>
              <label className="text-sm text-coin-muted">Notes</label>
              <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="w-full mt-1 rounded-lg border border-coin-border bg-white text-coin-text px-3 py-2 min-h-[120px] focus:outline-none focus:border-coin-accent/50" />
              {errors.notes && <div className="text-sm text-red-400">{errors.notes}</div>}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={processing} className="inline-flex items-center gap-2 px-5 py-3 bg-coin-accent text-white rounded-lg font-medium hover:bg-coin-accent-light disabled:opacity-60">
                <IconMapper name="Send" className="w-5 h-5" /> Submit
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </PublicLayout>
  );
}
