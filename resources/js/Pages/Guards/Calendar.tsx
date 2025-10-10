import React from 'react';
import { Head } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function Calendar() {
  return (
    <SupervisorLayout title="Calendar">
      <Head title="Calendar" />
      <ComingSoon 
        title="Shift Calendar" 
        description="Visual calendar view of all guard shifts and assignments. Drag-and-drop scheduling interface coming soon."
      />
    </SupervisorLayout>
  );
}