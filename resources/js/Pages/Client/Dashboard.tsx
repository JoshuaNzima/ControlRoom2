import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import { Badge } from '@/Components/ui/badge';

interface ClientDashboardProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  client: {
    id: number;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    contract_start_date: string | null;
    contract_end_date: string | null;
    monthly_rate: number;
    status: string;
    supervisor_name?: string | null;
    sergeant_name?: string | null;
  } | null;
  stats: {
    activeSites: number;
    totalGuards: number;
    guardsOnDuty: number;
    monthlyReports: number;
    activeAlerts: number;
  };
  sites: Array<{
    id: number;
    name: string;
    address: string;
    contact_person: string | null;
    phone: string | null;
    required_guards: number;
    status: string;
    site_type: string;
  }>;
  recentIncidents: Array<{
    id: number;
    title: string;
    type: string;
    severity: string;
    status: string;
    site_name: string | null;
    guard_name: string | null;
    created_at: string;
  }>;
  invoices: Array<{
    id: number;
    invoice_number: string;
    total_amount: number;
    status: string;
    due_date: string | null;
    billing_period: string | null;
  }>;
  contractStatus: {
    status: string;
    message: string;
    days_remaining: number | null;
    is_expiring_soon: boolean;
  } | null;
  paymentSummary: {
    expected_amount: number;
    total_due: number;
    total_paid: number;
    outstanding_amount: number;
    outstanding_months: number;
    billing_start: string | null;
    is_overdue: boolean;
  } | null;
  guardsOnDuty?: Array<{
    id: number;
    guard_id: number;
    guard_name: string | null;
    guard_phone: string | null;
    position: string | null;
    site_id: number;
    site_name: string | null;
    check_in_time: string | null;
    status: string;
    hours_worked: number | null;
  }>;
  todayShifts?: Array<{
    id: number;
    guard_id: number;
    guard_name: string | null;
    site_id: number;
    site_name: string | null;
    start_time: string | null;
    end_time: string | null;
    status: string;
    status_color: string;
    shift_type: string | null;
    is_late: boolean;
  }>;
  activityFeed?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    icon: string;
    color: string;
  }>;
  notifications?: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    action_url?: string;
  }>;
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

// Modern Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
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

// Severity Badge
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[severity] || colors.medium}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

