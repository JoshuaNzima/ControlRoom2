import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function ReportIndex() {
  return (
    <AdminLayout title="Reports">
      <Head title="Reports" />
      <div className="p-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p>This is the reports page.</p>
      </div>
    </AdminLayout>
  );
}
