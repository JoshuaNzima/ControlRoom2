import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Leaves() {
  const { auth } = (usePage().props as any);
  return (
    <HRLayout title="Leave Management" user={auth?.user as any}>
      <Head title="Leave Management" />
      <ComingSoon 
        title="Leave Management" 
        description="Manage guard leave requests, track absences, and monitor leave balances."
      />
    </HRLayout>
  );
}