// Status Badge
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  );
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function ClientDashboard({
  auth,
  client,
  stats,
  sites,
  recentIncidents,
  invoices,
  contractStatus,
  paymentSummary,
  guardsOnDuty = [],
  todayShifts = [],
  activityFeed = [],
  notifications = [],
}: ClientDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = useMemo(() => [
    { title: 'My Sites', description: 'View your assigned sites', href: route('client.sites'), icon: <IconMapper name="Building" size={20} />, color: 'bg-blue-600' },
    { title: 'Reports', description: 'Access security reports', href: route('client.reports'), icon: <IconMapper name="FileText" size={20} />, color: 'bg-purple-600' },
    { title: 'Support', description: 'Contact support team', href: 'mailto:support@coinsec.com', icon: <IconMapper name="Headphones" size={20} />, color: 'bg-emerald-600' },
    { title: 'Invoices', description: 'View contracts & invoices', href: route('client.invoices'), icon: <IconMapper name="FileCheck" size={20} />, color: 'bg-cyan-600' },
  ], []);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (!client) {
    return (
      <ClientLayout title="Dashboard" user={auth?.user}>
        <Head title="Dashboard" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <IconMapper name="AlertCircle" size={32} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Client Assigned</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Your account is not linked to any client. Please contact support for assistance.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Dashboard" user={auth?.user}>
      <Head title="Client Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="Building2" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{client.name}</h1>
                  <p className="text-red-100 mt-1">Welcome to your security management dashboard</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-200">System Time</p>
                  <p className="text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
                {contractStatus && (
                  <div className={`px-4 py-2 rounded-lg backdrop-blur-sm ${
                    contractStatus.status === 'expired' ? 'bg-red-500/30' :
                    contractStatus.status === 'expiring' ? 'bg-amber-500/30' :
                    'bg-green-500/30'
                  }`}>
                    <p className="text-xs text-white/80">Contract Status</p>
                    <p className="text-sm font-semibold">{contractStatus.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Banner */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border flex items-start gap-3 ${
                  notification.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    : notification.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <IconMapper
                  name={notification.icon}
                  size={20}
                  className={
                    notification.type === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : notification.type === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{notification.message}</p>
                </div>
                {notification.action_url && (
                  <Link
                    href={notification.action_url}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            icon={<IconMapper name="Building" size={20} />}
            title="Active Sites"
            value={stats.activeSites}
            subtitle="Your sites"
            color="blue"
          />
          <StatCard
            icon={<IconMapper name="Shield" size={20} />}
            title="Total Guards"
            value={stats.totalGuards}
            subtitle="Assigned"
            color="green"
          />
          <StatCard
            icon={<IconMapper name="UserCheck" size={20} />}
            title="On Duty"
            value={stats.guardsOnDuty}
            subtitle="Currently active"
            color="emerald"
          />
          <StatCard
            icon={<IconMapper name="FileText" size={20} />}
            title="Reports"
            value={stats.monthlyReports}
            subtitle="This month"
            color="purple"
          />
          <StatCard
            icon={<IconMapper name="AlertCircle" size={20} />}
            title="Alerts"
            value={stats.activeAlerts}
            subtitle="Active"
            color={stats.activeAlerts > 0 ? 'red' : 'amber'}
          />
        </div>

        {/* Payment Summary Card */}
        {paymentSummary && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <IconMapper name="CreditCard" size={20} />
                Payment Summary ({new Date().getFullYear()})
              </h3>
              <StatusBadge status={paymentSummary.is_overdue ? 'overdue' : 'active'} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Due</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(paymentSummary.total_due)}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(paymentSummary.total_paid)}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                <p className={`text-xl font-bold ${paymentSummary.outstanding_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {formatCurrency(paymentSummary.outstanding_amount)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Rate</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(client.monthly_rate)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <ActionTile
                key={action.title}
                icon={action.icon}
                title={action.title}
                description={action.description}
                href={action.href}
                color={action.color}
              />
            ))}
          </div>
        </div>

        {/* Guards on Duty & Today's Shifts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guards Currently on Duty */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <IconMapper name="UserCheck" size={20} className="text-emerald-600 dark:text-emerald-400" />
                Guards on Duty
              </h3>
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                {guardsOnDuty.length} active
              </span>
            </div>
            {guardsOnDuty.length === 0 ? (
              <div className="text-center py-6">
                <IconMapper name="UserX" size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No guards currently on duty</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {guardsOnDuty.map((guard) => (
                  <div key={guard.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <IconMapper name="User" size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{guard.guard_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{guard.site_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Since {guard.check_in_time ? new Date(guard.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          {guard.hours_worked ? `${guard.hours_worked}h` : 'New'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Today's Shifts */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <IconMapper name="Calendar" size={20} className="text-blue-600 dark:text-blue-400" />
                Today's Shifts
              </h3>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                {todayShifts.length} scheduled
              </span>
            </div>
            {todayShifts.length === 0 ? (
              <div className="text-center py-6">
                <IconMapper name="CalendarOff" size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No shifts scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todayShifts.map((shift) => (
                  <div key={shift.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          shift.status_color === 'green' ? 'bg-green-500' :
                          shift.status_color === 'blue' ? 'bg-blue-500' :
                          shift.status_color === 'yellow' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{shift.guard_name || 'Unassigned'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{shift.site_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {shift.start_time} - {shift.end_time}
                        </p>
                        <p className={`text-xs ${
                          shift.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                          shift.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' :
                          shift.status === 'scheduled' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          {shift.status.replace('_', ' ').charAt(0).toUpperCase() + shift.status.replace('_', ' ').slice(1)}
                          {shift.is_late && <span className="text-red-500 ml-1">(Late)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Activity Feed */}
        {activityFeed.length > 0 && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <IconMapper name="Activity" size={20} className="text-purple-600 dark:text-purple-400" />
                Recent Activity
              </h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activityFeed.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className={`p-2 rounded-full ${
                    activity.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                    activity.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    activity.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                    'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    <IconMapper
                      name={activity.icon}
                      size={14}
                      className={
                        activity.color === 'green' ? 'text-green-600 dark:text-green-400' :
                        activity.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                        activity.color === 'red' ? 'text-red-600 dark:text-red-400' :
                        'text-amber-600 dark:text-amber-400'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sites Section */}
          <Card className="p-4 sm:p-6" id="sites">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <IconMapper name="Building" size={20} />
                My Sites
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">{sites.length} total</span>
            </div>
            {sites.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sites assigned</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sites.map((site) => (
                  <div key={site.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{site.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{site.address}</p>
                      </div>
                      <StatusBadge status={site.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <IconMapper name="Shield" size={14} />
                        {site.required_guards} guards
                      </span>
                      <span className="flex items-center gap-1">
                        <IconMapper name="MapPin" size={14} />
                        {site.site_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Incidents */}
          <Card className="p-4 sm:p-6" id="incidents">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <IconMapper name="AlertTriangle" size={20} />
                Recent Incidents
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">{recentIncidents.length} recent</span>
            </div>
            {recentIncidents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent incidents</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{incident.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {incident.site_name} {incident.guard_name && `• ${incident.guard_name}`}
                        </p>
                      </div>
                      <SeverityBadge severity={incident.severity} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={incident.status} />
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatRelativeTime(incident.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Invoices Section */}
        <Card className="p-6" id="invoices">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <IconMapper name="FileText" size={20} />
              Recent Invoices
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{invoices.length} recent</span>
          </div>
          {invoices.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No invoices available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Invoice #</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Period</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{invoice.billing_period || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total_amount)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(invoice.due_date)}</td>
                      <td className="py-3 px-4"><StatusBadge status={invoice.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Client Info Footer */}
        <Card className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-900 dark:text-gray-100">{client.contact_person || 'N/A'}</p>
                <p className="text-gray-500 dark:text-gray-400">{client.email || 'N/A'}</p>
                <p className="text-gray-500 dark:text-gray-400">{client.phone || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Contract Details</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-900 dark:text-gray-100">Start: {formatDate(client.contract_start_date)}</p>
                <p className="text-gray-900 dark:text-gray-100">End: {formatDate(client.contract_end_date)}</p>
                <p className="text-gray-500 dark:text-gray-400">Monthly: {formatCurrency(client.monthly_rate)}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Assigned Personnel</h4>
              <div className="space-y-1 text-sm">
                {client.supervisor_name && (
                  <p className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <IconMapper name="User" size={14} className="text-blue-500" />
                    Supervisor: {client.supervisor_name}
                  </p>
                )}
                {client.sergeant_name && (
                  <p className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <IconMapper name="Shield" size={14} className="text-purple-500" />
                    Sergeant: {client.sergeant_name}
                  </p>
                )}
                {!client.supervisor_name && !client.sergeant_name && (
                  <p className="text-gray-500 dark:text-gray-400">No personnel assigned</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Client ID</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">#{client.id}</p>
                <StatusBadge status={client.status} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
}
