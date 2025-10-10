import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Props {
  title?: string;
  description?: string;
}

export default function ComingSoon({ title = 'Coming Soon', description = 'This page is under construction.' }: Props) {
  return (
    <AdminLayout title={title}>
      <Head title={title} />
      <div className="py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600 mb-6">{description}</p>
            <div className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800">
              Work in progress
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
