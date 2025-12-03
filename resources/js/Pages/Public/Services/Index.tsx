import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';

interface Service {
  slug: string;
  title: string;
  icon: string;
  summary: string;
  features?: string[];
}

export default function ServicesIndex({ services = [] as Service[] }: { services: Service[] }) {
  return (
    <PublicLayout title="Services — Coin Security">
      <Head title="Services" />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold">Our Security Services</h1>
          <p className="mt-4 text-gray-300 max-w-2xl">
            End-to-end physical security and technology solutions, tailored to your risk profile.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={route('public.services.show', s.slug)}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white flex items-center justify-center">
                  <IconMapper name={s.icon} className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{s.summary}</p>
                {s.features?.length ? (
                  <ul className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-1 list-disc pl-5">
                    {s.features.slice(0, 3).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-6 inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                  Learn more
                  <IconMapper name="ArrowRight" className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
