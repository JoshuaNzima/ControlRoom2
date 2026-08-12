import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function ActivityLogs() {
  return (
    <AuthenticatedLayout header="Activity Logs">
      <Head title="Activity Logs" />
      <ComingSoon 
        title="Activity Logs" 
        description="View system activity logs and user action history for audit and compliance purposes."
      />
    </AuthenticatedLayout>
  );
}