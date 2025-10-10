import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function FinancePage({ auth = {} as any }) {
  return (
    <AdminLayout title="Finance" user={auth?.user}>
      <Head title="Finance" />
      <ComingSoon title="Finance" backRoute="admin.dashboard" />
    </AdminLayout>
  );
}


