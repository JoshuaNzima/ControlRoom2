import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/Operations/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Pagination } from '@/Components/ui/Pagination';
import Echo from 'laravel-echo';

const OperationsManager = ({ auth, stats, reportSummary, recentAlerts }: any) => {
  return (
    <ControlRoomLayout title="Operations Manager">
      <Head title="Operations Manager" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Operations Manager Dashboard</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Manager view: higher-level controls, reports and approvals.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sites</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.active_sites ?? 0}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Guards</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.total_guards ?? 0}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">👮</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.open_tickets ?? 0}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600">📨</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.pending_assignments ?? 0}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600">⚙️</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Manager Reports</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Incidents (7 days)</p>
                <p className="text-2xl font-bold">{reportSummary?.incidents_last_7_days ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Flags (7 days)</p>
                <p className="text-2xl font-bold">{reportSummary?.flags_last_7_days ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recent Alerts</h3>
              <div className="flex space-x-2">
                <Button variant="outline">Export</Button>
                <Button>View All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAlerts?.map((a: any) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-gray-500">{a.created_at}</div>
                    </div>
                    <Badge>{a.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </ControlRoomLayout>
  );
};

export default OperationsManager;
