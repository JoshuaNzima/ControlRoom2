import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function SettingsPage({ auth = {} as any }) {
  return (
    <AdminLayout title="Settings" user={auth?.user}>
      <Head title="Settings" />
      <ComingSoon title="Settings" backRoute="admin.dashboard" />
    </AdminLayout>
  );
}


