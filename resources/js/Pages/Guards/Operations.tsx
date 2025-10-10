import React from 'react';
import { Head } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Operations() {
  return (
    <SupervisorLayout title="Operations">
      <Head title="Operations" />
      <ComingSoon 
        title="Daily Operations" 
        description="Track daily guard activities, patrol routes, and operational metrics. Real-time monitoring dashboard."
      />
    </SupervisorLayout>
  );
}