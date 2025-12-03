import React from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';

export default function About() {
  return (
    <PublicLayout title="About — Coin Security">
      <Head title="About" />
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold">About Coin Security</h1>
          <p className="mt-4 text-gray-300 max-w-2xl">Professional security services backed by technology, process discipline, and a customer-first culture.</p>
        </div>
      </section>
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{icon:'Shield',title:'Licensed & Vetted',desc:'All personnel are licensed, background-checked, and continuously trained.'},{icon:'Activity',title:'Operational Excellence',desc:'Clear SLAs, post orders, and digital reporting for accountability.'},{icon:'Headphones',title:'24/7 Support',desc:'Always-on support for incidents, escalations, and service updates.'}].map((item, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-950">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white flex items-center justify-center">
                  <IconMapper name={item.icon} className="w-6 h-6" />
                </div>
                <div className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</div>
                <div className="mt-1 text-gray-600 dark:text-gray-400">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-950">
            <div className="text-gray-800 dark:text-gray-200 leading-relaxed space-y-4">
              <p>We combine trained security professionals with live monitoring, modern tooling, and data to protect people and property.</p>
              <p>Our operating model emphasizes preventive controls, rapid incident response, and transparent reporting. We adapt to your risk profile and scale services as your needs evolve.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
