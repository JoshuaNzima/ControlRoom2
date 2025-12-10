import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Archived() {
  const { auth } = (usePage().props as any);
  return (
    <HRLayout title="Archived Guards" user={auth?.user as any}>
      <Head title="Archived Guards" />
      <ComingSoon 
        title="Archived Guards" 
        description="View records of guards who have exited the organization, including resignation and termination details."
      />
    </HRLayout>
  );
}
