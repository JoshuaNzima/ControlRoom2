import React from 'react';
import { Head } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function ActivityLogs() {
  return (
    <SupervisorLayout title="Activity Logs">
      <Head title="Activity Logs" />
      <ComingSoon 
        title="Activity Logs" 
        description="View system activity logs and user action history for audit and compliance purposes."
      />
    </SupervisorLayout>
  );
}