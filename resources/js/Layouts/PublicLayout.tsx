import React from 'react';
import { Head, Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function PublicLayout({ title = 'Coin Security', children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head title={title} />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <img src="/images/Coin-logo.png" alt="Coin Security" className="h-10 w-auto" />
              <span className="text-lg font-semibold">Coin Security</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href={route('public.home')} className="text-sm text-gray-700 hover:text-gray-900">Home</Link>
              <Link href={route('login')} className="text-sm text-gray-700 hover:text-gray-900">Client Login</Link>
              <a href="/contact" className="text-sm text-gray-700 hover:text-gray-900">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Coin Security — All rights reserved.
        </div>
      </footer>
    </div>
  );
}
