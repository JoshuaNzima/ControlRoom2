import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import { route } from 'ziggy-js';
import IconMapper from '@/Components/IconMapper';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';
import useCounters from '@/Hooks/useCounters';
import EmptyState from '@/Components/ui/empty-state';
import ScannerModal from '@/Components/Scanner/ScannerModal';

// Type Definitions
interface Auth {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface SystemStats {
  total_users: number;
  active_users: number;
  total_guards: number;
  active_guards: number;
  total_clients: number;
  total_attendance_records: number;
  database_size: string;
  cache_size: string;
}

interface Module {
  id: number;
  display_name: string;
  version: string;
  is_active: boolean;
  is_core: boolean;
  description: string;
  icon: string;
  category: string;
  route: string;
  order: number;
}

interface SystemHealth {
  php_version: string;
  laravel_version: string;
  database: string;
  cache: string;
  storage_free: string;
  memory_usage: string;
  uptime: string;
}

interface Log {
  message: string;
  time: string;
}

interface UserActivity {
  name: string;
  role: string;
  last_active: string;
}

interface DatabaseInfo {
  tables: number;
  records: number;
}

interface AuditTrail {
  user: string;
  action: string;
  time: string;
  ip: string;
}

interface AdminAction {
  route: string;
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}

interface SuperAdminDashboardProps {
  auth: Auth;
  systemStats: SystemStats;
  ops_analytics?: {
    date?: string;
    downs_open?: number;
    downs_escalated?: number;
    downs_guard_absent_open?: number;
    downs_resolved_today?: number;
    attendance_absent_today?: number;
    attendance_covered_today?: number;
    attendance_checked_in_today?: number;
    deployments_today?: number;
  };
  modules: Module[];
  systemHealth: SystemHealth;
  recentLogs: Log[];
  userActivity: UserActivity[];
  databaseInfo: DatabaseInfo;
  auditTrail: AuditTrail[];
  adminActions: AdminAction[];
  isSuperAdmin: boolean;
  isMaintenance?: boolean;
  canSeePendingAdmin?: boolean;
  canSeeFinanceApprovals?: boolean;
}

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
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
  
  return <span>{count.toLocaleString()}</span>;
};

