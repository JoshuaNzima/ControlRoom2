import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
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

type Scan = {
  id: number;
  supervisor_name: string;
  site_name: string;
  client_name: string;
  checkpoint_name: string;
  scanned_at: string;
  location_verified: boolean;
  latitude: number | null;
  longitude: number | null;
};

interface Props {
  auth?: any;
  stats: {
    zones: ZoneStats[];
    activeIncidents: number;
    flaggedGuards: number;
    overallCoverage: number;
  };
  recentScans?: Scan[];
  scansCount24h?: number;
}

export default function AdminControlRoom({ auth = {} as any, stats, recentScans = [], scansCount24h = 0 }: Props) {
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

          {/* Recent QR Scans Section */}
          <Card className="mt-6">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Recent QR Scans</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Last 24 hours • {scansCount24h} total scans
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Live
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentScans.length === 0 ? (
                <div className="text-center py-8 px-4 text-gray-500 dark:text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <p className="text-sm">No scans recorded in the last 24 hours</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Supervisor
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Site / Client
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Checkpoint
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            GPS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {recentScans.map((scan) => (
                          <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-coin-100 dark:bg-coin-900/30 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-coin-700 dark:text-coin-300">
                                    {scan.supervisor_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {scan.supervisor_name}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">{scan.site_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{scan.client_name}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-700 dark:text-gray-300">{scan.checkpoint_name}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {new Date(scan.scanned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(scan.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  scan.location_verified
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }`}
                              >
                                <IconMapper name={scan.location_verified ? 'CheckCircle' : 'AlertCircle'} size={12} />
                                {scan.location_verified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    {recentScans.map((scan) => {
                      const scannedAt = scan.scanned_at ? new Date(scan.scanned_at) : null;
                      const timeAgo = scannedAt ? (() => {
                        const diff = Date.now() - scannedAt.getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return 'Just now';
                        if (mins < 60) return `${mins}m ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        return `${Math.floor(hrs / 24)}d ago`;
                      })() : '';

                      return (
                        <div key={scan.id} className="p-4 bg-white dark:bg-gray-900">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-coin-100 dark:bg-coin-900/30 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-sm font-medium text-coin-700 dark:text-coin-300">
                                  {scan.supervisor_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {scan.supervisor_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {timeAgo}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                                scan.location_verified
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}
                            >
                              <IconMapper name={scan.location_verified ? 'CheckCircle' : 'AlertCircle'} size={10} />
                            </span>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm">
                              <IconMapper name="MapPin" size={14} className="text-gray-400 shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 truncate">
                                {scan.site_name}
                                {scan.client_name && (
                                  <span className="text-gray-500 dark:text-gray-400"> • {scan.client_name}</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <IconMapper name="ScanLine" size={14} className="text-gray-400 shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {scan.checkpoint_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <IconMapper name="Clock" size={14} className="text-gray-400 shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {scannedAt?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                {' '}
                                <span className="text-gray-500 dark:text-gray-400">
                                  {scannedAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 mt-6">
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


