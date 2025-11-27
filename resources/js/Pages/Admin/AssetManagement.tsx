import React from 'react';
import { Head } from '@inertiajs/react';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';

interface Summary {
  total_assets: number;
  in_service_assets: number;
  total_vehicles: number;
  in_service_vehicles: number;
}

interface Props {
  auth?: any;
  summary: Summary;
}

export default function AssetManagement({ auth = {}, summary }: Props) {
  return (
    <AssetManagementLayout title="Asset Management" user={auth?.user as any}>
      <Head title="Asset Management" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total assets</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.total_assets}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">In service assets</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.in_service_assets}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total vehicles</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.total_vehicles}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">In service vehicles</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.in_service_vehicles}</p>
            </div>
          </div>
        </div>
      </div>
    </AssetManagementLayout>
  );
}
