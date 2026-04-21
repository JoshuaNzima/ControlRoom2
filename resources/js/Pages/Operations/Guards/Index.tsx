import React from 'react';
import { Head, Link } from '@inertiajs/react';
import OperationsLayout from '@/Layouts/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { Badge } from '@/Components/ui/badge';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  site?: { name: string };
  supervisor?: { name: string };
  zone?: { name: string };
}

interface Props {
  guards: {
    data: Guard[];
    current_page: number;
    last_page: number;
  };
  filters: { status?: string };
  auth?: { user?: { name?: string } };
}

export default function GuardsIndex({ guards, filters, auth }: Props) {
  const user = auth?.user as any;
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <OperationsLayout title="Guard Roster" user={user} showQrScanner={true}>
      <Head title="Guard Roster" />

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-gray-100">Guard Roster</h2>
          <div className="flex gap-2">
            <select
              value={filters.status || ''}
              onChange={(e) => window.location.href = route('operations.guards.index', { status: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {guards.data.map((guard) => (
            <Card key={guard.id} className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold">
                      {guard.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{guard.name}</h3>
                      <p className="text-sm text-gray-500">{guard.employee_id}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(guard.status)}>
                    {guard.status}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Site:</span>
                    <span className="ml-1 text-gray-900 dark:text-gray-300">{guard.site?.name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Supervisor:</span>
                    <span className="ml-1 text-gray-900 dark:text-gray-300">{guard.supervisor?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Zone:</span>
                    <span className="ml-1 text-gray-900 dark:text-gray-300">{guard.zone?.name || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {guards.data.length === 0 && (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-8 text-center">
              <IconMapper name="shield" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No guards found</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {guards.last_page > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: guards.last_page }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={route('operations.guards.index', { ...filters, page })}
                className={`px-3 py-1 rounded-md text-sm ${
                  page === guards.current_page
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </Link>
            ))}
          </div>
        )}
      </div>
    </OperationsLayout>
  );
}