// Progress Ring for System Health
const ProgressRing: React.FC<{ value: number; size?: number; strokeWidth?: number; color: string }> = ({ 
  value, size = 60, strokeWidth = 4, color 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

// Modern Stat Card with trend
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan';
  onClick?: () => void;
}

const colorMap = {
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-600 text-white',
    text: 'text-red-700 dark:text-red-300',
    trend: 'text-red-600 dark:text-red-400'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'bg-blue-600 text-white',
    text: 'text-blue-700 dark:text-blue-300',
    trend: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'bg-emerald-600 text-white',
    text: 'text-emerald-700 dark:text-emerald-300',
    trend: 'text-emerald-600 dark:text-emerald-400'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'bg-amber-600 text-white',
    text: 'text-amber-700 dark:text-amber-300',
    trend: 'text-amber-600 dark:text-amber-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'bg-purple-600 text-white',
    text: 'text-purple-700 dark:text-purple-300',
    trend: 'text-purple-600 dark:text-purple-400'
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: 'bg-cyan-600 text-white',
    text: 'text-cyan-700 dark:text-cyan-300',
    trend: 'text-cyan-600 dark:text-cyan-400'
  }
};

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, trend, trendValue, color, onClick }) => {
  const colors = colorMap[color];
  
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
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium ${colors.trend}`}>
            {trend === 'up' && <IconMapper name="TrendingUp" size={14} />}
            {trend === 'down' && <IconMapper name="TrendingDown" size={14} />}
            {trend === 'neutral' && <IconMapper name="Minus" size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          <AnimatedCounter value={value} />
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

// Activity Timeline Item
const TimelineItem: React.FC<{ 
  icon: React.ReactNode; 
  iconColor: string;
  title: string; 
  subtitle: string; 
  time: string;
  isLast?: boolean;
}> = ({ icon, iconColor, title, subtitle, time, isLast }) => {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${iconColor} text-white shadow-md`}>
          {icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-2" />}
      </div>
      <div className="flex-1 pb-6">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC<SuperAdminDashboardProps> = ({
  auth,
  systemStats,
  ops_analytics,
  modules,
  systemHealth,
  recentLogs,
  userActivity,
  databaseInfo,
  auditTrail,
  isSuperAdmin,
  isMaintenance,
  canSeePendingAdmin,
  canSeeFinanceApprovals,
}) => {
  const { counters } = useCounters();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'system' | 'activity'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // System health calculation
  const isDbOk = systemHealth.database === 'Connected';
  const isCacheOk = systemHealth.cache === 'Working';
  const isHealthy = isDbOk && isCacheOk;
  const healthScore = isHealthy ? 100 : isDbOk || isCacheOk ? 70 : 40;
  
  const safeRoute = React.useCallback((name: string, params?: any) => {
    try {
      return route(name, params) as unknown as string;
    } catch {
      return null;
    }
  }, []);

  // Dashboard launchpad items
  const launchpadItems = useMemo(() => [
    { name: 'Admin', routeName: 'admin.dashboard', icon: 'LayoutDashboard', color: 'bg-blue-600', badge: counters?.requisitions_pending_admin },
    { name: 'Control Room', routeName: 'control-room.dashboard', icon: 'Monitor', color: 'bg-red-600', badge: counters?.control_downs_active },
    { name: 'Finance', routeName: 'finance.dashboard', icon: 'Wallet', color: 'bg-emerald-600', badge: counters?.finance_approvals_pending },
    { name: 'HR', routeName: 'hr.dashboard', icon: 'Users2', color: 'bg-purple-600' },
    { name: 'Training', routeName: 'training.dashboard', icon: 'GraduationCap', color: 'bg-orange-600' },
    { name: 'Assets', routeName: 'assets.index', icon: 'Boxes', color: 'bg-amber-600' },
    { name: 'K9 Unit', routeName: 'admin.business-dev.k9.dashboard', icon: 'Shield', color: 'bg-teal-600' },
    { name: 'Front Office', routeName: 'front-office.dashboard', icon: 'Building2', color: 'bg-cyan-600' },
    { name: 'Manager', routeName: 'manager.dashboard', icon: 'Briefcase', color: 'bg-sky-600' },
    { name: 'Zone Commander', routeName: 'zone-commander.dashboard', icon: 'MapPin', color: 'bg-lime-600' },
    { name: 'Supervisor', routeName: 'supervisor.dashboard', icon: 'UserCheck', color: 'bg-violet-600' },
    { name: 'Client', routeName: 'client.dashboard', icon: 'Building', color: 'bg-rose-600' },
    { name: 'Reports', routeName: 'superadmin.reports.index', icon: 'BarChart3', color: 'bg-indigo-600' },
    { name: 'Messages', routeName: 'messages.conversations.index', icon: 'MessageSquareText', color: 'bg-pink-600', badge: counters?.notifications_unread },
  ], [counters]);

  // Quick actions
  const quickActions = useMemo(() => [
    { title: 'User Management', description: 'Manage system users & roles', route: 'superadmin.users', icon: <IconMapper name="Users" size={20} />, color: 'bg-blue-600' },
    { title: 'Guard Management', description: 'Manage security guards', route: 'superadmin.guards', icon: <IconMapper name="ShieldCheck" size={20} />, color: 'bg-red-600' },
    { title: 'System Settings', description: 'Configure core settings', route: 'superadmin.settings', icon: <IconMapper name="Settings" size={20} />, color: 'bg-gray-600' },
    { title: 'Security Center', description: 'Auth, sessions & tokens', route: 'superadmin.security', icon: <IconMapper name="Shield" size={20} />, color: 'bg-amber-600' },
    { title: 'Database Backup', description: 'Backup & restore data', route: 'superadmin.backup', icon: <IconMapper name="Database" size={20} />, color: 'bg-emerald-600' },
    { title: 'System Logs', description: 'View application logs', route: 'superadmin.logs', icon: <IconMapper name="FileText" size={20} />, color: 'bg-amber-600' },
    { title: 'Module Control', description: 'Enable/disable modules', route: 'superadmin.modules', icon: <IconMapper name="Puzzle" size={20} />, color: 'bg-purple-600' },
  ], []);

  return (
    <SuperAdminLayout title="Super Admin Dashboard" user={auth.user}>
      <Head title="Super Admin Dashboard" />
      
      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="Crown" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Command Center</h1>
                  <p className="text-red-100 mt-1">Complete system oversight & management</p>
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
                
                {/* System Status */}
                <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-xs text-red-200">Status</p>
                    <p className="text-sm font-semibold">{isHealthy ? 'Operational' : 'Degraded'}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setScannerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition"
                >
                  <IconMapper name="ScanLine" size={18} />
                  <span className="hidden sm:inline">Scan QR</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Module Access Bar */}
          <div className="relative border-t border-white/10 bg-black/10 backdrop-blur-sm">
            <div className="px-4 sm:px-8 py-3 flex gap-2 overflow-x-auto">
              {launchpadItems.map((item) => {
                const href = safeRoute(item.routeName);
                if (!href) return null;
                const badgeCount = Number(item.badge || 0);
                
                return (
                  <Link
                    key={item.routeName}
                    href={href}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition whitespace-nowrap group"
                  >
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.name}</span>
                    {badgeCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-red-500 rounded-full">{badgeCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: 'LayoutGrid' },
            { id: 'system', label: 'System Health', icon: 'Activity' },
            { id: 'activity', label: 'Activity', icon: 'History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<IconMapper name="Users" size={20} />}
                title="Total Users"
                value={systemStats.total_users}
                subtitle={`${systemStats.active_users} active`}
                color="blue"
                trend="up"
                trendValue="12%"
              />
              <StatCard
                icon={<IconMapper name="ShieldCheck" size={20} />}
                title="Guards"
                value={systemStats.total_guards}
                subtitle={`${systemStats.active_guards} on duty`}
                color="red"
                trend="neutral"
                trendValue="steady"
              />
              <StatCard
                icon={<IconMapper name="Building2" size={20} />}
                title="Clients"
                value={systemStats.total_clients}
                subtitle="Active accounts"
                color="green"
                trend="up"
                trendValue="5%"
              />
              <StatCard
                icon={<IconMapper name="ClipboardCheck" size={20} />}
                title="Attendance"
                value={systemStats.total_attendance_records}
                subtitle="Total records"
                color="amber"
              />
            </div>

            {/* Operations Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Operations */}
              <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Operations Today</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{ops_analytics?.date || new Date().toLocaleDateString()}</p>
                  </div>
                  <Link 
                    href={safeRoute('control-room.dashboard') || '#'}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Control Room →
                  </Link>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {counters?.downs_open || ops_analytics?.downs_open || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Open Downs</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {counters?.downs_escalated || ops_analytics?.downs_escalated || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Escalated</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {counters?.attendance_checked_in_today || ops_analytics?.attendance_checked_in_today || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Checked In</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {counters?.deployments_today || ops_analytics?.deployments_today || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Deployments</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.slice(0, 4).map((action) => {
                    const href = safeRoute(action.route);
                    if (!href) return null;
                    return (
                      <Link
                        key={action.route}
                        href={href}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                      >
                        <div className={`${action.color} p-2 rounded-lg text-white`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                        </div>
                        <IconMapper name="ChevronRight" size={16} className="text-gray-400 group-hover:text-red-500 transition" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KPIs Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: 'My Requisitions', value: counters?.requisitions_my_open || 0, icon: 'ClipboardList', color: 'blue' },
                { label: 'Needs Revision', value: counters?.requisitions_needs_revision || 0, icon: 'AlertCircle', color: 'amber' },
                ...(canSeePendingAdmin ? [{ label: 'Pending Admin', value: counters?.requisitions_pending_admin || 0, icon: 'Clock', color: 'red' }] : []),
                ...(canSeeFinanceApprovals ? [{ label: 'Finance Approvals', value: counters?.finance_approvals_pending || 0, icon: 'CheckCircle', color: 'green' }] : []),
                { label: 'Tickets Open', value: counters?.control_tickets_open || 0, icon: 'Ticket', color: 'purple' },
                { label: 'Incidents', value: counters?.control_incidents_open || 0, icon: 'AlertTriangle', color: 'rose' },
              ].map((kpi, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <IconMapper name={kpi.icon as any} size={18} className={`text-${kpi.color}-500`} />
                    {kpi.value > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpi.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
                </div>
              ))}
            </div>

            <RequisitionSummary />

            {/* All Quick Actions Grid */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Management Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const href = safeRoute(action.route);
                  if (!href) return null;
                  return (
                    <ActionTile
                      key={action.route}
                      icon={action.icon}
                      title={action.title}
                      description={action.description}
                      href={href}
                      color={action.color}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Health Score Card */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <ProgressRing 
                      value={healthScore} 
                      size={80} 
                      strokeWidth={6} 
                      color={isHealthy ? '#10b981' : '#f59e0b'} 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{healthScore}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Health Score</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isHealthy ? 'All systems operational' : 'Some systems need attention'}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'PHP', value: systemHealth.php_version, ok: true },
                    { label: 'Laravel', value: systemHealth.laravel_version, ok: true },
                    { label: 'Database', value: systemHealth.database, ok: isDbOk },
                    { label: 'Cache', value: systemHealth.cache, ok: isCacheOk },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <IconMapper name="Database" size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Database</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Size</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{systemStats.database_size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tables</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{databaseInfo.tables}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Records</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{databaseInfo.records.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <IconMapper name="Cpu" size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Resources</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Memory Usage</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{systemHealth.memory_usage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Cache Size</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{systemStats.cache_size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Storage</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{systemHealth.storage_free}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                    <IconMapper name="Clock" size={20} className="text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">System</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Uptime</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{systemHealth.uptime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Maintenance</span>
                    <span className={`font-medium ${isMaintenance ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isMaintenance ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                {/* Maintenance Toggle */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      if (isMaintenance) {
                        if (confirm('Disable maintenance mode?')) {
                          const href = safeRoute('superadmin.maintenance.disable');
                          if (href) router.post(href);
                        }
                      } else {
                        const href = safeRoute('superadmin.maintenance.enable');
                        if (href) router.post(href);
                      }
                    }}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition ${
                      isMaintenance
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {isMaintenance ? 'Disable Maintenance' : 'Enable Maintenance'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modules Status */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Module Status</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className={`p-4 rounded-lg border transition-all ${
                      module.is_active
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconMapper 
                          name={module.icon as any} 
                          size={20} 
                          className={module.is_active ? 'text-emerald-600' : 'text-gray-400'} 
                        />
                        <div>
                          <p className={`text-sm font-medium ${module.is_active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                            {module.display_name}
                          </p>
                          <p className="text-xs text-gray-500">v{module.version}</p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${module.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </div>
                    {module.is_core && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">Core Module</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            {isSuperAdmin && (
              <div className="rounded-xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <IconMapper name="AlertTriangle" size={24} className="text-red-600" />
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-200">Danger Zone</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      if (confirm('Clear all system caches? This may temporarily slow down the application.')) {
                        const href = safeRoute('superadmin.cache.clear');
                        if (href) router.post(href);
                      }
                    }}
                    className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <IconMapper name="Trash2" size={18} />
                    Clear Caches
                  </button>
                  <Link
                    href={safeRoute('superadmin.backup') || '#'}
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <IconMapper name="HardDrive" size={18} />
                    Backup Database
                  </Link>
                  <Link
                    href={safeRoute('superadmin.cache') || '#'}
                    className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <IconMapper name="Settings" size={18} />
                    Cache Manager
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Activity Timeline */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-6">Recent User Activity</h3>
                {userActivity.length === 0 ? (
                  <EmptyState title="No recent activity" description="User activity will appear here." size="sm" />
                ) : (
                  <div>
                    {userActivity.map((activity, index) => (
                      <TimelineItem
                        key={index}
                        icon={<IconMapper name="User" size={14} />}
                        iconColor="bg-blue-500"
                        title={activity.name}
                        subtitle={activity.role}
                        time={activity.last_active}
                        isLast={index === userActivity.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Trail */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-6">Audit Trail</h3>
                {auditTrail.length === 0 ? (
                  <EmptyState title="No audit events" description="Audit events will appear here." size="sm" />
                ) : (
                  <div>
                    {auditTrail.map((audit, index) => (
                      <TimelineItem
                        key={index}
                        icon={<IconMapper name="Search" size={14} />}
                        iconColor="bg-purple-500"
                        title={audit.action}
                        subtitle={`${audit.user} • ${audit.ip}`}
                        time={audit.time}
                        isLast={index === auditTrail.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System Logs */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">System Logs</h3>
                <Link 
                  href={safeRoute('superadmin.logs') || '#'}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  View All →
                </Link>
              </div>
              <div className="p-6">
                {recentLogs.length === 0 ? (
                  <EmptyState title="No logs available" description="System logs will appear here." size="sm" />
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recentLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-xs font-mono"
                      >
                        <p className="text-gray-600 dark:text-gray-400 truncate">{log.message}</p>
                        <p className="text-gray-400 dark:text-gray-500 mt-1">{log.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default Dashboard;
