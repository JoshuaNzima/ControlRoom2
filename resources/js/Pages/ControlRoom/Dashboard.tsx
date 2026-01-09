import React, { Suspense } from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import EmptyState from '@/Components/ui/empty-state';
import Skeleton from '@/Components/ui/skeleton';
import PageHeader from '@/Components/ui/page-header';
const CoverageTrendChart = React.lazy(() => import('@/Components/ControlRoom/CoverageTrendChart'));
const AttendanceChart = React.lazy(() => import('@/Components/ControlRoom/AttendanceChart'));
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
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import LiveMonitoring from '@/Components/ControlRoom/LiveMonitoring';
import { User } from '@/types';
import QuickRequisitionModal from '@/Components/Requisitions/QuickRequisitionModal';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardStats {
  overallCoverage: number;
  activeGuards: number;
  totalSites: number;
  activeIncidents: number;
  flaggedGuards: number;
  totalClients: number;
  totalCameras: number;
  todayAttendance: number;
  pendingIncidents: number;
  resolvedIncidents: number;
}

interface RecentIncident {
  id: number;
  title: string;
  type: string;
  status: string;
  severity: string;
  guard_name: string;
  site_name: string;
  client_name: string;
  created_at: string;
  escalation_level: number;
}

interface ActiveAlerts {
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  attendance_alerts: number;
  camera_alerts: number;
}

interface CoverageDataPoint {
  date: string;
  coverage: number;
}

interface AttendanceDataPoint {
  date: string;
  attendance: number;
}

interface Zone {
  id: number;
  name: string;
  coverage: number;
  guards: number;
  required_guards: number;
  sites: number;
}

interface DashboardProps {
  stats: DashboardStats;
  recentIncidents: RecentIncident[];
  activeAlerts: ActiveAlerts;
  coverageData: CoverageDataPoint[];
  attendanceData: AttendanceDataPoint[];
  zones: Zone[];
  auth?: { user?: { name?: string } };
}

