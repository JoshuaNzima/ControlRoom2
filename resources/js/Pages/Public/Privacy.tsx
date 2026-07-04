import React from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Privacy() {
  return (
    <PublicLayout title="Privacy Policy — Coin Security">
      <Head title="Privacy" />
      <section className="relative overflow-hidden bg-white pt-28 pb-16">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/20 to-transparent animate-scan-line" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-accent bg-coin-accent/10 px-4 py-1.5 rounded-full mb-4">Privacy</div>
          <h1 className="text-4xl md:text-5xl font-bold text-coin-text">Privacy Policy</h1>
          <p className="mt-4 text-coin-muted">Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
        </div>
      </section>
      <section className="py-12 bg-coin-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-coin-muted">
          <div>
            <h2 className="text-xl font-semibold text-coin-text">Information We Collect</h2>
            <p className="mt-2">We may collect contact details and messages you submit through our forms for the purpose of responding to inquiries and providing services.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-coin-text">How We Use Information</h2>
            <p className="mt-2">We use your information to provide services, respond to requests, improve our operations, and comply with legal obligations.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-coin-text">Data Security</h2>
            <p className="mt-2">We use reasonable safeguards to protect your information from unauthorized access or disclosure.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-coin-text">Contact</h2>
            <p className="mt-2">If you have questions about this policy, please contact us via the Contact page.</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
