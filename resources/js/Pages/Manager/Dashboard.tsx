import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps, User } from '@/types';

type Props = { auth?: { user?: User } };

export default function ManagerDashboard({ auth }: Props) {
  return (
    <AdminLayout title="Manager Dashboard" user={auth?.user}>
      <Head title="Manager Dashboard" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border bg-white p-6">Manager view coming soon.</div>
        </div>
      </div>
    </AdminLayout>
  );
}


