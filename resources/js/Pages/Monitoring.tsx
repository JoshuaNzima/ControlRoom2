import React from 'react';
import { Head } from '@inertiajs/react';
import LiveMonitoringDashboard from '@/Components/Monitoring/LiveMonitoringDashboard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import type { PageProps } from '@/types';

export default function Monitoring({ auth }: PageProps) {
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Live Monitoring Dashboard" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <h1 className="text-2xl font-semibold mb-6">Live Monitoring Dashboard</h1>
              <LiveMonitoringDashboard />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}