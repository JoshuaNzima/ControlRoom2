import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Sergeants() {
  return (
    <AuthenticatedLayout header="Sergeants">
      <Head title="Sergeants" />
      <ComingSoon 
        title="Sergeant Management" 
        description="Manage supervisors and team leaders. Track performance, assignments, and team structures."
      />
    </AuthenticatedLayout>
  );
}