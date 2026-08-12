import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Operations() {
  return (
    <AuthenticatedLayout header="Operations">
      <Head title="Operations" />
      <ComingSoon 
        title="Daily Operations" 
        description="Track daily guard activities, patrol routes, and operational metrics. Real-time monitoring dashboard."
      />
    </AuthenticatedLayout>
  );
}