const Dashboard = ({ stats, recentIncidents, activeAlerts, coverageData, attendanceData, zones, auth }: DashboardProps) => {
    // State for collapsible sections
    const [showZoneCoverage, setShowZoneCoverage] = React.useState(true);
    const [showIncidents, setShowIncidents] = React.useState(true);
    const [showAlerts, setShowAlerts] = React.useState(true);
    const [showTrends, setShowTrends] = React.useState(true);
    const [showAnalytics, setShowAnalytics] = React.useState(true);

    // Add fallback values for all props to prevent null/undefined errors
    const safeStats = {
        overallCoverage: stats?.overallCoverage ?? 0,
        activeGuards: stats?.activeGuards ?? 0,
        totalSites: stats?.totalSites ?? 0,
        activeIncidents: stats?.activeIncidents ?? 0,
        flaggedGuards: stats?.flaggedGuards ?? 0,
        totalClients: stats?.totalClients ?? 0,
        totalCameras: stats?.totalCameras ?? 0,
        todayAttendance: stats?.todayAttendance ?? 0,
        pendingIncidents: stats?.pendingIncidents ?? 0,
        resolvedIncidents: stats?.resolvedIncidents ?? 0
    };
    
    const safeRecentIncidents = recentIncidents || [];
    const safeActiveAlerts = activeAlerts || {
        high_priority: 0,
        medium_priority: 0,
        low_priority: 0,
        attendance_alerts: 0,
        camera_alerts: 0
    };
    const safeCoverageData = coverageData || [];
    const safeAttendanceData = attendanceData || [];
    const safeZones: Zone[] = zones || [];
    const metricsData = [
        {
            title: 'Overall Coverage',
            value: `${(safeStats.overallCoverage || 0).toFixed(1)}%`,
            status: (safeStats.overallCoverage || 0) >= 90 ? 'success' : (safeStats.overallCoverage || 0) >= 70 ? 'warning' : 'danger',
            icon: '📊',
            description: 'Site coverage percentage'
        },
        {
            title: 'Active Guards',
            value: safeStats.activeGuards || 0,
            status: (safeStats.activeGuards || 0) > 0 ? 'success' : 'danger',
            icon: '👮',
            description: 'Currently on duty'
        },
        {
            title: 'Active Incidents',
            value: safeStats.activeIncidents || 0,
            status: (safeStats.activeIncidents || 0) === 0 ? 'success' : (safeStats.activeIncidents || 0) > 5 ? 'danger' : 'warning',
            icon: '🚨',
            description: 'Open incidents'
        },
        {
            title: 'Flagged Guards',
            value: safeStats.flaggedGuards || 0,
            status: (safeStats.flaggedGuards || 0) === 0 ? 'success' : (safeStats.flaggedGuards || 0) > 3 ? 'danger' : 'warning',
            icon: '⚠️',
            description: 'High risk guards'
        },
        {
            title: 'Total Sites',
            value: safeStats.totalSites || 0,
            status: 'info',
            icon: '🏢',
            description: 'Active client sites'
        },
        {
            title: 'Total Clients',
            value: safeStats.totalClients || 0,
            status: 'info',
            icon: '👥',
            description: 'Active clients'
        },
        {
            title: 'Total Cameras',
            value: safeStats.totalCameras || 0,
            status: 'info',
            icon: '📹',
            description: 'Active cameras'
        },
        {
            title: 'Today Attendance',
            value: safeStats.todayAttendance || 0,
            status: (safeStats.todayAttendance || 0) > 0 ? 'success' : 'warning',
            icon: '✅',
            description: 'Guards checked in'
        },
        {
            title: 'Pending Incidents',
            value: safeStats.pendingIncidents || 0,
            status: (safeStats.pendingIncidents || 0) === 0 ? 'success' : 'warning',
            icon: '⏳',
            description: 'Awaiting resolution'
        },
        {
            title: 'Resolved Today',
            value: safeStats.resolvedIncidents || 0,
            status: 'success',
            icon: '✅',
            description: 'Incidents resolved'
        }
    ];

    return (
        <ControlRoomLayout
            title="Control Room Dashboard"
            user={auth?.user as User | undefined}
        >
            <Head title="Control Room Dashboard" />

            <div className="space-y-6">
                <PageHeader
                    title="Control Room Dashboard"
                    description="Live operations overview: coverage, incidents, alerts, and attendance trends."
                    actions={(
                        <Button
                            variant="outline"
                            className="h-10 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => window.location.reload()}
                        >
                            Refresh
                        </Button>
                    )}
                />
                <QuickRequisitionModal />
                <RequisitionSummary />

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {metricsData.map((metric, index) => (
                        <Card
                            key={index}
                            className={`border-l-4 ${
                                metric.status === 'success'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : metric.status === 'warning'
                                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                    : metric.status === 'danger'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-coin-600 bg-coin-50 dark:bg-coin-900/20'
                            } hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700`}
                        >
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl">{metric.icon}</div>
                                    <div
                                        className={`px-2 py-1 text-xs rounded-full ${
                                            metric.status === 'success'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                : metric.status === 'warning'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                                : metric.status === 'danger'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                                : 'bg-coin-100 text-coin-800 dark:bg-coin-900/40 dark:text-coin-200'
                                        }`}
                                    >
                                        {metric.status}
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
                                    {metric.title}
                                </div>
                                <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {metric.value}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {metric.description}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Live Monitoring */}
                <LiveMonitoring />

                {/* Zone Coverage & Recent Incidents */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Zone Coverage */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Zone Coverage Status
                            </h3>
                            <button
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
                                    showZoneCoverage
                                        ? 'bg-coin-700 text-white hover:bg-coin-800 dark:bg-coin-700 dark:hover:bg-coin-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                                onClick={() => setShowZoneCoverage(!showZoneCoverage)}
                                aria-expanded={showZoneCoverage}
                            >
                                {showZoneCoverage ? 'Hide' : 'Show'}
                            </button>
                        </CardHeader>
                        {showZoneCoverage && (
                            <CardContent>
                                <div className="space-y-4">
                                    {safeZones && safeZones.length > 0 ? (
                                        safeZones.map((zone: Zone) => (
                                            <div
                                                key={zone.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {zone.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {zone.guards}/{zone.required_guards} Guards •{' '}
                                                        {zone.sites} Sites
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                zone.coverage >= 90
                                                                    ? 'bg-green-500'
                                                                    : zone.coverage >= 70
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${Math.min(zone.coverage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div
                                                        className={`text-2xl font-bold ${
                                                            zone.coverage >= 90
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : zone.coverage >= 70
                                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                                : 'text-red-600 dark:text-red-400'
                                                        }`}
                                                    >
                                                        {zone.coverage.toFixed(1)}%
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {zone.coverage >= 90
                                                            ? 'Excellent'
                                                            : zone.coverage >= 70
                                                            ? 'Good'
                                                            : zone.coverage >= 50
                                                            ? 'Fair'
                                                            : 'Poor'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <EmptyState
                                          title="No zones"
                                          description="Zone coverage will appear here once zones are configured."
                                          size="sm"
                                          contentClassName="py-4"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Recent Incidents */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Recent Incidents
                            </h3>
                            <button
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
                                    showIncidents
                                        ? 'bg-coin-700 text-white hover:bg-coin-800 dark:bg-coin-700 dark:hover:bg-coin-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                                onClick={() => setShowIncidents(!showIncidents)}
                                aria-expanded={showIncidents}
                            >
                                {showIncidents ? 'Hide' : 'Show'}
                            </button>
                        </CardHeader>
                        {showIncidents && (
                            <CardContent>
                                <div className="space-y-3">
                                    {safeRecentIncidents.length > 0 ? (
                                        safeRecentIncidents.map((incident) => (
                                            <div
                                                key={incident.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {incident.title}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-1 text-xs rounded-full ${
                                                                incident.severity === 'high'
                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                                                    : incident.severity === 'medium'
                                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                                                    : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                            }`}
                                                        >
                                                            {incident.severity}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {incident.guard_name} • {incident.site_name} •{' '}
                                                        {incident.client_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                        {incident.created_at}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div
                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                            incident.status === 'open'
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                                                : incident.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                                                : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                        }`}
                                                    >
                                                        {incident.status}
                                                    </div>
                                                    {incident.escalation_level > 0 && (
                                                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                            Escalation Level {incident.escalation_level}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <EmptyState
                                          title="No recent incidents"
                                          description="You're all clear right now. New incidents will show up here."
                                          size="sm"
                                          contentClassName="py-4"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* Active Alerts and Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Alerts */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Active Alerts
                            </h3>
                            <button
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
                                    showAlerts
                                        ? 'bg-coin-700 text-white hover:bg-coin-800 dark:bg-coin-700 dark:hover:bg-coin-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                                onClick={() => setShowAlerts(!showAlerts)}
                                aria-expanded={showAlerts}
                            >
                                {showAlerts ? 'Hide' : 'Show'}
                            </button>
                        </CardHeader>
                        {showAlerts && (
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                        <div className="text-3xl mb-2">🚨</div>
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            {safeActiveAlerts.high_priority}
                                        </div>
                                        <div className="text-sm text-red-800 dark:text-red-200 font-medium">
                                            High Priority
                                        </div>
                                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            Critical incidents
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <div className="text-3xl mb-2">⚠️</div>
                                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {safeActiveAlerts.medium_priority}
                                        </div>
                                        <div className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                            Medium Priority
                                        </div>
                                        <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                            Moderate incidents
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-coin-50 dark:bg-coin-900/20 rounded-lg border border-coin-200 dark:border-coin-800">
                                        <div className="text-3xl mb-2">👥</div>
                                        <div className="text-2xl font-bold text-coin-700 dark:text-coin-200">
                                            {safeActiveAlerts.attendance_alerts}
                                        </div>
                                        <div className="text-sm text-coin-800 dark:text-coin-200 font-medium">
                                            Attendance Alerts
                                        </div>
                                        <div className="text-xs text-coin-700 dark:text-coin-200 mt-1">
                                            Missing checkouts
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-coin-50 dark:bg-coin-900/20 rounded-lg border border-coin-200 dark:border-coin-800">
                                        <div className="text-3xl mb-2">📹</div>
                                        <div className="text-2xl font-bold text-coin-700 dark:text-coin-200">
                                            {safeActiveAlerts.camera_alerts}
                                        </div>
                                        <div className="text-sm text-coin-800 dark:text-coin-200 font-medium">
                                            Camera Alerts
                                        </div>
                                        <div className="text-xs text-coin-700 dark:text-coin-200 mt-1">
                                            System alerts
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Active Alerts:{' '}
                                            <span className="font-bold text-gray-900 dark:text-gray-100">
                                                {safeActiveAlerts.high_priority +
                                                    safeActiveAlerts.medium_priority +
                                                    safeActiveAlerts.attendance_alerts +
                                                    safeActiveAlerts.camera_alerts}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Quick Actions */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Quick Actions
                            </h3>
                            <div className="flex gap-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={() => (window.location.href = route('control-room.tickets.create'))}
                                    variant="outline"
                                    className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <span className="text-lg">🎫</span>
                                    <span className="text-sm">Create Ticket</span>
                                </Button>
                                <Button
                                    onClick={() => (window.location.href = route('control-room.flags.create'))}
                                    variant="outline"
                                    className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <span className="text-lg">📝</span>
                                    <span className="text-sm">Report Issue</span>
                                </Button>
                                <Button
                                    onClick={() => (window.location.href = route('control-room.cameras.index'))}
                                    variant="outline"
                                    className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <span className="text-lg">📹</span>
                                    <span className="text-sm">View Cameras</span>
                                </Button>
                                <Button
                                    onClick={() => (window.location.href = route('control-room.reports'))}
                                    variant="outline"
                                    className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <span className="text-lg">📊</span>
                                    <span className="text-sm">Generate Report</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Weekly Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Weekly Coverage Trends
                            </h3>
                            <button
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
                                    showTrends
                                        ? 'bg-coin-700 text-white hover:bg-coin-800 dark:bg-coin-700 dark:hover:bg-coin-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                                onClick={() => setShowTrends(!showTrends)}
                                aria-expanded={showTrends}
                            >
                                {showTrends ? 'Hide' : 'Show'}
                            </button>
                        </CardHeader>
                        {showTrends && (
                            <CardContent>
                                <Suspense fallback={(
                                  <div className="h-48 flex flex-col justify-center gap-3">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-56" />
                                    <Skeleton className="h-24 w-full" />
                                  </div>
                                )}>
                                    <CoverageTrendChart zones={safeZones} />
                                </Suspense>
                            </CardContent>
                        )}
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Guard Attendance Overview
                            </h3>
                            <button
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
                                    showTrends
                                        ? 'bg-coin-700 text-white hover:bg-coin-800 dark:bg-coin-700 dark:hover:bg-coin-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                                onClick={() => setShowTrends(!showTrends)}
                                aria-expanded={showTrends}
                            >
                                {showTrends ? 'Hide' : 'Show'}
                            </button>
                        </CardHeader>
                        {showTrends && (
                            <CardContent>
                                <Suspense fallback={(
                                  <div className="h-48 flex flex-col justify-center gap-3">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-56" />
                                    <Skeleton className="h-24 w-full" />
                                  </div>
                                )}>
                                    <AttendanceChart zones={safeZones} />
                                </Suspense>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* Additional Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Coverage Data (Last 7 Days)</h3>
                            <button
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${showAnalytics ? 'bg-coin-700 text-white hover:bg-coin-800 dark:bg-coin-700 dark:hover:bg-coin-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                aria-expanded={showAnalytics}
                            >
                                {showAnalytics ? 'Hide' : 'Show'}
                            </button>
                        </CardHeader>
                        {showAnalytics && (
                            <CardContent>
                                <div className="space-y-2">
                                    {safeCoverageData.length > 0 ? safeCoverageData.map((point, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{point.date}</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                    <div 
                                                        className="bg-coin-600 h-2 rounded-full"
                                                        style={{ width: `${Math.min(point.coverage, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium w-12 text-right text-gray-900 dark:text-gray-100">{point.coverage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <EmptyState
                                          title="No coverage data"
                                          description="No coverage data available for the last 7 days."
                                          size="sm"
                                          contentClassName="py-2"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Attendance Data (Last 7 Days)</h3>
                            <button
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${showAnalytics ? 'bg-coin-700 text-white hover:bg-coin-800 dark:bg-coin-700 dark:hover:bg-coin-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                aria-expanded={showAnalytics}
                            >
                                {showAnalytics ? 'Hide' : 'Show'}
                            </button>
                        </CardHeader>
                        {showAnalytics && (
                            <CardContent>
                                <div className="space-y-2">
                                    {safeAttendanceData.length > 0 ? safeAttendanceData.map((point, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{point.date}</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                    <div 
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: `${Math.min(safeAttendanceData.length > 0 ? (point.attendance / Math.max(...safeAttendanceData.map(d => d.attendance))) * 100 : 0, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium w-12 text-right text-gray-900 dark:text-gray-100">{point.attendance}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <EmptyState
                                          title="No attendance data"
                                          description="No attendance data available for the last 7 days."
                                          size="sm"
                                          contentClassName="py-2"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </ControlRoomLayout>
    );
};

export default Dashboard;