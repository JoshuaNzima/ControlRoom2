import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

export default function Modules() {
  const { category } = usePage<{ category?: string }>().props as any;

  const cats: Array<{ key: string; title: string; description: string; icon: string; href: string }> = [
    { key: 'finance', title: 'Finance', description: 'Requisitions, spending, payroll oversight', icon: 'DollarSign', href: route('superadmin.finance.index') },
    { key: 'hr', title: 'HR', description: 'Employees, roles, and compliance', icon: 'Users2', href: route('superadmin.users') },
    { key: 'control_room', title: 'Control Room', description: 'Live operations monitoring', icon: 'DesktopComputer', href: route('control-room.dashboard') },
    { key: 'guards', title: 'Guards', description: 'Guard roster and assignments', icon: 'ShieldCheck', href: route('superadmin.guards') },
    { key: 'analytics', title: 'Analytics', description: 'KPIs and trends', icon: 'BarChart2', href: route('superadmin.dashboard') },
    { key: 'admin', title: 'Administration', description: 'System modules, roles, settings', icon: 'Briefcase', href: route('superadmin.roles.index') },
  ];

  const filtered = category ? cats.filter(c => c.key === String(category)) : cats;

  return (
    <SuperAdminLayout title="Modules">
      <Head title="Super Admin • Modules" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Modules</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Super Admin modules overview</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Link key={m.key} href={m.href} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-start gap-3">
                <IconMapper name={m.icon} size={24} className="text-coin-700" />
                <div>
                  <div className="text-gray-900 dark:text-gray-100 font-semibold">{m.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{m.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
