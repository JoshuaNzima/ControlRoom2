import React from 'react';
import { Head } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Incidents() {
  return (
    <SupervisorLayout title="Incidents">
      <Head title="Incidents" />
      <ComingSoon 
        title="Incident Management" 
        description="Report and track security incidents. Guards can file incident reports with photos, videos, and detailed descriptions."
      />
    </SupervisorLayout>
  );
}