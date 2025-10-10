import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function UsersPage({ auth = {} as any }) {
  return (
    <AdminLayout title="Users" user={auth?.user}>
      <Head title="Users" />
      <ComingSoon title="Users Management" backRoute="admin.dashboard" />
    </AdminLayout>
  );
}


