import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Assignments() {
  return (
    <AuthenticatedLayout header="Assignments">
      <Head title="Assignments" />
      <ComingSoon 
        title="Guard Assignments" 
        description="View and manage guard assignments to client sites. This feature will allow you to track current deployments and schedule future assignments."
      />
    </AuthenticatedLayout>
  );
}