import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ClientDashboard({ auth = {} as any }) {
  return (
    <AdminLayout title="Client Dashboard" user={auth?.user}>
      <Head title="Client Dashboard" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border bg-white p-6">Client view coming soon.</div>
        </div>
      </div>
    </AdminLayout>
  );
}


