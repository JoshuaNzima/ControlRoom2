import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import StatCard from '@/Components/ControlRoom/StatCard';
import ActionTile from '@/Components/ControlRoom/ActionTile';
import MiniStat from '@/Components/ControlRoom/MiniStat';
import OverviewTab from '@/Components/ControlRoom/OverviewTab';
import ZonesTab from '@/Components/ControlRoom/ZonesTab';
import IncidentsTab from '@/Components/ControlRoom/IncidentsTab';
import AnalyticsTab from '@/Components/ControlRoom/AnalyticsTab';
import LiveMonitoring from '@/Components/ControlRoom/LiveMonitoring';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';
import IncentiveSummary from '@/Components/IncentiveSummary';
import QrScanDetailModal from '@/Components/ControlRoom/QrScanDetailModal';
import useControlRoomEcho from '@/Hooks/useControlRoomEcho';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { User } from '@/types';

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
  recentScans?: RecentScan[];
  incentiveSummary?: any;
  auth?: { user?: { name?: string } };
}

export default function ControlRoomDashboard({
  stats,
  recentIncidents,
  activeAlerts,
  coverageData,
  attendanceData,
  zones,
  recentScans,
  incentiveSummary,
  auth,
}: DashboardProps) {
  useControlRoomEcho((scanEvent) => {
    console.log('QR Scan received:', scanEvent);
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'zones' | 'incidents' | 'analytics'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Scan detail modal state
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [preloadedScanDetail, setPreloadedScanDetail] = useState<any>(null);

  const openScanDetail = (scanId: number) => {
    setSelectedScanId(scanId);
    fetch(route('control-room.operations-data.qr-scan-detail', scanId))
      .then(r => r.ok ? r.json() : null)
      .then(data => setPreloadedScanDetail(data))
      .catch(() => {});
    setShowScanModal(true);
  };

  const closeScanModal = () => {
    setShowScanModal(false);
    setSelectedScanId(null);
    setPreloadedScanDetail(null);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const safeActiveAlerts = activeAlerts || {
    high_priority: 0, medium_priority: 0, low_priority: 0,
    attendance_alerts: 0, camera_alerts: 0,
  };

  const safeRoute = useMemo(() => (name: string, params?: any) => {
    try {
      return route(name, params) as string;
    } catch {
      return '#';
    }
  }, []);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: 'LayoutGrid' },
    { id: 'zones' as const, label: 'Zones', icon: 'Map' },
    { id: 'incidents' as const, label: 'Incidents', icon: 'AlertTriangle' },
    { id: 'analytics' as const, label: 'Analytics', icon: 'BarChart3' },
  ];

  return (
    <AuthenticatedLayout header="Control Room Dashboard" user={auth?.user as User | undefined}>
      <Head title="Control Room Dashboard" />
      <RequisitionSummary />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="Monitor" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Control Room</h1>
                  <p className="text-red-100 mt-1">Live operations monitoring & incident management</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-200">System Time</p>
                  <p className="text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
                {(safeActiveAlerts.high_priority + safeActiveAlerts.medium_priority) > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-lg backdrop-blur-sm border border-amber-400/30">
                    <IconMapper name="AlertTriangle" size={18} className="text-amber-300" />
                    <div>
                      <p className="text-xs text-amber-200">Alerts</p>
                      <p className="text-sm font-semibold">{safeActiveAlerts.high_priority + safeActiveAlerts.medium_priority} Active</p>
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <IconMapper name="RefreshCw" size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <IconMapper name={tab.icon as any} size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={safeStats}
            recentScans={recentScans || []}
            incentiveSummary={incentiveSummary}
            safeRoute={safeRoute}
            activeAlerts={safeActiveAlerts}
            openScanDetail={openScanDetail}
          />
        )}

        {activeTab === 'zones' && <ZonesTab zones={zones} />}

        {activeTab === 'incidents' && (
          <IncidentsTab
            recentIncidents={recentIncidents || []}
            activeAlerts={safeActiveAlerts}
            safeRoute={safeRoute}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab coverageData={coverageData} attendanceData={attendanceData} />
        )}
      </div>

      <QrScanDetailModal
        isOpen={showScanModal}
        scanId={selectedScanId}
        onClose={closeScanModal}
        initialData={preloadedScanDetail}
      />
    </AuthenticatedLayout>
  );
}
