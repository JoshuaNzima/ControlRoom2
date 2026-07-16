import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';

interface Props {
  message: string;
  auth?: { user?: any };
}

export default function DeploymentsReport({ message, auth }: Props) {
  const user = auth?.user;

  return (
    <AuthenticatedLayout header="Deployment Reports" user={user} showQrScanner={true}>
      <Head title="Deployment Reports" />

      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-gray-100">Deployment Reports</h2>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-8 text-center">
            <IconMapper name="file-text" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">This feature is under development</p>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
