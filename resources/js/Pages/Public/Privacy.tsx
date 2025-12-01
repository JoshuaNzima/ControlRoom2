import React from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Privacy() {
  return (
    <PublicLayout title="Privacy Policy — Coin Security">
      <Head title="Privacy" />
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          <p className="mt-4 text-gray-300">Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
        </div>
      </section>
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-gray-700 dark:text-gray-300">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Information We Collect</h2>
            <p className="mt-2">We may collect contact details and messages you submit through our forms for the purpose of responding to inquiries and providing services.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">How We Use Information</h2>
            <p className="mt-2">We use your information to provide services, respond to requests, improve our operations, and comply with legal obligations.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Data Security</h2>
            <p className="mt-2">We use reasonable safeguards to protect your information from unauthorized access or disclosure.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Contact</h2>
            <p className="mt-2">If you have questions about this policy, please contact us via the Contact page.</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
