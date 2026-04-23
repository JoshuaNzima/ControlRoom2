import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import OperationsLayout from '@/Layouts/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';
import QrScanDetailModal from '@/Components/ControlRoom/QrScanDetailModal';
import CheckpointDetailModal from '@/Components/ControlRoom/CheckpointDetailModal';
import { User } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number; suffix?: string }> = ({ 
  value, duration = 1000, suffix = '' 
}) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan' | 'emerald';
  onClick?: () => void;
}

const colorMap = {
  red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color, onClick }) => {
  const colors = colorMap[color];
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;
  const isPercentage = typeof value === 'string' && value.includes('%');
  
  return (
    <div 
      onClick={onClick}
      className={`${colors.bg} ${colors.border} ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} 
        rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className={`${colors.icon} p-2.5 sm:p-3 rounded-lg shadow-md`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 sm:mt-4">
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {typeof value === 'number' ? <AnimatedCounter value={numericValue} suffix={isPercentage ? '%' : ''} /> : value}
        </p>
        <p className={`text-xs sm:text-sm font-medium ${colors.text} mt-1`}>{title}</p>
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

// Quick Action Tile
const ActionTile: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  href: string; 
  color: string;
}> = ({ icon, title, description, href, color }) => {
  if (!href || href === '#') return null;

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800 p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 -mr-6 sm:-mr-8 -mt-6 sm:-mt-8 rounded-full opacity-10 ${color}`} />
      <div className={`inline-flex p-2.5 sm:p-3 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
      <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Access</span>
        <IconMapper name="ArrowRight" size={14} className="ml-1" />
      </div>
    </Link>
  );
};

// Site Card Component
interface Site {
  id: number;
  name: string;
  client_name: string;
  zone_name: string;
  guard_count: number;
  required_guards: number;
  attendance_today: number;
  status: 'active' | 'inactive' | 'understaffed';
  risk_level?: 'low' | 'medium' | 'high';
  last_incident?: string;
}

const SiteCard: React.FC<{ site: Site }> = ({ site }) => {
  const coverage = site.required_guards > 0 ? Math.round((site.guard_count / site.required_guards) * 100) : 0;
  const attendanceRate = site.guard_count > 0 ? Math.round((site.attendance_today / site.guard_count) * 100) : 0;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'understaffed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="p-3 sm:p-4 rounded-lg border hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group dark:border-gray-800 dark:hover:border-blue-700/40 dark:hover:bg-blue-900/10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm sm:text-base group-hover:text-blue-900 transition-colors dark:text-gray-100 dark:group-hover:text-blue-200 truncate">
              {site.name}
            </h4>
            <Badge variant="outline" className={`text-[10px] ${getStatusColor(site.status)}`}>
              {site.status}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{site.client_name} • {site.zone_name}</p>
          
          <div className="mt-2 sm:mt-3 space-y-1.5">
            {/* Coverage Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 w-16 sm:w-20">Coverage</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                <div
                  className={`h-1.5 sm:h-2 rounded-full ${coverage >= 90 ? 'bg-green-500' : coverage >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(coverage, 100)}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-medium w-8 sm:w-10 text-right">{coverage}%</span>
            </div>
            
            {/* Attendance Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 w-16 sm:w-20">Attendance</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                <div
                  className={`h-1.5 sm:h-2 rounded-full ${attendanceRate >= 90 ? 'bg-green-500' : attendanceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-medium w-8 sm:w-10 text-right">{attendanceRate}%</span>
            </div>
          </div>
        </div>
        
        <div className="text-left sm:text-right flex sm:block items-center gap-3 sm:gap-0">
          <p className="font-medium text-sm sm:text-base text-blue-600 dark:text-blue-200">
            {site.guard_count}/{site.required_guards} Guards
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {site.attendance_today} Present
          </p>
          {site.last_incident && (
            <p className="text-[10px] sm:text-xs text-red-500 dark:text-red-400 mt-0 sm:mt-1">
              Incident: {formatDistanceToNow(new Date(site.last_incident), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Personnel Summary Card
interface Personnel {
  guards: {
    total: number;
    active: number;
    on_duty: number;
    unassigned: number;
  };
  supervisors: {
    total: number;
    active_today: number;
  };
  zone_commanders: {
    total: number;
    zones_with_commander: number;
    zones_total: number;
  };
}

// Deployment Summary
interface Deployment {
  zone_name: string;
  total_sites: number;
  covered_sites: number;
  total_guards: number;
  active_guards: number;
  coverage_percentage: number;
}

interface QrScanSummary {
  totalToday: number;
  successful: number;
  failed: number;
  bySite: Array<{
    site_name: string;
    scan_count: number;
    last_scan: string;
  }>;
  byHour: Array<{
    hour: string;
    count: number;
  }>;
  recentScans: Array<{
    id: number;
    guard_name: string;
    site_name: string;
    checkpoint_name: string;
    type: 'check_in' | 'check_out' | 'patrol';
    status: 'success' | 'failed';
    scanned_at: string;
 }>;
}

interface OperationsDashboardProps {
  stats: {
    overallCoverage: number;
    activeGuards: number;
    totalSites: number;
    activeIncidents: number;
    flaggedGuards: number;
    totalClients: number;
    todayAttendance: number;
    understaffedSites: number;
    pendingReplacements: number;
  };
  sites: Site[];
  deployments: Deployment[];
  personnel: Personnel;
  recentIncidents: Array<{
    id: number;
    title: string;
    severity: string;
    status: string;
    site_name: string;
    client_name: string;
    created_at: string;
  }>;
  escalatedIncidents?: Array<{
    id: number;
    title: string;
    severity: string;
    status: string;
    escalation_level: number;
    reported_by: string;
    client_name: string;
    site_name: string;
    updated_at: string;
  }>;
  escalatedDowns?: Array<{
    id: number;
    title: string;
    status: string;
    escalation_level: number;
    reported_by: string;
    client_name: string;
    site_name: string;
    updated_at: string;
  }>;
  qrScanSummary?: QrScanSummary;
  auth?: { user?: { name?: string } };
}

export default function OperationsDashboard({
  stats,
  sites,
  deployments,
  personnel,
  recentIncidents,
  escalatedIncidents = [],
  escalatedDowns = [],
  qrScanSummary: initialQrScanSummary,
  auth,
}: OperationsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'deployments' | 'personnel' | 'qr-scans'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrScanSummary, setQrScanSummary] = useState(initialQrScanSummary);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Modal state
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<number | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live data polling for QR scans (every 30 seconds when on QR tab)
  const refreshQrData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(route('control-room.operations-data.qr-scans'));
      if (response.ok) {
        const data = await response.json();
        setQrScanSummary(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh QR data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (activeTab === 'qr-scans') {
      const interval = setInterval(refreshQrData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab, refreshQrData]);

  const openScanDetail = (scanId: number) => {
    setSelectedScanId(scanId);
    setShowScanModal(true);
  };

  const openCheckpointDetail = (checkpointId: number) => {
    setSelectedCheckpointId(checkpointId);
    setShowCheckpointModal(true);
  };

  const closeScanModal = () => {
    setShowScanModal(false);
    setSelectedScanId(null);
  };

  const closeCheckpointModal = () => {
    setShowCheckpointModal(false);
    setSelectedCheckpointId(null);
  };

  const safeRoute = useMemo(() => (name: string, params?: any) => {
    try {
      return route(name, params) as string;
    } catch {
      return '#';
    }
  }, []);

  const safeStats = {
    overallCoverage: stats?.overallCoverage ?? 0,
    activeGuards: stats?.activeGuards ?? 0,
    totalSites: stats?.totalSites ?? 0,
    activeIncidents: stats?.activeIncidents ?? 0,
    flaggedGuards: stats?.flaggedGuards ?? 0,
    totalClients: stats?.totalClients ?? 0,
    todayAttendance: stats?.todayAttendance ?? 0,
    understaffedSites: stats?.understaffedSites ?? 0,
    pendingReplacements: stats?.pendingReplacements ?? 0,
  };

  // Quick actions for Operations Officer - focused on field ops
  const quickActions = useMemo(() => [
    { title: 'Site Coverage', description: 'View deployment across all sites', route: 'operations.coverage.index', icon: <IconMapper name="Building" size={20} />, color: 'bg-blue-600' },
    { title: 'Guard Roster', description: 'Manage field personnel', route: 'operations.guards.index', icon: <IconMapper name="Shield" size={20} />, color: 'bg-cyan-600' },
    { title: 'Deployments', description: 'Site deployment status', route: 'operations.coverage.sites', icon: <IconMapper name="MapPin" size={20} />, color: 'bg-emerald-600' },
    { title: 'Shift Roster', description: 'Weekly guard scheduling', route: 'operations.shifts.index', icon: <IconMapper name="Calendar" size={20} />, color: 'bg-amber-600' },
    { title: 'Reports', description: 'Field operations reports', route: 'operations.reports.attendance', icon: <IconMapper name="FileText" size={20} />, color: 'bg-orange-600' },
    { title: 'Incidents', description: 'Field incident reports', route: 'operations.reports.incidents', icon: <IconMapper name="AlertTriangle" size={20} />, color: 'bg-red-600' },
  ], []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'check_in': return <IconMapper name="LogIn" size={14} className="text-green-500" />;
      case 'check_out': return <IconMapper name="LogOut" size={14} className="text-orange-500" />;
      case 'patrol': return <IconMapper name="Footprints" size={14} className="text-blue-500" />;
      default: return <IconMapper name="ScanLine" size={14} />;
    }
  };

  const getScanTypeLabel = (type: string) => {
    switch (type) {
      case 'check_in': return 'Check In';
      case 'check_out': return 'Check Out';
      case 'patrol': return 'Patrol';
      default: return type;
    }
  };

  return (
    <OperationsLayout title="Operations Dashboard" user={auth?.user as User | undefined}>
      <Head title="Operations Dashboard" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Hero Header - Field Operations Focus */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="MapPin" size={28} className="sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Field Operations</h1>
                  <p className="text-emerald-100 mt-0.5 sm:mt-1 text-sm sm:text-base">Site coverage, deployments & field personnel management</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {/* Live Clock */}
                <div className="px-3 sm:px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-[10px] sm:text-xs text-emerald-200">System Time</p>
                  <p className="text-base sm:text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
                
                {/* Field Status Badge */}
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                  <div className={`w-2 h-2 rounded-full ${safeStats.understaffedSites === 0 ? 'bg-green-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                  <div>
                    <p className="text-[10px] sm:text-xs text-emerald-200">Field Status</p>
                    <p className="text-xs sm:text-sm font-semibold">
                      {safeStats.understaffedSites === 0 ? 'All Sites Covered' : `${safeStats.understaffedSites} Understaffed`}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { refreshQrData(); window.location.reload(); }}
                  disabled={isRefreshing}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 disabled:opacity-50"
                >
                  <IconMapper name="RefreshCw" size={14} className={`mr-1.5 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 sm:gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit flex-wrap">
          {[
            { id: 'overview', label: 'Overview', icon: 'LayoutGrid' },
            { id: 'sites', label: 'Site Status', icon: 'Building' },
            { id: 'deployments', label: 'Deployments', icon: 'Map' },
            { id: 'personnel', label: 'Personnel', icon: 'Users' },
            { id: 'qr-scans', label: 'QR Scans', icon: 'ScanLine' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <IconMapper name={tab.icon as any} size={14} className="sm:w-4 sm:h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab - Field Operations Focus */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            {/* Key Field Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                icon={<IconMapper name="Activity" size={18} className="sm:w-5 sm:h-5" />}
                title="Coverage"
                value={`${safeStats.overallCoverage.toFixed(1)}%`}
                subtitle="Sites with guards"
                color={safeStats.overallCoverage >= 90 ? 'green' : safeStats.overallCoverage >= 70 ? 'amber' : 'red'}
              />
              <StatCard
                icon={<IconMapper name="Shield" size={18} className="sm:w-5 sm:h-5" />}
                title="Field Guards"
                value={safeStats.activeGuards}
                subtitle="Active personnel"
                color="blue"
              />
              <StatCard
                icon={<IconMapper name="Building" size={18} className="sm:w-5 sm:h-5" />}
                title="Sites"
                value={safeStats.totalSites}
                subtitle={`${safeStats.understaffedSites} understaffed`}
                color={safeStats.understaffedSites === 0 ? 'green' : 'amber'}
              />
              <StatCard
                icon={<IconMapper name="AlertTriangle" size={18} className="sm:w-5 sm:h-5" />}
                title="Incidents"
                value={safeStats.activeIncidents}
                subtitle="Field issues today"
                color={safeStats.activeIncidents === 0 ? 'green' : safeStats.activeIncidents > 5 ? 'red' : 'amber'}
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Card className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-emerald-600 rounded-lg">
                    <IconMapper name="CheckCircle" size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{safeStats.todayAttendance}</p>
                    <p className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-300">Checked In</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
                    <IconMapper name="Briefcase" size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{safeStats.totalClients}</p>
                    <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300">Clients</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-amber-600 rounded-lg">
                    <IconMapper name="Flag" size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{safeStats.flaggedGuards}</p>
                    <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-300">Flagged</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-red-600 rounded-lg">
                    <IconMapper name="UserX" size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{safeStats.pendingReplacements}</p>
                    <p className="text-[10px] sm:text-xs text-red-700 dark:text-red-300">Need Replacements</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Critical Sites & Recent Incidents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Understaffed Sites */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                    <span className="flex items-center gap-2">
                      <IconMapper name="Building" className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                      Sites Needing Attention
                    </span>
                    <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-100 text-xs sm:text-sm">
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="space-y-3">
                    {sites?.filter(s => s.status === 'understaffed' || s.guard_count < s.required_guards).slice(0, 5).map((site) => (
                      <SiteCard key={site.id} site={site} />
                    ))}
                    {(!sites || sites.filter(s => s.status === 'understaffed' || s.guard_count < s.required_guards).length === 0) && (
                      <EmptyState
                        title="All sites properly staffed"
                        description="No sites are currently understaffed."
                        size="sm"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Field Incidents */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                    <span className="flex items-center gap-2">
                      <IconMapper name="AlertTriangle" className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                      Recent Field Incidents
                    </span>
                    <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-100 text-xs sm:text-sm">
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="space-y-3">
                    {recentIncidents?.slice(0, 5).map((incident) => (
                      <div key={incident.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className={`p-2 rounded-full ${getSeverityColor(incident.severity)}`}>
                          <IconMapper name="AlertTriangle" size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm dark:text-gray-100 truncate">{incident.title}</h4>
                            <Badge className={`text-[10px] ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {incident.site_name} • {incident.client_name}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            {format(new Date(incident.created_at), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!recentIncidents || recentIncidents.length === 0) && (
                      <EmptyState
                        title="No recent incidents"
                        description="Field operations are running smoothly."
                        size="sm"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Escalated Incidents */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                    <span className="flex items-center gap-2">
                      <IconMapper name="AlertOctagon" className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                      Escalated Incidents ({escalatedIncidents?.length ?? 0})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="space-y-3">
                    {escalatedIncidents?.slice(0, 5).map((incident) => (
                      <div key={incident.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          <IconMapper name="AlertTriangle" size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm dark:text-gray-100 truncate">{incident.title}</h4>
                            <Badge className={`text-[10px] ${
                              incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                              incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {incident.site_name} • Level {incident.escalation_level}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            Reported by {incident.reported_by}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!escalatedIncidents || escalatedIncidents.length === 0) && (
                      <EmptyState
                        title="No escalated incidents"
                        description="All incidents at normal priority."
                        size="sm"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Employee Issues / Downs */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                    <span className="flex items-center gap-2">
                      <IconMapper name="UserX" className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                      Employee Issues ({escalatedDowns?.length ?? 0})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="space-y-3">
                    {escalatedDowns?.slice(0, 5).map((down) => (
                      <div key={down.id} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                          <IconMapper name="UserMinus" size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm dark:text-gray-100 truncate">{down.title}</h4>
                            <Badge className="text-[10px] bg-orange-100 text-orange-800">
                              L{down.escalation_level}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {down.site_name} • {down.status}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            Reported by {down.reported_by}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!escalatedDowns || escalatedDowns.length === 0) && (
                      <EmptyState
                        title="No employee issues"
                        description="No escalated downs reported."
                        size="sm"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Field Ops Focused */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Field Operations</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
        )}

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">All Sites Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {sites?.map((site) => (
                    <SiteCard key={site.id} site={site} />
                  ))}
                  {(!sites || sites.length === 0) && (
                    <EmptyState
                      title="No sites configured"
                      description="Sites will appear here once configured."
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deployments Tab */}
        {activeTab === 'deployments' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {deployments?.map((deployment) => (
                <Card key={deployment.zone_name} className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">{deployment.zone_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Sites Covered</span>
                        <span className="font-medium dark:text-gray-100">{deployment.covered_sites}/{deployment.total_sites}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${deployment.coverage_percentage >= 90 ? 'bg-green-500' : deployment.coverage_percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(deployment.coverage_percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-gray-500 dark:text-gray-400">Active Guards</span>
                        <span className="font-medium dark:text-gray-100">{deployment.active_guards}/{deployment.total_guards}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${deployment.coverage_percentage >= 90 ? 'text-green-600 dark:text-green-400' : deployment.coverage_percentage >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                          {deployment.coverage_percentage}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!deployments || deployments.length === 0) && (
                <div className="col-span-full">
                  <EmptyState
                    title="No deployment data"
                    description="Zone deployment data will appear here."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personnel Tab */}
        {activeTab === 'personnel' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Guards Summary */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <IconMapper name="Shield" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    Guards
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                      <span className="font-medium dark:text-gray-100">{personnel?.guards?.total ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Active</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{personnel?.guards?.active ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">On Duty</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{personnel?.guards?.on_duty ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{personnel?.guards?.unassigned ?? 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supervisors Summary */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <IconMapper name="Users" className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    Supervisors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                      <span className="font-medium dark:text-gray-100">{personnel?.supervisors?.total ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Active Today</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{personnel?.supervisors?.active_today ?? 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Zone Commanders Summary */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <IconMapper name="Map" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                    Zone Commanders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Total Commanders</span>
                      <span className="font-medium dark:text-gray-100">{personnel?.zone_commanders?.total ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Zones Covered</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {personnel?.zone_commanders?.zones_with_commander ?? 0}/{personnel?.zone_commanders?.zones_total ?? 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${(personnel?.zone_commanders?.zones_total ?? 0) > 0 ? ((personnel?.zone_commanders?.zones_with_commander ?? 0) / personnel?.zone_commanders?.zones_total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* QR Scans Tab */}
        {activeTab === 'qr-scans' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            {/* Live indicator & Last refresh */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live data</span>
                <span className="text-slate-400">· Last updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshQrData}
                disabled={isRefreshing}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <IconMapper name="RefreshCw" size={12} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Now
              </Button>
            </div>

            {/* QR Scan Stats - Clickable */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card 
                className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => {
                  const firstScan = qrScanSummary?.recentScans?.[0];
                  if (firstScan) openScanDetail(firstScan.id);
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-emerald-600 rounded-lg">
                    <IconMapper name="ScanLine" size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{qrScanSummary?.totalToday ?? 0}</p>
                    <p className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-300">Total Scans Today</p>
                  </div>
                </div>
              </Card>
              <Card 
                className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => {
                  const successScan = qrScanSummary?.recentScans?.find(s => s.status === 'success');
                  if (successScan) openScanDetail(successScan.id);
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-green-600 rounded-lg">
                    <IconMapper name="CheckCircle" size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{qrScanSummary?.successful ?? 0}</p>
                    <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300">Successful</p>
                  </div>
                </div>
              </Card>
              <Card 
                className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => {
                  const failedScan = qrScanSummary?.recentScans?.find(s => s.status === 'failed');
                  if (failedScan) openScanDetail(failedScan.id);
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-red-600 rounded-lg">
                    <IconMapper name="XCircle" size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{qrScanSummary?.failed ?? 0}</p>
                    <p className="text-[10px] sm:text-xs text-red-700 dark:text-red-300">Failed</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
                    <IconMapper name="Building" size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{qrScanSummary?.bySite?.length ?? 0}</p>
                    <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300">Sites Active</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Scans */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                    <span className="flex items-center gap-2">
                      <IconMapper name="History" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                      Recent Scans
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="space-y-3">
                    {qrScanSummary?.recentScans?.slice(0, 10).map((scan) => (
                      <div 
                        key={scan.id} 
                        onClick={() => openScanDetail(scan.id)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${scan.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                          {getScanTypeIcon(scan.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm dark:text-gray-100 truncate">{scan.guard_name}</h4>
                            <Badge className={`text-[10px] ${scan.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                              {scan.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {scan.site_name} • <span className="font-medium text-gray-600 dark:text-gray-300">{scan.checkpoint_name}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {getScanTypeLabel(scan.type)} · {formatDistanceToNow(new Date(scan.scanned_at), { addSuffix: true })}
                          </p>
                        </div>
                        <IconMapper name="ChevronRight" size={16} className="text-gray-400 dark:text-gray-500" />
                      </div>
                    ))}
                    {(!qrScanSummary?.recentScans || qrScanSummary.recentScans.length === 0) && (
                      <EmptyState
                        title="No scans today"
                        description="QR scans will appear here as guards check in."
                        size="sm"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Scans by Site */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                    <span className="flex items-center gap-2">
                      <IconMapper name="Building" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      Scans by Site
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="space-y-3">
                    {qrScanSummary?.bySite?.slice(0, 10).map((site, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm dark:text-gray-100 truncate">{site.site_name}</h4>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            Last scan: {formatDistanceToNow(new Date(site.last_scan), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{site.scan_count}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">scans</p>
                        </div>
                      </div>
                    ))}
                    {(!qrScanSummary?.bySite || qrScanSummary.bySite.length === 0) && (
                      <EmptyState
                        title="No site activity"
                        description="Site scan data will appear here."
                        size="sm"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hourly Activity Chart */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Hourly Scan Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {(() => {
                    const counts = qrScanSummary?.byHour?.map(h => h.count) || [1];
                    const maxCount = Math.max(1, ...counts);
                    return qrScanSummary?.byHour?.map((hour, index) => {
                      const percentage = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-16 sm:w-20">{hour.hour}</span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 sm:h-6 overflow-hidden">
                            <div
                              className="h-4 sm:h-6 rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-medium w-8 sm:w-10 text-right dark:text-gray-100">{hour.count}</span>
                        </div>
                      );
                    });
                  })()}
                  {(!qrScanSummary?.byHour || qrScanSummary.byHour.length === 0) && (
                    <EmptyState
                      title="No hourly data"
                      description="Hourly scan activity will be displayed here."
                      size="sm"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <QrScanDetailModal
        isOpen={showScanModal}
        scanId={selectedScanId}
        onClose={closeScanModal}
      />
      <CheckpointDetailModal
        isOpen={showCheckpointModal}
        checkpointId={selectedCheckpointId}
        onClose={closeCheckpointModal}
      />
    </OperationsLayout>
  );
}
