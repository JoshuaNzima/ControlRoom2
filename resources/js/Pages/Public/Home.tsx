import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';

export default function Home() {
  return (
    <PublicLayout title="Coin Security — Protection & Monitoring">
      <Head title="Home" />

      <section className="bg-white rounded-lg shadow p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Security coverage your business can trust</h1>
            <p className="text-gray-600 mb-6">Coin Security provides trained guards, monitored cameras and responsive support so your sites stay safe. Manage services, billing and sites from our client portal.</p>

            <div className="flex gap-3">
              <Link href={route('login')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow">
                <IconMapper name="LogIn" className="w-4 h-4" />
                Client Login
              </Link>
              <a href="/contact" className="inline-flex items-center gap-2 px-4 py-2 border rounded">Contact Sales</a>
            </div>
          </div>

          <div className="hidden md:block">
            <img src="/images/landing-illustration.svg" alt="Security Illustration" className="w-full h-auto" />
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Integrated Monitoring</h3>
          <p className="text-sm text-gray-600 mt-2">Live camera monitoring and incident alerts keep you informed.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Flexible Services</h3>
          <p className="text-sm text-gray-600 mt-2">Choose from standard packages or customizable guard and patrol plans.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Client Portal</h3>
          <p className="text-sm text-gray-600 mt-2">Manage invoices, sites and services through our secure portal.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
