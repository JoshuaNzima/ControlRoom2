import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';
import LiveMonitoring from '@/Components/ControlRoom/LiveMonitoring';
import QuickRequisitionModal from '@/Components/Requisitions/QuickRequisitionModal';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';
import useControlRoomEcho from '@/Hooks/useControlRoomEcho';
import { User } from '@/types';

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

// Modern Stat Card
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
        rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className={`${colors.icon} p-3 rounded-lg shadow-md`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {typeof value === 'number' ? <AnimatedCounter value={numericValue} suffix={isPercentage ? '%' : ''} /> : value}
        </p>
        <p className={`text-sm font-medium ${colors.text} mt-1`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
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
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${color}`} />
      <div className={`inline-flex p-3 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Access</span>
        <IconMapper name="ArrowRight" size={16} className="ml-1" />
      </div>
    </Link>
  );
};

// Mini Stat Component
const MiniStat: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-gray-900 dark:text-gray-100' }) => {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
};
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

export default function ControlRoomDashboard({ 
  stats, 
  recentIncidents, 
  activeAlerts, 
  coverageData, 
  attendanceData, 
  zones, 
  auth 
}: DashboardProps) {
  // Initialize control room echo
  useControlRoomEcho((scanEvent) => {
    console.log('QR Scan received:', scanEvent);
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'zones' | 'incidents' | 'analytics'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe values
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
    resolvedIncidents: stats?.resolvedIncidents ?? 0,
  };

  const safeRecentIncidents = recentIncidents || [];
  const safeActiveAlerts = activeAlerts || {
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0,
    attendance_alerts: 0,
    camera_alerts: 0,
  };
  const safeZones: Zone[] = zones || [];

  const safeRoute = useMemo(() => (name: string, params?: any) => {
    try {
      return route(name, params) as string;
    } catch {
      return '#';
    }
  }, []);

  // Quick actions
  const quickActions = useMemo(() => [
    { title: 'Create Ticket', description: 'Log a new incident or request', route: 'control-room.tickets.create', icon: <IconMapper name="Ticket" size={20} />, color: 'bg-blue-600' },
    { title: 'Report Issue', description: 'Flag guards or report problems', route: 'control-room.flags.create', icon: <IconMapper name="Flag" size={20} />, color: 'bg-amber-600' },
    { title: 'View Cameras', description: 'Monitor camera feeds', route: 'control-room.cameras.index', icon: <IconMapper name="Video" size={20} />, color: 'bg-purple-600' },
    { title: 'Generate Report', description: 'Create operational reports', route: 'control-room.reports', icon: <IconMapper name="FileText" size={20} />, color: 'bg-emerald-600' },
    { title: 'Manage Sites', description: 'View and manage all sites', route: 'control-room.sites.index', icon: <IconMapper name="Building" size={20} />, color: 'bg-cyan-600' },
    { title: 'Guard Roster', description: 'View guard assignments', route: 'control-room.guards.index', icon: <IconMapper name="Shield" size={20} />, color: 'bg-red-600' },
  ], []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <ControlRoomLayout title="Control Room Dashboard" user={auth?.user as User | undefined}>
      <Head title="Control Room Dashboard" />

      <QuickRequisitionModal />
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
                {/* Live Clock */}
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-200">System Time</p>
                  <p className="text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
                
                {/* Active Alerts Badge */}
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
          {[
            { id: 'overview', label: 'Overview', icon: 'LayoutGrid' },
            { id: 'zones', label: 'Zones', icon: 'Map' },
            { id: 'incidents', label: 'Incidents', icon: 'AlertTriangle' },
            { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
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

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat label="Total Sites" value={safeStats.totalSites} />
              <MiniStat label="Total Clients" value={safeStats.totalClients} />
              <MiniStat label="Total Cameras" value={safeStats.totalCameras} />
              <MiniStat 
                label="Pending Incidents" 
                value={safeStats.pendingIncidents} 
                color={safeStats.pendingIncidents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}
              />
            </div>

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
        )}

        {/* Zones Tab */}
        {activeTab === 'zones' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Zone Coverage Status</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Guard deployment across all zones</p>
                </div>
              </div>

              <div className="space-y-4">
                {safeZones.length > 0 ? (
                  safeZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{zone.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {zone.guards}/{zone.required_guards} Guards • {zone.sites} Sites
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              zone.coverage >= 90 ? 'bg-green-500' : zone.coverage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(zone.coverage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${
                          zone.coverage >= 90 ? 'text-green-600 dark:text-green-400' : 
                          zone.coverage >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {zone.coverage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {zone.coverage >= 90 ? 'Excellent' : zone.coverage >= 70 ? 'Good' : zone.coverage >= 50 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No zones configured"
                    description="Zone coverage will appear here once zones are configured."
                    size="sm"
                  />
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Active Alerts Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <IconMapper name="AlertOctagon" size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{safeActiveAlerts.high_priority}</p>
                    <p className="text-xs text-red-700 dark:text-red-300">High Priority</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-600 rounded-lg">
                    <IconMapper name="AlertTriangle" size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{safeActiveAlerts.medium_priority}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">Medium Priority</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <IconMapper name="Users" size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{safeActiveAlerts.attendance_alerts}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Attendance Alerts</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <IconMapper name="Video" size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{safeActiveAlerts.camera_alerts}</p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">Camera Alerts</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Incidents */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Incidents</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Latest incidents and their status</p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = safeRoute('control-room.tickets.index')}>
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {safeRecentIncidents.length > 0 ? (
                  safeRecentIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{incident.title}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {incident.guard_name} • {incident.site_name} • {incident.client_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{incident.created_at}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
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
                  />
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Coverage Data (Last 7 Days)</h3>
                <div className="space-y-2">
                  {(coverageData || []).length > 0 ? (coverageData || []).map((point, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{point.date}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${Math.min(point.coverage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right text-gray-900 dark:text-gray-100">
                          {point.coverage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )) : (
                    <EmptyState title="No coverage data" description="No coverage data available for the last 7 days." size="sm" />
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attendance Data (Last 7 Days)</h3>
                <div className="space-y-2">
                  {(attendanceData || []).length > 0 ? (attendanceData || []).map((point, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{point.date}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min((attendanceData || []).length > 0 ? (point.attendance / Math.max(...(attendanceData || []).map(d => d.attendance))) * 100 : 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right text-gray-900 dark:text-gray-100">
                          {point.attendance}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <EmptyState title="No attendance data" description="No attendance data available for the last 7 days." size="sm" />
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ControlRoomLayout>
  );
}