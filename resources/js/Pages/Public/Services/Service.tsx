import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

interface Service {
  slug: string;
  title: string;
  icon: string;
  intro: string;
  features: string[];
}

export default function ServicePage({ service }: { service: Service }) {
  const [showQuote, setShowQuote] = useState(false);
  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    email: '',
    subject: `Quote Request — ${service?.title ?? 'Service'}`,
    message: '',
    website: ''
  });

  const safeRoute = (name: string, params?: any, fallback: string = '#') => {
    try {
      // @ts-ignore global route
      const r = route as any;
      if (typeof r === 'function') {
        try {
          if (typeof r().has === 'function' && !r().has(name)) return fallback;
        } catch {}
        return r(name, params);
      }
    } catch {}
    return fallback;
  };

  const submitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('public.contact.store'), {
      onSuccess: () => {
        reset();
        setShowQuote(false);
      }
    });
  };

  return (
    <PublicLayout title={`${service?.title ?? 'Service'} — Coin Security`}>
      <Head title={service?.title ?? 'Service'} />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center">
              <IconMapper name={service.icon} className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">{service.title}</h1>
          </div>
          <p className="mt-4 text-gray-300 max-w-3xl">{service.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowQuote(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-lg font-medium shadow hover:shadow-lg"
            >
              <IconMapper name="Phone" className="w-5 h-5" />
              Request Quote
            </button>
            <Link
              href={safeRoute('public.services', undefined, '/services')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 rounded-lg font-medium hover:bg-white/20"
            >
              <IconMapper name="ArrowLeft" className="w-5 h-5" />
              Back to Services
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-950">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <IconMapper name="Check" className="w-5 h-5" />
                  </div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{f}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal show={showQuote} onClose={() => setShowQuote(false)} maxWidth="xl">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request a Quote — {service.title}</h3>
            <button onClick={() => setShowQuote(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <IconMapper name="X" className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={submitQuote} className="mt-4 space-y-4">
            <input type="text" name="website" value={data.website} onChange={(e) => setData('website', e.target.value)} className="hidden" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Full Name *</label>
                <input value={data.name} onChange={(e) => setData('name', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" />
                {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Email *</label>
                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" />
                {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Subject *</label>
              <input value={data.subject} onChange={(e) => setData('subject', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" />
              {errors.subject && <div className="text-sm text-red-600">{errors.subject}</div>}
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Message *</label>
              <textarea value={data.message} onChange={(e) => setData('message', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 min-h-[120px]" />
              {errors.message && <div className="text-sm text-red-600">{errors.message}</div>}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={processing} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium disabled:opacity-60">
                <IconMapper name="Send" className="w-5 h-5" />
                Send
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </PublicLayout>
  );
}
