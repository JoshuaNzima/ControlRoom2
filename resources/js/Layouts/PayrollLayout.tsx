import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from './AuthenticatedLayout';

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function PayrollLayout({ title = 'Payroll', children }: Props) {
  const page = usePage();
  const url: string = (page as any).url || window.location.pathname + window.location.search;
  const params = new URLSearchParams(url.split('?')[1] || '');
  const mode = (params.get('mode') as 'guards' | 'staff') || 'guards';

  const setModeHref = (m: 'guards' | 'staff') => {
    const ps = new URLSearchParams(params.toString());
    ps.set('mode', m);
    return `${url.split('?')[0]}?${ps.toString()}`;
  };

  return (
    <AuthenticatedLayout header={title}>
      <Head title={title} />
      <div className="mb-4">
        <div className="inline-flex rounded-full bg-red-100 p-1">
          <Link href={setModeHref('guards')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${mode === 'guards' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-200'}`}>Guards Payroll</Link>
          <Link href={setModeHref('staff')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${mode === 'staff' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-200'}`}>Staff Payroll</Link>
        </div>
      </div>
      {children}
    </AuthenticatedLayout>
  );
}
