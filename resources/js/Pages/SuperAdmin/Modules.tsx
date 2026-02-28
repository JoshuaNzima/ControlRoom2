import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

export default function Modules() {
  const { category, modules = [] } = usePage<{ 
    category?: string;
    modules?: Array<{
      id: number;
      name: string;
      display_name: string;
      description: string;
      version: string;
      is_active: boolean;
      is_core: boolean;
      icon: string;
      category: string;
    }>;
  }>().props as any;

  const moduleCategories = [
    { key: 'finance', title: 'Finance', description: 'Requisitions, spending, payroll oversight', icon: 'DollarSign', color: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-600 dark:text-emerald-400', href: route('superadmin.finance.index'), stats: 'Payroll, Expenses, Reports' },
    { key: 'hr', title: 'Human Resources', description: 'Employees, roles, compliance', icon: 'Users2', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400', href: route('superadmin.users'), stats: 'Users, Guards, Training' },
    { key: 'control_room', title: 'Control Room', description: 'Live operations monitoring', icon: 'Monitor', color: 'from-red-500 to-rose-600', bgColor: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-600 dark:text-red-400', href: route('control-room.dashboard'), stats: 'Operations, Downs, Attendance' },
    { key: 'guards', title: 'Guards Management', description: 'Guard roster and assignments', icon: 'ShieldCheck', color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-600 dark:text-amber-400', href: route('superadmin.guards'), stats: 'Guards, Supervisors, Sites' },
    { key: 'assets', title: 'Assets & Equipment', description: 'Asset tracking and vehicle fleet', icon: 'Truck', color: 'from-cyan-500 to-blue-600', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20', textColor: 'text-cyan-600 dark:text-cyan-400', href: route('assets.index'), stats: 'Vehicles, Equipment, Handover' },
    { key: 'analytics', title: 'Analytics & Reports', description: 'KPIs, trends, business intelligence', icon: 'BarChart3', color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400', href: route('superadmin.reports.index'), stats: 'Dashboards, Insights, Data' },
    { key: 'admin', title: 'System Administration', description: 'System modules, roles, settings', icon: 'Settings2', color: 'from-gray-500 to-slate-600', bgColor: 'bg-gray-50 dark:bg-gray-900/20', textColor: 'text-gray-600 dark:text-gray-400', href: route('superadmin.roles.index'), stats: 'Roles, Settings, Security' },
  ];

  const filtered = category ? moduleCategories.filter(c => c.key === String(category)) : moduleCategories;

  return (
    <SuperAdminLayout title="Module Management">
      <Head title="Super Admin • Modules" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="Puzzle" size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Module Control Center</h1>
                <p className="text-red-100 mt-1">Manage and navigate all system modules</p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m: any) => (
            <Link 
              key={m.key} 
              href={m.href} 
              className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl hover:border-red-300 dark:hover:border-red-700 transition-all duration-300"
            >
              <div className={`h-2 bg-gradient-to-r ${m.color}`} />
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${m.bgColor} ${m.textColor}`}>
                    <IconMapper name={m.icon} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {m.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xs font-medium ${m.textColor}`}>{m.stats}</span>
                      <IconMapper name="ArrowRight" size={14} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* Quick Navigation */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Navigation</h3>
          <div className="flex flex-wrap gap-2">
            {moduleCategories.map((m: any) => (
              <Link
                key={m.key}
                href={m.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <IconMapper name={m.icon} size={16} />
                <span className="text-sm font-medium">{m.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
