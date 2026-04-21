import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import OperationsLayout from '@/Layouts/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';
import { User } from '@/types';
import { format, formatDistanceToNow, subDays } from 'date-fns';

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
          {typeof value === 'number' ? <AnimatedCounter value={numericValue} /> : value}
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
      <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
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

// QR Analytics Types
interface QrAnalytics {
  today: {
    total: number;
    successful: number;
    failed: number;
    bySite: Array<{ site_name: string; count: number; last_scan: string }>;
    byHour: Array<{ hour: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  };
  week: {
    total: number;
    dailyTrend: Array<{ date: string; count: number }>;
    byGuard: Array<{ guard_name: string; scan_count: number; site_name: string }>;
  };
  issues: {
    failedScans: number;
    gpsMismatches: number;
    duplicateScans: number;
    suspiciousActivity: Array<{
      guard_name: string;
      issue: string;
      count: number;
      site_name: string;
    }>;
  };
}

interface OperationsManagerDashboardProps {
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
  deployments: Array<{
    zone_name: string;
    total_sites: number;
    covered_sites: number;
    total_guards: number;
    active_guards: number;
    coverage_percentage: number;
  }>;
  qrAnalytics: QrAnalytics;
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
  auth?: { user?: { name?: string } };
}

export default function OperationsManagerDashboard({
  stats,
  sites,
  deployments,
  qrAnalytics,
  recentIncidents,
  escalatedIncidents = [],
  escalatedDowns = [],
  auth,
}: OperationsManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'deployments' | 'qr-analytics' | 'issues'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const quickActions = useMemo(() => [
    { title: 'Site Coverage', description: 'View deployment across all sites', route: 'operations.coverage.index', icon: <IconMapper name="Building" size={20} />, color: 'bg-blue-600' },
    { title: 'Guard Roster', description: 'Manage field personnel', route: 'control-room.guards', icon: <IconMapper name="Shield" size={20} />, color: 'bg-cyan-600' },
    { title: 'Deployments', description: 'Assign guards to sites', route: 'control-room.assignments.index', icon: <IconMapper name="MapPin" size={20} />, color: 'bg-emerald-600' },
    { title: 'Zone Map', description: 'Visual zone coverage', route: 'control-room.zones.index', icon: <IconMapper name="Map" size={20} />, color: 'bg-purple-600' },
    { title: 'Shift Roster', description: 'Weekly guard scheduling', route: 'control-room.roster.index', icon: <IconMapper name="Calendar" size={20} />, color: 'bg-amber-600' },
    { title: 'Reports', description: 'Field operations reports', route: 'operations.reports.attendance', icon: <IconMapper name="FileText" size={20} />, color: 'bg-orange-600' },
    { title: 'Incidents', description: 'Field incident management', route: 'control-room.downs.index', icon: <IconMapper name="AlertTriangle" size={20} />, color: 'bg-red-600' },
    { title: 'Attendance', description: 'Daily attendance records', route: 'control-room.attendance.index', icon: <IconMapper name="UserCheck" size={20} />, color: 'bg-indigo-600' },
  ], []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <OperationsLayout title="Operations Manager Dashboard" user={auth?.user as User | undefined} showQrScanner={true}>
      <Head title="Operations Manager Dashboard" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Hero Header - Manager View */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-700 via-amber-600 to-orange-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="Crown" size={28} className="sm:w-8 sm:h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Operations Manager</h1>
                    <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/30 text-amber-100 text-xs font-medium border border-amber-400/30">
                      Elevated Access
                    </span>
                  </div>
                  <p className="text-amber-100 mt-0.5 sm:mt-1 text-sm sm:text-base">Field operations oversight, analytics & performance management</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="px-3 sm:px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-[10px] sm:text-xs text-amber-200">System Time</p>
                  <p className="text-base sm:text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <IconMapper name="RefreshCw" size={14} className="mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
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
            { id: 'qr-analytics', label: 'QR Analytics', icon: 'ScanLine' },
            { id: 'issues', label: 'Issues & Alerts', icon: 'AlertTriangle' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <IconMapper name={tab.icon as any} size={14} className="sm:w-4 sm:h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            {/* Key Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
                icon={<IconMapper name="ScanLine" size={18} className="sm:w-5 sm:h-5" />}
                title="QR Scans"
                value={qrAnalytics?.today?.total ?? 0}
                subtitle="Today"
                color="emerald"
              />
              <StatCard
                icon={<IconMapper name="AlertTriangle" size={18} className="sm:w-5 sm:h-5" />}
                title="Incidents"
                value={safeStats.activeIncidents}
                subtitle="Field issues"
                color={safeStats.activeIncidents === 0 ? 'green' : safeStats.activeIncidents > 5 ? 'red' : 'amber'}
              />
              <StatCard
                icon={<IconMapper name="XCircle" size={18} className="sm:w-5 sm:h-5" />}
                title="Failed Scans"
                value={qrAnalytics?.today?.failed ?? 0}
                subtitle="QR issues today"
                color={qrAnalytics?.today?.failed === 0 ? 'green' : 'red'}
              />
            </div>

            {/* QR Analytics Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Today's Scan Breakdown */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <IconMapper name="ScanLine" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                    Today's QR Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Scans</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{qrAnalytics?.today?.total ?? 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-emerald-500"
                        style={{ width: `${qrAnalytics?.today?.total > 0 ? (qrAnalytics?.today?.successful / qrAnalytics?.today?.total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{qrAnalytics?.today?.successful ?? 0} Successful</span>
                      <span>{qrAnalytics?.today?.failed ?? 0} Failed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 7-Day Trend */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <IconMapper name="TrendingUp" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    7-Day Scan Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="flex items-end gap-1 h-24 sm:h-32">
                    {qrAnalytics?.week?.dailyTrend?.map((day, index) => {
                      const maxCount = Math.max(1, ...(qrAnalytics?.week?.dailyTrend?.map(d => d.count) || [1]));
                      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`${format(new Date(day.date), 'MMM d')}: ${day.count} scans`}
                          />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 rotate-0 sm:rotate-0">
                            {format(new Date(day.date), 'EEE')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Week Total: {qrAnalytics?.week?.total ?? 0}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Avg: {qrAnalytics?.week?.total ? Math.round(qrAnalytics.week.total / 7) : 0}/day
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Guards */}
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <IconMapper name="Award" className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                    Top Scanners (7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <div className="space-y-3">
                    {qrAnalytics?.week?.byGuard?.slice(0, 5).map((guard, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-xs">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium dark:text-gray-100 truncate">{guard.guard_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{guard.site_name}</p>
                        </div>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{guard.scan_count}</span>
                      </div>
                    ))}
                    {(!qrAnalytics?.week?.byGuard || qrAnalytics.week.byGuard.length === 0) && (
                      <EmptyState title="No data" description="Guard scan data will appear here." size="sm" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Field Operations</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sites?.map((site) => (
                    <div key={site.id} className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm dark:text-gray-100">{site.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{site.client_name} • {site.zone_name}</p>
                        </div>
                        <Badge className={`${site.status === 'understaffed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {site.status}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Guards</span>
                          <span>{site.guard_count}/{site.required_guards}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Attendance</span>
                          <span>{site.attendance_today} present</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!sites || sites.length === 0) && (
                    <EmptyState title="No sites" description="Sites will appear here once configured." />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deployments Tab */}
        {activeTab === 'deployments' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deployments?.map((deployment) => (
                <Card key={deployment.zone_name} className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{deployment.zone_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sites Covered</span>
                        <span className="font-medium">{deployment.covered_sites}/{deployment.total_sites}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${deployment.coverage_percentage >= 90 ? 'bg-green-500' : deployment.coverage_percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(deployment.coverage_percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${deployment.coverage_percentage >= 90 ? 'text-green-600' : deployment.coverage_percentage >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {deployment.coverage_percentage}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* QR Analytics Tab */}
        {activeTab === 'qr-analytics' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            {/* Scan Type Breakdown */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Scan Types Today</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {qrAnalytics?.today?.byType?.map((type) => (
                    <div key={type.type} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{type.count}</p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">{type.type.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Sites by Scan Activity */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Top Sites by Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {qrAnalytics?.today?.bySite?.slice(0, 10).map((site, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm dark:text-gray-100 truncate">{site.site_name}</h4>
                        <p className="text-xs text-gray-400">
                          Last: {formatDistanceToNow(new Date(site.last_scan), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{site.count}</p>
                        <p className="text-xs text-gray-500">scans</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            {/* Issue Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{qrAnalytics?.issues?.failedScans ?? 0}</p>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">Failed Scans</p>
                </div>
              </Card>
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">{qrAnalytics?.issues?.gpsMismatches ?? 0}</p>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">GPS Mismatches</p>
                </div>
              </Card>
              <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{qrAnalytics?.issues?.duplicateScans ?? 0}</p>
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">Duplicate Scans</p>
                </div>
              </Card>
            </div>

            {/* Suspicious Activity */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <IconMapper name="AlertTriangle" className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  Suspicious Activity Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {qrAnalytics?.issues?.suspiciousActivity?.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <IconMapper name="AlertCircle" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm dark:text-gray-100">{activity.guard_name}</h4>
                        <p className="text-xs text-red-600 dark:text-red-400">{activity.issue}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.site_name} • {activity.count} occurrences</p>
                      </div>
                    </div>
                  ))}
                  {(!qrAnalytics?.issues?.suspiciousActivity || qrAnalytics.issues.suspiciousActivity.length === 0) && (
                    <EmptyState
                      title="No suspicious activity"
                      description="No anomalies detected in QR scanning patterns."
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Escalated Incidents */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <IconMapper name="AlertOctagon" className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  Escalated Incidents ({escalatedIncidents?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {escalatedIncidents?.map((incident) => (
                    <div key={incident.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <IconMapper name="AlertTriangle" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm dark:text-gray-100">{incident.title}</h4>
                          <Badge className={`text-xs ${
                            incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                            incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {incident.client_name} • {incident.site_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Reported by {incident.reported_by} • Level {incident.escalation_level}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(incident.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {(!escalatedIncidents || escalatedIncidents.length === 0) && (
                    <EmptyState
                      title="No escalated incidents"
                      description="All incidents are at normal priority levels."
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employee Issues / Downs */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <IconMapper name="UserX" className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                  Employee Issues / Downs ({escalatedDowns?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {escalatedDowns?.map((down) => (
                    <div key={down.id} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
                      <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        <IconMapper name="UserMinus" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm dark:text-gray-100">{down.title}</h4>
                          <Badge className="text-xs bg-orange-100 text-orange-800">
                            Level {down.escalation_level}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {down.client_name} • {down.site_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Reported by {down.reported_by} • Status: {down.status}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(down.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {(!escalatedDowns || escalatedDowns.length === 0) && (
                    <EmptyState
                      title="No employee issues"
                      description="No escalated downs or employee issues reported."
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </OperationsLayout>
  );
}
