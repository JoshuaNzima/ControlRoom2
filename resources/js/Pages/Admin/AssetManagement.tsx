import React from 'react';
import { Head } from '@inertiajs/react';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';

interface Summary {
  total_assets: number;
  in_service_assets: number;
  total_vehicles: number;
  in_service_vehicles: number;
  total_equipment: number;
  in_service_equipment: number;
  assigned_vehicles: number;
  assigned_equipment: number;
  vehicle_status_counts: { active: number; maintenance: number; retired: number };
  equipment_status_counts: { active: number; maintenance: number; retired: number; lost: number };
}

interface Props {
  auth?: any;
  summary: Summary;
}

export default function AssetManagement({ auth = {}, summary }: Props) {
  const vTotal = summary.total_vehicles || 0;
  const eTotal = summary.total_equipment || 0;
  const vCounts = summary.vehicle_status_counts || { active: 0, maintenance: 0, retired: 0 };
  const eCounts = summary.equipment_status_counts || { active: 0, maintenance: 0, retired: 0, lost: 0 };

  const pct = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return (
    <AssetManagementLayout title="Asset Management" user={auth?.user as any}>
      <Head title="Asset Management" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total assets" value={summary.total_assets} />
            <StatCard label="In service assets" value={summary.in_service_assets} />
            <StatCard label="Total vehicles" value={summary.total_vehicles} />
            <StatCard label="In service vehicles" value={summary.in_service_vehicles} />
            <StatCard label="Total equipment" value={summary.total_equipment} />
            <StatCard label="In service equipment" value={summary.in_service_equipment} />
            <StatCard label="Assigned vehicles" value={summary.assigned_vehicles} />
            <StatCard label="Assigned equipment" value={summary.assigned_equipment} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatusCard
              title="Vehicle status"
              total={vTotal}
              items={[
                { name: 'Active', count: vCounts.active, color: 'bg-green-500 dark:bg-green-600' },
                { name: 'Maintenance', count: vCounts.maintenance, color: 'bg-yellow-500 dark:bg-yellow-600' },
                { name: 'Retired', count: vCounts.retired, color: 'bg-gray-400 dark:bg-gray-600' },
              ]}
              pct={pct}
            />
            <StatusCard
              title="Equipment status"
              total={eTotal}
              items={[
                { name: 'Active', count: eCounts.active, color: 'bg-green-500 dark:bg-green-600' },
                { name: 'Maintenance', count: eCounts.maintenance, color: 'bg-yellow-500 dark:bg-yellow-600' },
                { name: 'Retired', count: eCounts.retired, color: 'bg-gray-400 dark:bg-gray-600' },
                { name: 'Lost', count: eCounts.lost, color: 'bg-red-500 dark:bg-red-600' },
              ]}
              pct={pct}
            />
          </div>
        </div>
      </div>
    </AssetManagementLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function StatusCard({ title, total, items, pct }: { title: string; total: number; items: { name: string; count: number; color: string }[]; pct: (c: number, t: number) => number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">Total: {total}</span>
      </div>
      <div className="mt-3 h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="flex h-full w-full">
          {items.map((it, idx) => (
            <div key={idx} className={`${it.color} h-full`} style={{ width: `${pct(it.count, total)}%` }} />
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${it.color}`} />
            <span>{it.name}</span>
            <span className="ml-auto text-gray-500 dark:text-gray-400">{it.count} ({pct(it.count, total)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
