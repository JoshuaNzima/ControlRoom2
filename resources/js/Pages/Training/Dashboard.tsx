import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import TrainingLayout from '@/Layouts/TrainingLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import EmptyState from '@/Components/ui/empty-state';
import ScannerModal from '@/Components/Scanner/ScannerModal';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ 
  value, duration = 1000 
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
  
  return <span>{count.toLocaleString()}</span>;
};

type Stats = {
  total: number;
  in_training: number;
  pending_review: number;
  approved: number;
  rejected: number;
  rapid_response: number;
  pending_assignment: number;
};

type MyPrimaryTrainee = {
  id: number;
  name: string;
  status: string;
  training_track: 'standard' | 'rapid_response';
  training_days: number;
  training_start_date?: string | null;
  training_end_date?: string | null;
};

type RecentActivity = {
  id: number;
  name: string;
  status: string;
  training_track: string;
  updated_at: string;
};

type PageProps = {
  auth: { user: any };
  stats: Stats;
  myPrimaryTrainees: MyPrimaryTrainee[];
  recentActivity: RecentActivity[];
};

// Modern Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan' | 'emerald' | 'slate';
  onClick?: () => void;
}

const colorMap: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-950/20', border: 'border-slate-200 dark:border-slate-800', icon: 'bg-slate-600 text-white', text: 'text-slate-700 dark:text-slate-300' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color, onClick }) => {
  const colors = colorMap[color] || colorMap.blue;
  
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
  // Don't render broken links
  if (!href || href === '#') return null;

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

function badgeForTrack(track: string) {
  if (track === 'rapid_response') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

function badgeForStatus(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200';
    case 'pending_review':
      return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200';
    case 'in_training':
      return 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200';
    case 'pending_assignment':
      return 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'approved': return <IconMapper name="CheckCircle" size={16} className="text-emerald-600" />;
    case 'rejected': return <IconMapper name="XCircle" size={16} className="text-rose-600" />;
    case 'pending_review': return <IconMapper name="Clock" size={16} className="text-indigo-600" />;
    case 'in_training': return <IconMapper name="Activity" size={16} className="text-sky-600" />;
    case 'pending_assignment': return <IconMapper name="UserPlus" size={16} className="text-orange-600" />;
    default: return <IconMapper name="Circle" size={16} className="text-gray-400" />;
  }
}

/** Safe route helper — returns '#' if route doesn't exist */
function safeRoute(name: string, params?: any): string {
  try {
    return route(name, params) as string;
  } catch {
    return '#';
  }
}

/** Format relative time */
function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

