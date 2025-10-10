import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function ClientsPage({ auth = {} as any }) {
  return (
    <AdminLayout title="Clients" user={auth?.user}>
      <Head title="Clients" />
      <ComingSoon title="Clients" backRoute="admin.dashboard" />
    </AdminLayout>
  );
}


