import React from 'react';
import { Head } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Archived() {
  return (
    <SupervisorLayout title="Archived Guards">
      <Head title="Archived Guards" />
      <ComingSoon 
        title="Archived Guards" 
        description="View records of guards who have exited the organization, including resignation and termination details."
      />
    </SupervisorLayout>
  );
}