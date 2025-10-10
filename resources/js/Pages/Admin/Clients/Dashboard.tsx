import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface KPIs {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  total_sites: number;
  active_sites: number;
}

interface ClientLite {
  id: number;
  name: string;
  status?: string;
  sites_count?: number;
}

interface Props {
  kpis: KPIs;
  topClients: ClientLite[];
  recentClients: ClientLite[];
}

export default function ClientsDashboard({ kpis, topClients, recentClients }: Props) {
  return (
    <AdminLayout title="Clients">
      <Head title="Clients Dashboard" />

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Clients Overview</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total Clients" value={kpis.total_clients} color="indigo" />
            <StatCard label="Active Clients" value={kpis.active_clients} color="green" />
            <StatCard label="Inactive Clients" value={kpis.inactive_clients} color="yellow" />
            <StatCard label="Total Sites" value={kpis.total_sites} color="blue" />
            <StatCard label="Active Sites" value={kpis.active_sites} color="emerald" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Clients by Sites</h2>
              <Link href={route('admin.clients.index')} className="text-sm text-indigo-600 hover:text-indigo-800">View all</Link>
            </div>
            <div className="divide-y">
              {topClients.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <Link href={route('admin.clients.show', c.id)} className="text-sm text-indigo-600 hover:text-indigo-800">Manage</Link>
                </div>
              ))}
              {topClients.length === 0 && (
                <p className="text-sm text-gray-500">No clients yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
              <Link href={route('admin.clients.create')} className="text-sm text-indigo-600 hover:text-indigo-800">Add Client</Link>
            </div>
            <ul className="space-y-3">
              {recentClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <span className="text-gray-800">{c.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
                </li>
              ))}
              {recentClients.length === 0 && (
                <p className="text-sm text-gray-500">No recent clients.</p>
              )}
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={route('admin.clients.index')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Manage Clients</Link>
          <Link href={route('admin.clients.create')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Add New Client</Link>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <div className={`mt-3 h-1 rounded bg-${color}-500`} />
    </div>
  );
}



