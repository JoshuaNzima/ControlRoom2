import React from 'react';
import { Head, Link } from '@inertiajs/react';
import OperationsLayout from '@/Layouts/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { Badge } from '@/Components/ui/badge';

interface Site {
  id: number;
  name: string;
  status: string;
  client?: { name: string };
  guards?: any[];
  shifts?: any[];
}

interface Props {
  sites: {
    data: Site[];
    current_page: number;
    last_page: number;
  };
  filters: { zone_id?: string };
  auth?: { user?: any };
}

export default function Sites({ sites, filters, auth }: Props) {
  const user = auth?.user;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <OperationsLayout title="Deployments" user={user} showQrScanner={true}>
      <Head title="Deployments" />

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-gray-100">Site Deployments</h2>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {sites.data.map((site) => (
            <Card key={site.id} className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{site.name}</h3>
                    <p className="text-sm text-gray-500">{site.client?.name || 'No client'}</p>
                  </div>
                  <Badge className={getStatusColor(site.status)}>
                    {site.status}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <IconMapper name="shield" size={14} />
                    {site.guards?.length || 0} guards
                  </span>
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <IconMapper name="calendar" size={14} />
                    {site.shifts?.length || 0} shifts today
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sites.data.length === 0 && (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-8 text-center">
              <IconMapper name="building" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No sites found</p>
            </CardContent>
          </Card>
        )}

        {sites.last_page > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: sites.last_page }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={route('operations.coverage.sites', { ...filters, page })}
                className={`px-3 py-1 rounded-md text-sm ${
                  page === sites.current_page
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
