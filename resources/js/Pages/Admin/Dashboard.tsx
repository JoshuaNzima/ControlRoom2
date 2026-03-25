import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { formatCurrencyMWK } from '@/Components/format';
import { Button } from '@/Components/ui/button';
import EmptyState from '@/Components/ui/empty-state';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import useCounters from '@/Hooks/useCounters';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import IncentiveSummary from '@/Components/IncentiveSummary';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string }> = ({ 
  value, duration = 1000, prefix = '', suffix = '' 
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
  
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// Modern Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan' | 'emerald';
  onClick?: () => void;
  isCurrency?: boolean;
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

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color, onClick, isCurrency }) => {
  const colors = colorMap[color];
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;
  
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
          {isCurrency ? formatCurrencyMWK(numericValue) : 
           typeof value === 'number' ? <AnimatedCounter value={numericValue} /> : value}
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

// Recharts type assertions
const ResponsiveContainerFixed = ResponsiveContainer as React.ComponentType<any>;
const LineChartFixed = LineChart as React.ComponentType<any>;
const AreaChartFixed = AreaChart as React.ComponentType<any>;
const BarChartFixed = BarChart as React.ComponentType<any>;
const CartesianGridFixed = CartesianGrid as React.ComponentType<any>;
const XAxisFixed = XAxis as React.ComponentType<any>;
const YAxisFixed = YAxis as React.ComponentType<any>;
const TooltipFixed = Tooltip as React.ComponentType<any>;
const LineFixed = Line as React.ComponentType<any>;
const AreaFixed = Area as React.ComponentType<any>;
const BarFixed = Bar as React.ComponentType<any>;

type Stats = {
  total_guards?: number;
  active_guards?: number;
  on_duty_today?: number;
  total_users?: number;
  active_clients?: number;
  total_sites?: number;
  shifts_today?: number;
  attendance_rate?: number;
};

type AttendancePoint = { date: string; present: number; absent?: number };
type CoveragePoint = { date: string; coverage: number };
type GuardStats = { active?: number; inactive?: number; suspended?: number };
type Activity = { id: string | number; message: string; time: string; type: string };
type TopGuard = { name: string; employee_id: string; attendance_rate: number };
type AuthShape = { user?: { name?: string } };
type KPIs = {
  hr?: any;
  hr_users?: any;
  hr_guards?: any;
  finance?: any;
  it?: any;
  control_room?: any;
  operations?: any;
  k9?: any;
  administration?: any;
  supervisor_incentives?: any;
  incentive_system?: {
    total_types?: number;
    total_rules?: number;
    pending_entries?: number;
    approved_entries?: number;
    paid_entries?: number;
    pending_amount?: number;
    paid_amount_mtd?: number;
  };
  cross_module?: any;
};

type OpsAnalytics = {
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

interface Props {
  stats?: Stats;
  attendanceTrend?: AttendancePoint[];
  zoneCoverage?: CoveragePoint[];
  guardStats?: GuardStats;
  recentActivity?: Activity[];
  topGuards?: TopGuard[];
  kpis?: KPIs;
  ops_analytics?: OpsAnalytics;
  recognizedRevenueYtd?: number;
  coverageSummary?: {
    guards_deployed_today?: number;
    guards_required_total?: number;
    sites_covered_today?: number;
    sites_total?: number;
    guards_coverage_pct?: number;
    sites_coverage_pct?: number;
    clients_with_outstanding?: number;
    outstanding_value?: number;
    clients_total?: number;
  };
  auth?: AuthShape;
  paymentsSummary?: {
    clients_with_outstanding?: number;
    outstanding_value?: number;
    total_clients?: number;
  };
  modules?: { name: string; display_name?: string; is_active?: boolean; color?: string; icon?: string }[];
  systemHealth?: { database?: string; cache?: string; queue?: string; storage?: number };
  approvalsPending?: number;
}

// KPI Section Component
const KpiSection: React.FC<{ 
  title: string; 
  subtitle?: string; 
  data?: Record<string, any>; 
  items: { label: string; key: string; prefix?: string; suffix?: string }[];
  linkMap?: Record<string, string>;
}> = ({ title, subtitle, data = {}, items, linkMap = {} }) => {
  const [open, setOpen] = useState(true);
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <button 
          type="button" 
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
            open 
              ? 'bg-red-100 text-red-900 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
          }`} 
          onClick={() => setOpen(!open)}
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((i) => {
            const rawValue = data?.[i.key] ?? 0;
            const isCurrency = i.prefix === '$';
            const display = isCurrency ? formatCurrencyMWK(Number(rawValue)) : `${i.prefix ?? ''}${rawValue}${i.suffix ?? ''}`;
            const routeName = linkMap[i.key];
            
            const content = (
              <>
                <div className="text-xs text-gray-500 dark:text-gray-400">{i.label}</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{display}</div>
              </>
            );
            
            return routeName ? (
              <button 
                key={i.key} 
                onClick={() => window.location.href = route(routeName)} 
                className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                {content}
              </button>
            ) : (
              <div key={i.key} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                {content}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default function Dashboard({
  stats = {},
  attendanceTrend = [],
  zoneCoverage = [],
  guardStats = {},
  recentActivity = [],
  topGuards = [],
  kpis = {},
  ops_analytics = {},
  recognizedRevenueYtd = 0,
  coverageSummary = {},
  auth = {},
  paymentsSummary,
  modules = [],
  systemHealth = {},
  approvalsPending = 0,
}: Props) {
  const { counters } = useCounters();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'hr' | 'finance' | 'controlRoom' | 'operations' | 'assets' | 'incentives' | 'analytics'>('overview');
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

  // Quick module access
  const moduleAccess = useMemo(() => [
    { name: 'Control Room', route: 'control-room.dashboard', icon: 'Monitor', color: 'bg-red-600', badge: counters?.control_downs_active },
    { name: 'Finance', route: 'finance.dashboard', icon: 'Wallet', color: 'bg-emerald-600', badge: counters?.finance_approvals_pending },
    { name: 'HR', route: 'hr.dashboard', icon: 'Users2', color: 'bg-purple-600' },
    { name: 'Assets', route: 'assets.index', icon: 'Boxes', color: 'bg-amber-600' },
    { name: 'Reports', route: 'admin.reports.index', icon: 'BarChart3', color: 'bg-indigo-600' },
    { name: 'Messages', route: 'messages.conversations.index', icon: 'MessageSquareText', color: 'bg-pink-600', badge: counters?.notifications_unread },
  ], [counters]);

  // Quick actions
  const quickActions = useMemo(() => [
    { title: 'Manage Clients', description: 'View and manage all clients', route: 'admin.clients.index', icon: <IconMapper name="Building2" size={20} />, color: 'bg-blue-600' },
    { title: 'View Services', description: 'Manage security services', route: 'admin.services.index', icon: <IconMapper name="Package" size={20} />, color: 'bg-purple-600' },
    { title: 'User Management', description: 'Manage system users', route: 'admin.users.index', icon: <IconMapper name="Users" size={20} />, color: 'bg-cyan-600' },
    { title: 'Approvals', description: 'Review pending approvals', route: 'admin.approvals.index', icon: <IconMapper name="CheckCircle" size={20} />, color: 'bg-emerald-600' },
    { title: 'Payments', description: 'Check payment status', route: 'admin.payments.index', icon: <IconMapper name="DollarSign" size={20} />, color: 'bg-amber-600' },
    { title: 'Settings', description: 'Configure system settings', route: 'admin.settings.index', icon: <IconMapper name="Settings" size={20} />, color: 'bg-gray-600' },
  ], []);

  return (
    <AdminLayout title="Admin Dashboard" user={auth?.user as any}>
      <Head title="Admin Dashboard" />

      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="LayoutDashboard" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Admin Command Center</h1>
                  <p className="text-red-100 mt-1">System administration & operations oversight</p>
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
                
                {/* Pending Approvals Badge */}
                {approvalsPending > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-lg backdrop-blur-sm border border-amber-400/30">
                    <IconMapper name="AlertCircle" size={18} className="text-amber-300" />
                    <div>
                      <p className="text-xs text-amber-200">Pending</p>
                      <p className="text-sm font-semibold">{approvalsPending} Approvals</p>
                    </div>
                  </div>
                )}
                
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
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit flex-wrap">
          {[
            { id: 'overview', label: 'Overview', icon: 'LayoutGrid' },
            { id: 'operations', label: 'Operations', icon: 'Activity' },
            { id: 'hr', label: 'HR', icon: 'Users' },
            { id: 'finance', label: 'Finance', icon: 'Wallet' },
            { id: 'controlRoom', label: 'Control Room', icon: 'Monitor' },
            { id: 'assets', label: 'Assets', icon: 'Boxes' },
            { id: 'incentives', label: 'Incentives', icon: 'Award' },
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
            {/* Finance KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<IconMapper name="AlertTriangle" size={20} />}
                title="Outstanding"
                value={paymentsSummary?.outstanding_value || 0}
                subtitle={`${paymentsSummary?.clients_with_outstanding || 0} clients overdue`}
                color="red"
                isCurrency
              />
              <StatCard
                icon={<IconMapper name="DollarSign" size={20} />}
                title="Revenue YTD"
                value={recognizedRevenueYtd}
                subtitle="Year to date"
                color="emerald"
                isCurrency
              />
              <StatCard
                icon={<IconMapper name="TrendingUp" size={20} />}
                title="Collection Rate"
                value={`${kpis?.finance?.collection_rate ?? 0}%`}
                subtitle="Payment collection efficiency"
                color="blue"
              />
              <StatCard
                icon={<IconMapper name="CheckCircle2" size={20} />}
                title="Pending Approvals"
                value={approvalsPending}
                subtitle="Require your attention"
                color="amber"
              />
            </div>

            {/* Operations & Client Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Operations - Enhanced with Graphs */}
              <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Operations Today</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{ops_analytics?.date || new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      href={safeRoute('control-room.dashboard')}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Control Room →
                    </Link>
                  </div>
                </div>
                
                {/* Stats Grid */}
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

                {/* Mini Charts */}
                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Attendance Trend Mini Chart */}
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Attendance Trend (7 days)</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {attendanceTrend[attendanceTrend.length - 1]?.present || 0} today
                      </span>
                    </div>
                    <ResponsiveContainerFixed width="100%" height={120}>
                      <LineChartFixed data={attendanceTrend}>
                        <LineFixed type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={false} />
                        <LineFixed type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <XAxisFixed dataKey="date" hide />
                        <YAxisFixed hide />
                        <TooltipFixed />
                      </LineChartFixed>
                    </ResponsiveContainerFixed>
                  </div>

                  {/* Zone Coverage Mini Chart */}
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Zone Coverage (7 days)</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {zoneCoverage[zoneCoverage.length - 1]?.coverage || 0}% today
                      </span>
                    </div>
                    <ResponsiveContainerFixed width="100%" height={120}>
                      <AreaChartFixed data={zoneCoverage}>
                        <defs>
                          <linearGradient id="coverageMini" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e04b3f" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#e04b3f" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <AreaFixed type="monotone" dataKey="coverage" stroke="#e04b3f" fill="url(#coverageMini)" />
                        <XAxisFixed dataKey="date" hide />
                        <YAxisFixed hide domain={[0, 100]} />
                        <TooltipFixed formatter={(v: any) => `${v}%`} />
                      </AreaChartFixed>
                    </ResponsiveContainerFixed>
                  </div>
                </div>
              </div>

              {/* Client Snapshot */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Client Snapshot</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Clients</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{paymentsSummary?.total_clients || stats.active_clients || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active Sites</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.total_sites || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Coverage Rate</span>
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {coverageSummary?.guards_coverage_pct || stats.attendance_rate || 0}%
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link 
                      href={safeRoute('admin.clients.index')}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      <IconMapper name="Users" size={18} />
                      Manage Clients
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<IconMapper name="Shield" size={20} />}
                title="Total Guards"
                value={stats.total_guards || 0}
                subtitle={`${stats.active_guards || 0} active`}
                color="blue"
                onClick={() => window.location.href = safeRoute('guards.index')}
              />
              <StatCard
                icon={<IconMapper name="ShieldCheck" size={20} />}
                title="On Duty Now"
                value={stats.on_duty_today || kpis?.control_room?.guards_on_duty || 0}
                subtitle="Currently deployed"
                color="emerald"
              />
              <StatCard
                icon={<IconMapper name="AlertOctagon" size={20} />}
                title="Active Incidents"
                value={kpis?.control_room?.active_incidents || 0}
                subtitle="Require attention"
                color="amber"
              />
              <StatCard
                icon={<IconMapper name="PieChart" size={20} />}
                title="Site Coverage"
                value={`${coverageSummary?.sites_coverage_pct || 0}%`}
                subtitle={`${coverageSummary?.sites_covered_today || 0} / ${coverageSummary?.sites_total || 0} sites`}
                color="purple"
              />
            </div>

            {/* Quick Actions Grid */}
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

            {/* Activity & Logs Section - Only in Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Activity */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent User Activity</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <EmptyState title="No recent activity" description="No user activity recorded yet." size="sm" contentClassName="px-0" />
                  ) : (
                    recentActivity.slice(0, 6).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${activity.type === 'check_in' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {activity.type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* System Logs */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent System Logs</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(recentActivity || []).length === 0 ? (
                    <EmptyState title="No logs" description="No recent system logs available." size="sm" contentClassName="px-0" />
                  ) : (
                    recentActivity.slice(0, 8).map((log, index) => (
                      <div key={index} className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded text-xs">
                        <p className="text-gray-700 dark:text-gray-300 truncate">{log.message}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px]">{log.time}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Audit Trail */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Audit Trail</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <EmptyState title="No audit events" description="No audit trail events recorded yet." size="sm" contentClassName="px-0" />
                  ) : (
                    recentActivity.slice(0, 5).map((audit, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{audit.message}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-400 dark:text-gray-500">{audit.time}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{audit.type}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Recent Activity Grid */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Latest events across the platform</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentActivity.length === 0 ? (
                  <EmptyState title="No recent activity" description="When actions happen across the platform, they will show up here." size="sm" />
                ) : (
                  recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.message}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.time}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{item.type}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === 'operations' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Zone Coverage */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Zone Coverage</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Guard deployment and attendance metrics</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                    <IconMapper name="RefreshCw" size={16} className="mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={() => window.location.href = safeRoute('admin.reports.index')}>
                    View Reports
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Guards</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_guards || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Guards</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active_guards || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">On Duty Now</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.on_duty_today || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Attendance Rate</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.attendance_rate || 0}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Attendance (7 days)</h3>
                  <ResponsiveContainerFixed width="100%" height={260}>
                    <LineChartFixed data={attendanceTrend}>
                      <CartesianGridFixed strokeDasharray="3 3" />
                      <XAxisFixed dataKey="date" />
                      <YAxisFixed allowDecimals={false} />
                      <TooltipFixed />
                      <LineFixed type="monotone" dataKey="present" stroke="#10b981" name="Present" strokeWidth={2} />
                      <LineFixed type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" strokeWidth={2} />
                    </LineChartFixed>
                  </ResponsiveContainerFixed>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Coverage (7 days)</h3>
                  <ResponsiveContainerFixed width="100%" height={260}>
                    <AreaChartFixed data={zoneCoverage}>
                      <defs>
                        <linearGradient id="coverage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e04b3f" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#e04b3f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGridFixed strokeDasharray="3 3" />
                      <XAxisFixed dataKey="date" />
                      <YAxisFixed domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} />
                      <TooltipFixed formatter={(v: any) => `${v}%`} />
                      <AreaFixed type="monotone" dataKey="coverage" stroke="#e04b3f" fillOpacity={1} fill="url(#coverage)" />
                    </AreaChartFixed>
                  </ResponsiveContainerFixed>
                </div>
              </div>
            </Card>

            {/* Coverage Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Guards Coverage</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Deployed Today</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{coverageSummary.guards_deployed_today ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Required Total</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{coverageSummary.guards_required_total ?? 0}</div>
                  </div>
                </div>
                <ResponsiveContainerFixed width="100%" height={200}>
                  <BarChartFixed data={[{ name: 'Coverage', value: coverageSummary.guards_coverage_pct ?? 0 }]}>
                    <CartesianGridFixed strokeDasharray="3 3" />
                    <XAxisFixed dataKey="name" />
                    <YAxisFixed domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} />
                    <TooltipFixed formatter={(v: any) => `${v}%`} />
                    <BarFixed dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChartFixed>
                </ResponsiveContainerFixed>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sites Coverage</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Sites Covered</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{coverageSummary.sites_covered_today ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Sites</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{coverageSummary.sites_total ?? 0}</div>
                  </div>
                </div>
                <ResponsiveContainerFixed width="100%" height={200}>
                  <BarChartFixed data={[{ name: 'Coverage', value: coverageSummary.sites_coverage_pct ?? 0 }]}>
                    <CartesianGridFixed strokeDasharray="3 3" />
                    <XAxisFixed dataKey="name" />
                    <YAxisFixed domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} />
                    <TooltipFixed formatter={(v: any) => `${v}%`} />
                    <BarFixed dataKey="value" fill="#e04b3f" radius={[8, 8, 0, 0]} />
                  </BarChartFixed>
                </ResponsiveContainerFixed>
              </Card>
            </div>

            {/* Top Guards */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Performing Guards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topGuards.slice(0, 6).map((g, i) => (
                  <div key={`${g.employee_id}-${i}`} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{g.employee_id}</div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{g.attendance_rate}%</div>
                  </div>
                ))}
                {topGuards.length === 0 && (
                  <div className="col-span-full text-sm text-gray-500 dark:text-gray-400">No top guard data available</div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* HR Tab */}
        {activeTab === 'hr' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Human Resources</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Guard workforce and user management</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.href = safeRoute('guards.index')}>
                    <IconMapper name="Users" size={16} className="mr-2" />
                    Manage Guards
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Guards</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis?.hr_guards?.total_guards || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Guards</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis?.hr_guards?.active_guards || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">New This Month</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis?.hr_guards?.new_guards_this_month || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Turnover Rate</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kpis?.hr_guards?.turnover_rate || 0}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Guard Status Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Active</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{kpis?.hr_guards?.active_guards || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Inactive</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{kpis?.hr_guards?.inactive_guards || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Suspended</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{kpis?.hr_guards?.suspended_guards || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">System Users</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Users</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{kpis?.hr_users?.total_users || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Active</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{kpis?.hr_users?.active_users || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Training Compliance</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{kpis?.hr_users?.training_compliance || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Finance Overview</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Collections, payments and financial health</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.href = safeRoute('finance.invoices.index')}>
                    <IconMapper name="FileText" size={16} className="mr-2" />
                    Invoices
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Collection Rate</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis?.finance?.collection_rate || 0}%</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Unpaid Invoices</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{kpis?.finance?.unpaid_invoices_count || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Outstanding Value</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrencyMWK(kpis?.finance?.unpaid_invoices_value || 0)}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending Req</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis?.finance?.pending_requisitions_count || 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Revenue Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Revenue YTD</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrencyMWK(recognizedRevenueYtd || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">MTD Expenses</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrencyMWK(kpis?.finance?.mtd_expenses || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">MTD Budget</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrencyMWK(kpis?.finance?.mtd_budget || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Payments Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Clients</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{paymentsSummary?.total_clients || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">With Outstanding</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{paymentsSummary?.clients_with_outstanding || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Outstanding Value</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{formatCurrencyMWK(paymentsSummary?.outstanding_value || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Control Room Tab */}
        {activeTab === 'controlRoom' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Control Room</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Live monitoring and incident management</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.href = safeRoute('incidents.index')}>
                    <IconMapper name="AlertTriangle" size={16} className="mr-2" />
                    Incidents
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Guards On Duty</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis?.control_room?.guards_on_duty || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Incidents</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{kpis?.control_room?.active_incidents || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Resolved Today</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis?.control_room?.resolved_incidents || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Dispatches</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{kpis?.control_room?.dispatches_today || 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Camera Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Online</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{kpis?.control_room?.cameras_online || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Offline</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{kpis?.control_room?.cameras_offline || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Avg Response Time</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{kpis?.control_room?.avg_response_time_min || 0} min</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Today's Operations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Open Downs</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{counters?.downs_open || ops_analytics?.downs_open || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Escalated</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{counters?.downs_escalated || ops_analytics?.downs_escalated || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Checked In</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{counters?.attendance_checked_in_today || ops_analytics?.attendance_checked_in_today || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Assets Management</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Equipment and resource tracking</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.href = safeRoute('assets.equipment.index')}>
                    <IconMapper name="Wrench" size={16} className="mr-2" />
                    Equipment
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Assets</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis?.administration?.assets_active || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Under Maintenance</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kpis?.administration?.assets_maintenance || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Value</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrencyMWK(kpis?.administration?.assets_total_value || 0)}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending Requests</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{kpis?.administration?.asset_requests_pending || 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Asset Categories</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Vehicles</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{kpis?.administration?.assets_vehicles || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Equipment</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{kpis?.administration?.assets_equipment || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Technology</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{kpis?.administration?.assets_tech || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Maintenance Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{kpis?.administration?.maintenance_scheduled || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Overdue</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{kpis?.administration?.maintenance_overdue || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Completed (Month)</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{kpis?.administration?.maintenance_completed || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Incentives Tab */}
        {activeTab === 'incentives' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* New Comprehensive Incentive System */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Incentive System</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Comprehensive incentive management and tracking</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.href = safeRoute('hr.incentive-settings.index')}>
                    <IconMapper name="Settings" size={16} className="mr-2" />
                    Settings
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = safeRoute('hr.incentive-settings.index')}>
                    <IconMapper name="Calculator" size={16} className="mr-2" />
                    Calculate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Types</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis?.incentive_system?.total_types || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Rules</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{kpis?.incentive_system?.total_rules || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kpis?.incentive_system?.pending_entries || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending Amount</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyMWK(kpis?.incentive_system?.pending_amount || 0)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Entry Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Pending</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{kpis?.incentive_system?.pending_entries || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Approved</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{kpis?.incentive_system?.approved_entries || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Paid</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{kpis?.incentive_system?.paid_entries || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Amount Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Pending/Approved</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{formatCurrencyMWK(kpis?.incentive_system?.pending_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Paid (MTD)</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrencyMWK(kpis?.incentive_system?.paid_amount_mtd || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col justify-center">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => window.location.href = safeRoute('hr.supervisor-incentives.index')}>
                      <IconMapper name="Award" size={14} className="mr-2" />
                      Supervisor Incentives
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => window.location.href = safeRoute('admin.incentives.index')}>
                      <IconMapper name="DollarSign" size={14} className="mr-2" />
                      Legacy Incentives
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Legacy Supervisor Incentives */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Supervisor Incentives (Legacy)</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Commission tracking and calculations for supervisors/sergeants</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.href = safeRoute('hr.supervisor-incentives.index')}>
                    <IconMapper name="Users" size={16} className="mr-2" />
                    Profiles
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = safeRoute('admin.incentives.index')}>
                    <IconMapper name="Calculator" size={16} className="mr-2" />
                    Calculations
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending Calculations</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kpis?.supervisor_incentives?.pending_calculations || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Ready for Payment</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis?.supervisor_incentives?.approved_pending_payment || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Supervisors</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis?.supervisor_incentives?.supervisors_count || 0}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending Amount</div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrencyMWK(kpis?.supervisor_incentives?.pending_amount_total || 0)}</div>
                </div>
              </div>
            </Card>

            {/* Dashboard Incentive Summary Widget */}
            {(kpis?.supervisor_incentives || kpis?.incentive_system) && (
              <IncentiveSummary
                stats={{
                  total_supervisors: kpis?.supervisor_incentives?.supervisors_count || 0,
                  total_sergeants: kpis?.supervisor_incentives?.sergeants_count || 0,
                  active_profiles: kpis?.incentive_system?.total_types || 0,
                  pending_count: (kpis?.supervisor_incentives?.pending_calculations || 0) + (kpis?.incentive_system?.pending_entries || 0),
                  approved_count: kpis?.incentive_system?.approved_entries || 0,
                  paid_count: kpis?.incentive_system?.paid_entries || 0,
                  total_paid_amount: kpis?.incentive_system?.paid_amount_mtd || 0,
                  pending_amount: (kpis?.supervisor_incentives?.pending_amount_total || 0) + (kpis?.incentive_system?.pending_amount || 0),
                  by_role: {
                    supervisor: kpis?.supervisor_incentives?.pending_amount_total || 0,
                    sergeant: 0,
                  },
                }}
                period={{ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }}
                canCalculate={true}
              />
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <KpiSection title="HR - System Users" subtitle="User accounts overview" data={kpis.hr_users} items={[
              { label: 'Total Users', key: 'total_users' },
              { label: 'Active Users', key: 'active_users' },
              { label: 'Inactive Users', key: 'inactive_users' },
              { label: 'New Hires (Month)', key: 'new_hires_this_month' },
              { label: 'Turnover Rate', key: 'turnover_rate', suffix: '%' },
              { label: 'Pending Leave', key: 'pending_leave_requests' },
              { label: 'Training %', key: 'training_compliance', suffix: '%' },
            ]} />

            <KpiSection title="HR - Guards" subtitle="Guard workforce overview" data={kpis.hr_guards} items={[
              { label: 'Total Guards', key: 'total_guards' },
              { label: 'Active Guards', key: 'active_guards' },
              { label: 'Inactive', key: 'inactive_guards' },
              { label: 'Suspended', key: 'suspended_guards' },
              { label: 'New (Month)', key: 'new_guards_this_month' },
              { label: 'Turnover %', key: 'turnover_rate', suffix: '%' },
            ]} />

            <KpiSection title="Finance" subtitle="Month-to-date financial KPIs" data={kpis.finance} items={[
              { label: 'Outstanding Payroll', key: 'outstanding_payroll', prefix: '$' },
              { label: 'Expenses (MTD)', key: 'mtd_expenses', prefix: '$' },
              { label: 'Budget (MTD)', key: 'mtd_budget', prefix: '$' },
              { label: 'Unpaid Invoices', key: 'unpaid_invoices_count' },
              { label: 'Unpaid Value', key: 'unpaid_invoices_value', prefix: '$' },
              { label: 'Collection %', key: 'collection_rate', suffix: '%' },
              { label: 'Pending Req', key: 'pending_requisitions_count' },
            ]} />

            <KpiSection title="Control Room" subtitle="Operations and monitoring" data={kpis.control_room} items={[
              { label: 'Active Incidents', key: 'active_incidents' },
              { label: 'Resolved Today', key: 'resolved_incidents' },
              { label: 'Guards On Duty', key: 'guards_on_duty' },
              { label: 'Cameras Online', key: 'cameras_online' },
              { label: 'Cameras Offline', key: 'cameras_offline' },
              { label: 'Dispatches', key: 'dispatches_today' },
              { label: 'Avg Response', key: 'avg_response_time_min' },
            ]} />

            <KpiSection title="Operations" subtitle="Contracts, shifts and reports" data={kpis.operations} items={[
              { label: 'Active Contracts', key: 'active_contracts' },
              { label: 'Expired Contracts', key: 'expired_contracts' },
              { label: 'Shift Coverage %', key: 'shift_coverage_pct', suffix: '%' },
              { label: 'Reports Pending', key: 'field_reports_pending' },
              { label: 'Incidents Today', key: 'operational_incidents_today' },
            ]} />

            {kpis.k9 && (
              <KpiSection title="K9 Unit" subtitle="Readiness and activities" data={kpis.k9} items={[
                { label: 'Active K9s', key: 'active_k9s' },
                { label: 'On Patrol', key: 'k9_on_patrol' },
                { label: 'Training (Month)', key: 'training_sessions_month' },
                { label: 'Medical Pending', key: 'medical_checkups_pending' },
                { label: 'Incidents', key: 'k9_incidents_month' },
              ]} />
            )}

            {/* System Health */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">System Health</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-4 rounded-lg border ${systemHealth?.database === 'healthy' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'}`}>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Database</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{systemHealth?.database || 'Unknown'}</div>
                </div>
                <div className={`p-4 rounded-lg border ${systemHealth?.cache === 'healthy' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'}`}>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Cache</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{systemHealth?.cache || 'Unknown'}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Queue Driver</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{systemHealth?.queue || 'default'}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Storage Used</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{systemHealth?.storage ? `${systemHealth.storage}%` : 'N/A'}</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
