import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function FinanceDashboard({ auth = {} as any }) {
  return (
    <AdminLayout title="Finance" user={auth?.user}>
      <Head title="Finance" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Finance Dashboard</h1>
            <p className="text-sm text-gray-600">Coming soon: invoices, payments, budgets KPIs.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


