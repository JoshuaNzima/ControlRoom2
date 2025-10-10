import React from 'react';
import { Head } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function ClientsIndex() {
  return (
    <SupervisorLayout title="Clients">
      <Head title="Clients" />
      <ComingSoon 
        title="Client Management" 
        description="View and manage client information, locations, and contract details."
      />
    </SupervisorLayout>
  );
}