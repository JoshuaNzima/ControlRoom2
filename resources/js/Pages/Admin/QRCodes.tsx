import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import QRCodeGenerator from '@/Components/QRCodeGenerator';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface ZoneItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  checkpoints_count?: number;
}

interface PageProps {
  zones?: ZoneItem[];
}

export default function QRCodes() {
  const { zones = [] } = usePage().props as PageProps;

  return (
    <AdminLayout title="QR Codes">
      <Head title="QR Codes" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">QR Code Management</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Generate and download QR codes for zones and checkpoints.</p>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
            <a href={route('admin.qr-codes.download-bulk')}>
              <IconMapper name="Download" size={16} /> Download All QR Codes
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QRCodeGenerator />

          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Zones</h2>
            <div className="space-y-3">
              {zones.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No zones found.</p>}
              {zones.map((z) => (
                <div key={z.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{z.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{z.code ?? 'No code'} • {z.checkpoints_count ?? 0} checkpoints</div>
                  </div>
                  <Link href={route('admin.qr-codes')} className="text-sm text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200">Manage</Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
