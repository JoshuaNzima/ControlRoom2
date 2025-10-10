import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function GuardsPage({ auth = {} as any }) {
  return (
    <AdminLayout title="Guards" user={auth?.user}>
      <Head title="Guards" />
      <ComingSoon title="Guards" backRoute="admin.dashboard" />
    </AdminLayout>
  );
}


