import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

export default function HRManage() {
  return (
    <SuperAdminLayout title="HR">
      <Head title="Super Admin • Manage HR" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage HR</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Users, roles, guards and drivers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={route('superadmin.hr.index')}>
                <IconMapper name="ArrowLeft" className="mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3"><IconMapper name="Users2" /><div className="font-medium text-gray-900 dark:text-gray-100">Users</div></div>
            <div className="mt-3"><Button asChild><Link href={route('superadmin.users')}>Open</Link></Button></div>
          </Card>
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3"><IconMapper name="Key" /><div className="font-medium text-gray-900 dark:text-gray-100">Roles & Permissions</div></div>
            <div className="mt-3"><Button asChild><Link href={route('superadmin.roles.index')}>Open</Link></Button></div>
          </Card>
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3"><IconMapper name="ShieldCheck" /><div className="font-medium text-gray-900 dark:text-gray-100">Guards</div></div>
            <div className="mt-3"><Button asChild><Link href={route('superadmin.guards')}>Open</Link></Button></div>
          </Card>
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3"><IconMapper name="Truck" /><div className="font-medium text-gray-900 dark:text-gray-100">Drivers</div></div>
            <div className="mt-3"><Button asChild><Link href={route('superadmin.drivers')}>Open</Link></Button></div>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
