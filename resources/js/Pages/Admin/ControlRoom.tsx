import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import CoverageTrendChart from '@/Components/ControlRoom/CoverageTrendChart';
import AttendanceChart from '@/Components/ControlRoom/AttendanceChart';
import { Dialog } from '@/Components/ui/dialog';
import CreateTicketForm from '@/Pages/ControlRoom/Tickets/CreateTicketForm';
import CreateFlagForm from '@/Pages/ControlRoom/Flags/CreateFlagForm';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type ZoneStats = {
  id: number;
  name: string;
  coverage: number;
  activeGuards: number;
  requiredGuards: number;
  sites: number;
  weeklyStats: any;
};

interface Props {
  auth?: any;
  stats: {
    zones: ZoneStats[];
    activeIncidents: number;
    flaggedGuards: number;
    overallCoverage: number;
  };
}

export default function AdminControlRoom({ auth = {} as any, stats }: Props) {
  const [showCreateTicket, setShowCreateTicket] = React.useState(false);
  const [showReportIssue, setShowReportIssue] = React.useState(false);
  const zones = Array.isArray(stats?.zones) ? stats.zones : [];
  const overallCoverage = typeof stats?.overallCoverage === 'number' ? stats.overallCoverage : 0;
  const activeIncidents = typeof stats?.activeIncidents === 'number' ? stats.activeIncidents : 0;
  const flaggedGuards = typeof stats?.flaggedGuards === 'number' ? stats.flaggedGuards : 0;

  const metricsData = [
    {
      title: 'Overall Coverage',
      value: `${overallCoverage.toFixed(1)}%`,
      status:
        overallCoverage >= 90
          ? 'success'
          : overallCoverage >= 70
          ? 'warning'
          : 'danger',
    },
    {
      title: 'Active Incidents',
      value: activeIncidents,
      status:
        activeIncidents === 0
          ? 'success'
          : activeIncidents > 5
          ? 'danger'
          : 'warning',
    },
    {
      title: 'Flagged Guards',
      value: flaggedGuards,
      status:
        flaggedGuards === 0
          ? 'success'
          : flaggedGuards > 3
          ? 'danger'
          : 'warning',
    },
  ];

  return (
    <AdminLayout title="Control Room" user={auth?.user}>
      <Head title="Admin • Control Room" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Control Room Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {metricsData.map((metric, index) => (
              <Card key={index} className={`border-l-4 ${
                metric.status === 'success'
                  ? 'border-green-500 dark:border-green-400'
                  : metric.status === 'warning'
                  ? 'border-yellow-500 dark:border-yellow-400'
                  : 'border-red-500 dark:border-red-400'
              }`}>
                <CardContent className="py-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{metric.title}</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metric.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Zone Coverage Status</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{zone.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {zone.activeGuards}/{zone.requiredGuards} Guards • {zone.sites} Sites
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-bold ${
                            zone.coverage >= 90
                              ? 'text-green-700 dark:text-green-400'
                              : zone.coverage >= 70
                              ? 'text-yellow-700 dark:text-yellow-400'
                              : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          {zone.coverage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowCreateTicket(true)}>Create Ticket</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowReportIssue(true)}>Report Issue</Button>
                </div>
              </CardHeader>
              <CardContent></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Weekly Coverage Trends</h3>
              </CardHeader>
              <CardContent>
                <CoverageTrendChart zones={zones as any} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Guard Attendance Overview</h3>
              </CardHeader>
              <CardContent>
                <AttendanceChart zones={zones as any} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
        {showCreateTicket && (
          <CreateTicketForm onClose={() => setShowCreateTicket(false)} />
        )}
      </Dialog>

      {/* Report Issue (Flag) Modal */}
      <Dialog open={showReportIssue} onOpenChange={setShowReportIssue}>
        {showReportIssue && (
          <CreateFlagForm onClose={() => setShowReportIssue(false)} />
        )}
      </Dialog>
    </AdminLayout>
  );
}


