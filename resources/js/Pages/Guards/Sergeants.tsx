import React from 'react';
import { Head } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Sergeants() {
  return (
    <SupervisorLayout title="Sergeants">
      <Head title="Sergeants" />
      <ComingSoon 
        title="Sergeant Management" 
        description="Manage supervisors and team leaders. Track performance, assignments, and team structures."
      />
    </SupervisorLayout>
  );
}