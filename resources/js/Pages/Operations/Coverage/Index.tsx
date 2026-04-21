import React from 'react';
import { Head } from '@inertiajs/react';
import OperationsLayout from '@/Layouts/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { Progress } from '@/Components/ui/progress';

interface Site {
  id: number;
  name: string;
  status: string;
  guards_count: number;
  shifts_count: number;
}

interface Zone {
  id: number;
  name: string;
  sites: Site[];
}

interface Props {
  zones: Zone[];
  auth?: { user?: any };
}

export default function CoverageIndex({ zones, auth }: Props) {
  const user = auth?.user;

  const totalSites = zones.reduce((acc, zone) => acc + zone.sites.length, 0);
  const activeSites = zones.reduce((acc, zone) => acc + zone.sites.filter(s => s.status === 'active').length, 0);
  const coveragePct = totalSites > 0 ? Math.round((activeSites / totalSites) * 100) : 0;

  return (
    <OperationsLayout title="Site Coverage" user={user} showQrScanner={true}>
      <Head title="Site Coverage" />

      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600">
                  <IconMapper name="building" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSites}</p>
                  <p className="text-xs text-gray-500">Total Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                  <IconMapper name="check-circle" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeSites}</p>
                  <p className="text-xs text-gray-500">Active Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800 col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Coverage</span>
                <span className="text-lg font-bold text-red-600">{coveragePct}%</span>
              </div>
              <Progress value={coveragePct} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {zones.map((zone) => (
          <Card key={zone.id} className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <IconMapper name="map-pin" className="w-5 h-5 text-red-600" />
                {zone.name}
                <span className="ml-auto text-sm font-normal text-gray-500">
                  {zone.sites.length} sites
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid gap-2 sm:gap-3">
                {zone.sites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${site.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="font-medium text-sm dark:text-gray-100">{site.name}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <IconMapper name="shield" size={14} />
                        {site.guards_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconMapper name="calendar" size={14} />
                        {site.shifts_count}
                      </span>
                    </div>
                  </div>
                ))}
                {zone.sites.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No sites in this zone</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {zones.length === 0 && (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-8 text-center">
              <IconMapper name="map" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No zones configured</p>
            </CardContent>
          </Card>
        )}
      </div>
    </OperationsLayout>
  );
}
