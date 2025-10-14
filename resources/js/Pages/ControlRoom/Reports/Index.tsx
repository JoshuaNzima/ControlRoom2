import React from 'react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import ReportsIndex from '@/Pages/Reports/Index';
import { Head } from '@inertiajs/react';

export default function ControlRoomReports() {
  return (
    <ControlRoomLayout title="Reports">
      <Head title="Reports" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Render the existing ReportsIndex component inside the ControlRoom layout */}
        <ReportsIndex />
      </div>
    </ControlRoomLayout>
  );
}