// Progress bar component
const ProgressBar: React.FC<{ value: number; max: number; color: string; label: string }> = ({ value, max, color, label }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default function TrainingDashboard() {
  const { auth, stats, myPrimaryTrainees, recentActivity } = usePage<PageProps>().props;
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trainees' | 'analytics'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const safeStats = useMemo(() => ({
    total: stats?.total ?? 0,
    in_training: stats?.in_training ?? 0,
    pending_review: stats?.pending_review ?? 0,
    approved: stats?.approved ?? 0,
    rejected: stats?.rejected ?? 0,
    rapid_response: stats?.rapid_response ?? 0,
    pending_assignment: stats?.pending_assignment ?? 0,
  }), [stats]);

  const safeTrainees = myPrimaryTrainees || [];
  const safeActivity = recentActivity || [];

  // Only include quick actions with valid routes
  const quickActions = useMemo(() => [
    { title: 'Manage Trainees', description: 'View and manage all trainees', route: 'training.trainees.index', icon: <IconMapper name="Users" size={20} />, color: 'bg-blue-600' },
    { title: 'Manage Regimens', description: 'Configure training programs', route: 'training.regimens.index', icon: <IconMapper name="ClipboardList" size={20} />, color: 'bg-purple-600' },
    { title: 'Crash Courses', description: 'Short intensive programs', route: 'training.crash-courses.index', icon: <IconMapper name="Zap" size={20} />, color: 'bg-amber-600' },
    { title: 'Refreshers', description: 'Refresher training programs', route: 'training.refreshers.index', icon: <IconMapper name="RefreshCw" size={20} />, color: 'bg-cyan-600' },
    { title: 'Attendance', description: 'Track trainee attendance', route: 'training.attendance.index', icon: <IconMapper name="CalendarCheck" size={20} />, color: 'bg-emerald-600' },
    { title: 'Refresher Guards', description: 'Manage guards on refreshers', route: 'training.trainer-guards.index', icon: <IconMapper name="UserCheck" size={20} />, color: 'bg-red-600' },
  ], []);

  // Completion & rejection rates
  const completionRate = safeStats.total > 0 ? Math.round((safeStats.approved / safeStats.total) * 100) : 0;
  const rejectionRate = safeStats.total > 0 ? Math.round((safeStats.rejected / safeStats.total) * 100) : 0;
  const inProgressRate = safeStats.total > 0 ? Math.round((safeStats.in_training / safeStats.total) * 100) : 0;

  return (
    <TrainingLayout title="Training Dashboard" user={auth?.user as any}>
      <Head title="Training Dashboard" />

      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="GraduationCap" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Training Center</h1>
                  <p className="text-red-100 mt-1">Manage trainees and track progress</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-200">System Time</p>
                  <p className="text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
                
                {/* Quick stat pills */}
                {safeStats.pending_review > 0 && (
                  <div className="px-3 py-2 bg-amber-500/20 border border-amber-300/30 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-amber-200">Pending Review</p>
                    <p className="text-lg font-bold">{safeStats.pending_review}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => setScannerOpen(true)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <IconMapper name="ScanLine" size={16} className="mr-2" />
                  Scan QR
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit flex-wrap">
          {[
            { id: 'overview', label: 'Overview', icon: 'LayoutGrid' },
            { id: 'trainees', label: 'My Trainees', icon: 'Users' },
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
              {tab.id === 'trainees' && safeTrainees.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  {safeTrainees.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<IconMapper name="Users" size={20} />}
                title="Total Trainees"
                value={safeStats.total}
                subtitle="All trainees"
                color="blue"
              />
              <StatCard
                icon={<IconMapper name="Activity" size={20} />}
                title="In Training"
                value={safeStats.in_training}
                subtitle="Currently active"
                color="amber"
              />
              <StatCard
                icon={<IconMapper name="ClipboardCheck" size={20} />}
                title="Pending Review"
                value={safeStats.pending_review}
                subtitle="Awaiting assessment"
                color="purple"
              />
              <StatCard
                icon={<IconMapper name="CheckCircle" size={20} />}
                title="Approved"
                value={safeStats.approved}
                subtitle="Completed training"
                color="green"
              />
              <StatCard
                icon={<IconMapper name="XCircle" size={20} />}
                title="Rejected"
                value={safeStats.rejected}
                subtitle="Did not pass"
                color="red"
              />
              <StatCard
                icon={<IconMapper name="Zap" size={20} />}
                title="Rapid Response"
                value={safeStats.rapid_response}
                subtitle="Specialized track"
                color="cyan"
              />
              <StatCard
                icon={<IconMapper name="UserPlus" size={20} />}
                title="Pending Assignment"
                value={safeStats.pending_assignment}
                subtitle="Awaiting trainer"
                color="slate"
              />
            </div>

            {/* Two-column: Quick Actions + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2">
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

              {/* Recent Activity Feed */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
                <Card className="p-4">
                  {safeActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {safeActivity.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <div className="mt-0.5">{statusIcon(item.status)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeForStatus(item.status)}`}>
                                {item.status.replaceAll('_', ' ')}
                              </span>
                              <span className="text-[11px] text-gray-400">{timeAgo(item.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Trainees Tab */}
        {activeTab === 'trainees' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Primary Trainees</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {safeTrainees.length} trainee{safeTrainees.length !== 1 ? 's' : ''} assigned to you
                  </p>
                </div>
                <Button onClick={() => window.location.href = safeRoute('training.trainees.index')}>
                  View All Trainees
                </Button>
              </div>

              {safeTrainees.length === 0 ? (
                <EmptyState
                  title="No trainees assigned"
                  description="Trainees where you are the primary trainer will appear here."
                  size="sm"
                  action={
                    <Link
                      href={safeRoute('training.trainees.index')}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
                      <IconMapper name="Users" size={18} />
                      View Trainees
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {safeTrainees.map((t) => (
                    <div key={t.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</div>
                          {t.training_end_date && new Date(t.training_end_date) < new Date() && t.status === 'in_training' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeForStatus(t.status)}`}>
                            {String(t.status).replaceAll('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeForTrack(t.training_track)}`}>
                            {t.training_track === 'rapid_response' ? 'rapid response' : 'standard'}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">{t.training_days} days</span>
                          {t.training_start_date && (
                            <span className="text-xs text-gray-400">
                              Started {new Date(t.training_start_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={safeRoute('training.trainees.index', { q: t.name } as any)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                      >
                        <IconMapper name="ArrowRight" size={16} />
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Completion Rate</h3>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${completionRate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : completionRate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {completionRate}%
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {safeStats.approved} of {safeStats.total} trainees approved
                  </p>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Active Training</h3>
                <div className="text-center">
                  <div className="text-5xl font-bold text-amber-600 dark:text-amber-400">
                    {safeStats.in_training}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {inProgressRate}% of total trainees
                  </p>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rejection Rate</h3>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${rejectionRate <= 10 ? 'text-emerald-600 dark:text-emerald-400' : rejectionRate <= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {rejectionRate}%
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {safeStats.rejected} of {safeStats.total} trainees rejected
                  </p>
                </div>
              </Card>
            </div>

            {/* Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Training Pipeline Breakdown</h3>
              <div className="space-y-4">
                <ProgressBar value={safeStats.pending_assignment} max={safeStats.total} color="bg-orange-500" label="Pending Assignment" />
                <ProgressBar value={safeStats.in_training} max={safeStats.total} color="bg-sky-500" label="In Training" />
                <ProgressBar value={safeStats.pending_review} max={safeStats.total} color="bg-indigo-500" label="Pending Review" />
                <ProgressBar value={safeStats.approved} max={safeStats.total} color="bg-emerald-500" label="Approved" />
                <ProgressBar value={safeStats.rejected} max={safeStats.total} color="bg-rose-500" label="Rejected" />
              </div>
            </Card>

            {/* Track Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Track Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Standard Track</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {safeStats.total - safeStats.rapid_response}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Rapid Response</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {safeStats.rapid_response}
                    </span>
                  </div>
                </div>
                {safeStats.total > 0 && (
                  <div className="mt-4 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full transition-all duration-700"
                      style={{ width: `${((safeStats.total - safeStats.rapid_response) / safeStats.total) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all duration-700"
                      style={{ width: `${(safeStats.rapid_response / safeStats.total) * 100}%` }}
                    />
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                    <span className={`text-sm font-bold ${completionRate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{completionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rejection Rate</span>
                    <span className={`text-sm font-bold ${rejectionRate <= 15 ? 'text-emerald-600' : 'text-rose-600'}`}>{rejectionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Pipeline</span>
                    <span className="text-sm font-bold text-sky-600">{safeStats.in_training + safeStats.pending_review}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rapid Response %</span>
                    <span className="text-sm font-bold text-amber-600">
                      {safeStats.total > 0 ? Math.round((safeStats.rapid_response / safeStats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </TrainingLayout>
  );
}
