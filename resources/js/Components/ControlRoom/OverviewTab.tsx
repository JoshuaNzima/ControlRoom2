import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import StatCard from '@/Components/ControlRoom/StatCard';
import MiniStat from '@/Components/ControlRoom/MiniStat';
import ActionTile from '@/Components/ControlRoom/ActionTile';
import LiveMonitoring from '@/Components/ControlRoom/LiveMonitoring';
import IncentiveSummary from '@/Components/IncentiveSummary';

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
  todayScans: number;
}

interface RecentScan {
  id: number;
  supervisor_name: string;
  site_name: string;
  checkpoint_name: string;
  client_name: string;
  scanned_at: string;
  location_quality: string;
  location_verified: boolean;
}

interface ActiveAlerts {
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  attendance_alerts: number;
  camera_alerts: number;
}

interface OverviewTabProps {
  stats: DashboardStats;
  recentScans: RecentScan[];
  incentiveSummary: any;
  safeRoute: (name: string, params?: any) => string;
  activeAlerts: ActiveAlerts;
  openScanDetail: (scanId: number) => void;
}

export default function OverviewTab({
  stats,
  recentScans,
  incentiveSummary,
  safeRoute,
  activeAlerts,
  openScanDetail,
}: OverviewTabProps) {
  const safeStats = useMemo(() => ({
    overallCoverage: stats?.overallCoverage ?? 0,
    activeGuards: stats?.activeGuards ?? 0,
    totalSites: stats?.totalSites ?? 0,
    activeIncidents: stats?.activeIncidents ?? 0,
    flaggedGuards: stats?.flaggedGuards ?? 0,
    totalClients: stats?.totalClients ?? 0,
    totalCameras: stats?.totalCameras ?? 0,
    todayAttendance: stats?.todayAttendance ?? 0,
    pendingIncidents: stats?.pendingIncidents ?? 0,
    resolvedIncidents: stats?.resolvedIncidents ?? 0,
    todayScans: stats?.todayScans ?? 0,
  }), [stats]);

  const safeRecentScans: RecentScan[] = recentScans || [];

  const quickActions = useMemo(() => [
    { title: 'Tickets', description: 'View and manage tickets', route: 'control-room.tickets.index', icon: <IconMapper name="Ticket" size={20} />, color: 'bg-blue-600' },
    { title: 'Flags', description: 'Guard flags and reports', route: 'control-room.flags.index', icon: <IconMapper name="Flag" size={20} />, color: 'bg-amber-600' },
    { title: 'Cameras', description: 'Monitor camera feeds', route: 'control-room.cameras.index', icon: <IconMapper name="Video" size={20} />, color: 'bg-purple-600' },
    { title: 'Incidents', description: 'Manage incidents', route: 'control-room.incidents.index', icon: <IconMapper name="AlertTriangle" size={20} />, color: 'bg-red-600' },
    { title: 'Scan Tags', description: 'QR scan activity feed', route: 'control-room.scan-tags', icon: <IconMapper name="ScanLine" size={20} />, color: 'bg-emerald-600' },
    { title: 'Guards', description: 'View guard roster', route: 'control-room.guards.index', icon: <IconMapper name="Shield" size={20} />, color: 'bg-cyan-600' },
    { title: 'Attendance', description: 'Daily attendance records', route: 'control-room.attendance.index', icon: <IconMapper name="CalendarCheck" size={20} />, color: 'bg-indigo-600' },
    { title: 'Downs', description: 'Down reports', route: 'control-room.downs.index', icon: <IconMapper name="ArrowDown" size={20} />, color: 'bg-rose-600' },
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<IconMapper name="Activity" size={20} />}
          title="Overall Coverage"
          value={`${safeStats.overallCoverage.toFixed(1)}%`}
          subtitle="Site coverage percentage"
          color={safeStats.overallCoverage >= 90 ? 'green' : safeStats.overallCoverage >= 70 ? 'amber' : 'red'}
        />
        <StatCard
          icon={<IconMapper name="Shield" size={20} />}
          title="Active Guards"
          value={safeStats.activeGuards}
          subtitle="Currently on duty"
          color="blue"
        />
        <StatCard
          icon={<IconMapper name="AlertTriangle" size={20} />}
          title="Active Incidents"
          value={safeStats.activeIncidents}
          subtitle="Open incidents"
          color={safeStats.activeIncidents === 0 ? 'green' : safeStats.activeIncidents > 5 ? 'red' : 'amber'}
        />
        <StatCard
          icon={<IconMapper name="Flag" size={20} />}
          title="Flagged Guards"
          value={safeStats.flaggedGuards}
          subtitle="High risk guards"
          color={safeStats.flaggedGuards === 0 ? 'green' : 'amber'}
        />
        <StatCard
          icon={<IconMapper name="CheckCircle" size={20} />}
          title="Today's Attendance"
          value={safeStats.todayAttendance}
          subtitle="Guards checked in"
          color="emerald"
        />
      </div>

      {/* Live Monitoring */}
      <LiveMonitoring />

      {/* Incentive Summary */}
      {incentiveSummary && (
        <IncentiveSummary
          stats={incentiveSummary}
          period={{ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }}
          canCalculate={false}
        />
      )}

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MiniStat label="Total Sites" value={safeStats.totalSites} />
        <MiniStat label="Total Clients" value={safeStats.totalClients} />
        <MiniStat label="Total Cameras" value={safeStats.totalCameras} />
        <MiniStat
          label="Today's Scans"
          value={safeStats.todayScans}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <MiniStat
          label="Pending Incidents"
          value={safeStats.pendingIncidents}
          color={safeStats.pendingIncidents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}
        />
      </div>

      {/* Recent Scan Feed */}
      {safeRecentScans.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-6 shadow-sm shadow-black/5 dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconMapper name="ScanLine" size={20} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent QR Scans</h3>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {safeRecentScans.length}
              </span>
            </div>
            {safeRoute('control-room.scan-tags') !== '#' && (
              <Link href={safeRoute('control-room.scan-tags')} className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium">
                View All →
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {safeRecentScans.map((scan) => {
              const scannedAt = scan.scanned_at ? new Date(scan.scanned_at) : null;
              const timeAgo = scannedAt ? (() => {
                const diff = Date.now() - scannedAt.getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return 'just now';
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
              })() : '';
              return (
                <div
                  key={scan.id}
                  onClick={() => openScanDetail(scan.id)}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${scan.location_verified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      <IconMapper name={scan.location_verified ? 'CheckCircle' : 'MapPin'} size={14} className={scan.location_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{scan.supervisor_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {scan.site_name}
                        {scan.checkpoint_name && <> · <span className="font-medium text-gray-600 dark:text-gray-300">{scan.checkpoint_name}</span></>}
                        {scan.client_name && <> · {scan.client_name}</>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
                    {scan.location_quality && scan.location_quality !== 'unknown' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        scan.location_quality === 'high' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        scan.location_quality === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {scan.location_quality} GPS
                      </span>
                    )}
                    <IconMapper name="ChevronRight" size={14} className="text-gray-400 dark:text-gray-500 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <ActionTile
              key={action.route}
              icon={action.icon}
              title={action.title}
              description={action.description}
              href={safeRoute(action.route)}
              color={action.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
