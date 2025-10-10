import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import QRCodeGenerator from '@/Components/QRCodeGenerator';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Download } from 'lucide-react';

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
            <p className="text-gray-600 text-sm">Generate and download QR codes for zones and checkpoints.</p>
          </div>
          <a href={route('admin.qr-codes.download-bulk')} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={16} /> Download All QR Codes
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QRCodeGenerator />

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Zones</h2>
            <div className="space-y-3">
              {zones.length === 0 && <p className="text-sm text-gray-500">No zones found.</p>}
              {zones.map((z) => (
                <div key={z.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium text-gray-900">{z.name}</div>
                    <div className="text-xs text-gray-500">{z.code ?? 'No code'} • {z.checkpoints_count ?? 0} checkpoints</div>
                  </div>
                  <Link href={route('admin.qr-codes')} className="text-sm text-indigo-600 hover:text-indigo-800">Manage</Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
