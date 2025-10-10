import React from 'react';
import { Head } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Leaves() {
  return (
    <SupervisorLayout title="Leave Management">
      <Head title="Leave Management" />
      <ComingSoon 
        title="Leave Management" 
        description="Manage guard leave requests, track absences, and monitor leave balances."
      />
    </SupervisorLayout>
  );
}