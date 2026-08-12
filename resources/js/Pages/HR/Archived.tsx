import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Archived() {
  const { auth } = (usePage().props as any);
  return (
    <AuthenticatedLayout header="Archived Guards" user={auth?.user as any}>
      <Head title="Archived Guards" />
      <ComingSoon 
        title="Archived Guards" 
        description="View records of guards who have exited the organization, including resignation and termination details."
      />
    </AuthenticatedLayout>
  );
}
