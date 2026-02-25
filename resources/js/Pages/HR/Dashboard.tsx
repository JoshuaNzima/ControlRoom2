import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import EmptyState from '@/Components/ui/empty-state';
import Modal from '@/Components/Modal';
import QuickRequisitionModal from '@/Components/Requisitions/QuickRequisitionModal';

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

export default function HRDashboard() {
  const { auth, metrics, upcoming_holidays = [], upcoming_off_days = [], guards = [], compliance = {}, upcoming_birthdays = [] } = (usePage().props as any);
  const [activeTab, setActiveTab] = useState<'overview' | 'people' | 'compliance' | 'activity'>('overview');
  
  // Modal states
  const [openHoliday, setOpenHoliday] = useState(false);
  const [openOffDay, setOpenOffDay] = useState(false);
  const [openInterview, setOpenInterview] = useState(false);
  const [openAssignChecklist, setOpenAssignChecklist] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const holidayForm = useForm({ name: '', date: '', is_recurring: false as boolean, type: 'company' as 'company' | 'public' });
  const offDayForm = useForm({ guard_id: '' as any, start_date: '', end_date: '', reason: '' });

  // Data extraction
  const counts = metrics?.counts || {};
  const attendance = metrics?.attendance || {};
  const trend = metrics?.trend || {};
  const trendNet: number[] = Array.isArray(trend.net) ? trend.net : [];
  const trendLabels: string[] = Array.isArray(trend.labels) ? trend.labels : [];
  const recruitment = metrics?.recruitment || {};
  const infractions = metrics?.infractions || {};
  const checklists = metrics?.checklists || {};
  const recentJobs = useMemo(() => (metrics?.jobs?.recent || []), [metrics]);
  const applicationsForSchedule = (usePage().props as any).applications_for_schedule || [];
  
  const initialWindow = metrics?.window?.param || '30d';
  const initialTrend = metrics?.window?.trend || 'week';
  const [windowParam, setWindowParam] = useState<string>(initialWindow);
  const [trendMode, setTrendMode] = useState<string>(initialTrend);

  const markItemDone = (id: number) => {
    setCompletingId(id);
    router.patch(route('hr.checklists.items.update', { item: id }), { status: 'done' }, {
      preserveScroll: true,
      onFinish: () => setCompletingId(null),
    });
  };

  // Time for hero
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <HRLayout title="HR Dashboard" user={auth?.user as any}>
      <Head title="HR Dashboard" />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">HR Dashboard</h1>
              <p className="text-red-200 dark:text-gray-400 mt-1">
                Human resources overview • {formatTime(currentTime)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                System Active
              </span>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-red-200 dark:text-gray-400 text-sm">Total Guards</p>
              <p className="text-2xl font-bold text-white">{counts.total_guards || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-red-200 dark:text-gray-400 text-sm">On Duty Now</p>
              <p className="text-2xl font-bold text-emerald-400">{counts.on_duty_now || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-red-200 dark:text-gray-400 text-sm">New Hires</p>
              <p className="text-2xl font-bold text-blue-400">{counts.hires_window || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-red-200 dark:text-gray-400 text-sm">Present Today</p>
              <p className="text-2xl font-bold text-emerald-400">{attendance.present_today || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
              { id: 'people', label: 'People', icon: 'Users' },
              { id: 'compliance', label: 'Compliance', icon: 'ShieldCheck' },
              { id: 'activity', label: 'Activity', icon: 'Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconMapper name={tab.icon} size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <QuickRequisitionModal />

        {activeTab === 'overview' && (
          <div className="space-y-6 animate-slideUp">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<IconMapper name="users" className="h-6 w-6" />}
                title="Total Guards"
                value={counts.total_guards || 0}
                subtitle="Active workforce"
                color="blue"
              />
              <StatCard
                icon={<IconMapper name="activity" className="h-6 w-6" />}
                title="On Duty Now"
                value={counts.on_duty_now || 0}
                subtitle="Currently working"
                color="emerald"
              />
              <StatCard
                icon={<IconMapper name="user-plus" className="h-6 w-6" />}
                title="New Hires"
                value={counts.hires_window || 0}
                subtitle={`Last ${windowParam}`}
                color="green"
              />
              <StatCard
                icon={<IconMapper name="user-minus" className="h-6 w-6" />}
                title="Exits"
                value={counts.exits_window || 0}
                subtitle={`Last ${windowParam}`}
                color="rose"
              />
            </div>

            {/* Action Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActionTile
                icon={<IconMapper name="user-plus" className="h-6 w-6" />}
                title="Quick Off Day"
                description="Register guard time off"
                onClick={() => setOpenOffDay(true)}
                color="bg-indigo-600"
              />
              <ActionTile
                icon={<IconMapper name="calendar" className="h-6 w-6" />}
                title="Add Holiday"
                description="Company or public holiday"
                onClick={() => setOpenHoliday(true)}
                color="bg-red-600"
              />
              <ActionTile
                icon={<IconMapper name="video" className="h-6 w-6" />}
                title="Schedule Interview"
                description="Book candidate interview"
                onClick={() => setOpenInterview(true)}
                color="bg-rose-600"
              />
              <ActionTile
                icon={<IconMapper name="clipboard-check" className="h-6 w-6" />}
                title="Assign Checklist"
                description="On/offboarding task"
                onClick={() => setOpenAssignChecklist(true)}
                color="bg-emerald-600"
              />
            </div>

            {/* Attendance & Headcount */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attendance Today</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <MiniStat label="Present" value={attendance.present_today || 0} />
                  <MiniStat label="Late" value={attendance.late_today || 0} />
                  <MiniStat label="Absent" value={attendance.absent_today || 0} />
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {Array.isArray(attendance.late_list) && attendance.late_list.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No late check-ins today</div>
                  ) : (
                    (attendance.late_list || []).slice(0, 3).map((a: any) => (
                      <div key={a.id} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{a.guard?.name || 'Guard'}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{a.check_in_time}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Headcount Trend</h3>
                <Sparkline data={trendNet} />
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  {trendLabels.slice(-6).map((l, i) => (
                    <span key={`${l}-${i}`}>{l}</span>
                  ))}
                </div>
              </Card>
            </div>

            {/* Upcoming Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Off Days (7 days)</h3>
                  <Link href={route('hr.leaves')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(upcoming_off_days || []).length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No upcoming off days</div>
                  )}
                  {(upcoming_off_days || []).slice(0, 5).map((o: any) => (
                    <div key={o.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{o.guard?.name || 'Guard'}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{o.start_date}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Holidays (30 days)</h3>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(upcoming_holidays || []).length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No upcoming holidays</div>
                  )}
                  {(upcoming_holidays || []).slice(0, 5).map((h: any, i: number) => (
                    <div key={`${h.id}-${i}`} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{h.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{h.date}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="space-y-6 animate-slideUp">
            {/* Recruitment Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={<IconMapper name="megaphone" className="h-6 w-6" />}
                title="Open Positions"
                value={metrics?.jobs?.open || 0}
                subtitle="Active job posts"
                color="blue"
              />
              <StatCard
                icon={<IconMapper name="users" className="h-6 w-6" />}
                title="Applicants"
                value={recruitment?.applicants?.applied || 0}
                subtitle={`Last ${windowParam}`}
                color="purple"
              />
              <StatCard
                icon={<IconMapper name="check-circle" className="h-6 w-6" />}
                title="Hired"
                value={recruitment?.applicants?.hired || 0}
                subtitle={`Last ${windowParam}`}
                color="green"
              />
            </div>

            {/* Recruitment Pipeline */}
            <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recruitment Pipeline</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <MiniStat label="Applied" value={recruitment?.applicants?.applied || 0} />
                <MiniStat label="Screening" value={recruitment?.applicants?.screening || 0} />
                <MiniStat label="Interview" value={recruitment?.applicants?.interview || 0} />
                <MiniStat label="Offered" value={recruitment?.applicants?.offered || 0} />
                <MiniStat label="Hired" value={recruitment?.applicants?.hired || 0} />
                <MiniStat label="Rejected" value={recruitment?.applicants?.rejected || 0} />
              </div>
            </Card>

            {/* Recent Jobs & Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Job Posts</h3>
                  <Link href={route('hr.jobs.index')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Manage</Link>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(recentJobs || []).length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No job posts</div>
                  )}
                  {(recentJobs || []).slice(0, 5).map((j: any) => (
                    <div key={j.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{j.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{j.posted_at}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${j.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'}`}>
                        {j.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Interviews (7 days)</h3>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {Array.isArray(recruitment?.upcoming_interviews) && recruitment.upcoming_interviews.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No interviews scheduled</div>
                  )}
                  {(recruitment?.upcoming_interviews || []).slice(0, 5).map((iv: any) => (
                    <div key={iv.id} className="py-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{iv.candidate?.name || 'Candidate'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{iv.scheduled_at} • {iv.mode}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Birthdays */}
            <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Birthdays (30 days)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(upcoming_birthdays || []).length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 col-span-full text-center py-4">No upcoming birthdays</div>
                )}
                {(upcoming_birthdays || []).slice(0, 8).map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="w-8 h-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center">
                      <IconMapper name="gift" size={16} className="text-fuchsia-600 dark:text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{b.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{b.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6 animate-slideUp">
            {/* Compliance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                icon={<IconMapper name="mail" className="h-5 w-5" />}
                title="Missing Email"
                value={compliance?.missing?.email || 0}
                subtitle="Incomplete"
                color="amber"
              />
              <StatCard
                icon={<IconMapper name="phone" className="h-5 w-5" />}
                title="Missing Phone"
                value={compliance?.missing?.phone || 0}
                subtitle="Incomplete"
                color="amber"
              />
              <StatCard
                icon={<IconMapper name="calendar" className="h-5 w-5" />}
                title="Missing DoB"
                value={compliance?.missing?.date_of_birth || 0}
                subtitle="Incomplete"
                color="amber"
              />
              <StatCard
                icon={<IconMapper name="credit-card" className="h-5 w-5" />}
                title="Missing ID"
                value={compliance?.missing?.id_number || 0}
                subtitle="Incomplete"
                color="amber"
              />
              <StatCard
                icon={<IconMapper name="clock" className="h-5 w-5" />}
                title="Missing Hire Date"
                value={compliance?.missing?.hire_date || 0}
                subtitle="Incomplete"
                color="amber"
              />
              <StatCard
                icon={<IconMapper name="alert-circle" className="h-5 w-5" />}
                title="Missing Emergency"
                value={compliance?.missing?.emergency_contact || 0}
                subtitle="Incomplete"
                color="amber"
              />
            </div>

            {/* Infractions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Infractions Trend</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{trendMode === 'month' ? 'Last 6 months' : 'Last 8 weeks'}</span>
                </div>
                <Sparkline data={Array.isArray(infractions?.trend?.counts) ? infractions.trend.counts : []} color="text-rose-500" />
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Top Guards</p>
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {Array.isArray(infractions?.top_guards) && infractions.top_guards.length === 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 py-2">No infractions</div>
                    )}
                    {(infractions?.top_guards || []).slice(0, 3).map((g: any, i: number) => (
                      <div key={i} className="py-2 flex items-center justify-between">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{g.guard?.name || 'Guard'}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{g.count} incidents</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Infractions Follow-ups</h3>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {Array.isArray(infractions?.followups) && infractions.followups.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No follow-ups pending</div>
                  )}
                  {(infractions?.followups || []).slice(0, 5).map((i: any) => (
                    <div key={i.id} className="py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${i.severity === 'major' ? 'bg-rose-600' : i.severity === 'moderate' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{i.guard?.name || 'Guard'}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">{i.type} • {i.severity} • {i.incident_date}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Incomplete Profiles */}
            <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Incomplete Profiles</h3>
                <Link href={route('hr.dashboard.compliance-export')} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Export CSV</Link>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(compliance?.incomplete_profiles || []).length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">All profiles complete</div>
                )}
                {(compliance?.incomplete_profiles || []).slice(0, 5).map((g: any) => (
                  <div key={g.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.name} {g.employee_id ? `(${g.employee_id})` : ''}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Missing: {Array.isArray(g.missing) ? g.missing.join(', ') : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6 animate-slideUp">
            {/* On/Offboarding */}
            <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">On/Offboarding Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <MiniStat label="Onboarding" value={checklists?.onboarding_active || 0} />
                <MiniStat label="Offboarding" value={checklists?.offboarding_active || 0} />
                <MiniStat label="Due Soon (7d)" value={checklists?.due_soon || 0} />
                <MiniStat label="Overdue" value={checklists?.overdue || 0} />
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {Array.isArray(checklists?.due_items) && checklists.due_items.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No items due soon</div>
                )}
                {(checklists?.due_items || []).slice(0, 5).map((it: any) => (
                  <div key={it.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{it.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{it.checklist?.guard?.name || 'Guard'} • Due: {it.due_date}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => markItemDone(it.id)} 
                      disabled={completingId === it.id} 
                      className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white"
                    >
                      {completingId === it.id ? 'Completing…' : 'Mark done'}
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Benefits Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Benefits</h4>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.benefits?.active_enrollments || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active enrollments</p>
              </Card>
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Compensation</h4>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.compensation?.pending_changes || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending changes</p>
              </Card>
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Safety</h4>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.safety?.open_incidents || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Open incidents</p>
              </Card>
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Medical</h4>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.medical?.active_memberships || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active memberships</p>
              </Card>
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pensions</h4>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.pensions?.active_enrollments || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active enrollments</p>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <QuickHolidayModal open={openHoliday} onClose={() => setOpenHoliday(false)} form={holidayForm} />
      <QuickOffDayModal open={openOffDay} onClose={() => setOpenOffDay(false)} form={offDayForm} guards={guards || []} />
      <QuickInterviewModal open={openInterview} onClose={() => setOpenInterview(false)} applications={applicationsForSchedule} />
      <QuickChecklistAssignModal open={openAssignChecklist} onClose={() => setOpenAssignChecklist(false)} guards={guards || []} templates={checklists?.templates || []} />
    </HRLayout>
  );
}

function QuickInterviewModal({ open, onClose, applications }: { open: boolean; onClose: () => void; applications: any[] }) {
  const form: any = useForm<any>({
    job_application_id: '',
    scheduled_at: '',
    interviewer_id: '',
    mode: 'in_person',
    location_or_link: '',
    notes: '',
  } as any);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('hr.interviews.store'), { onSuccess: onClose });
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Schedule Interview</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Application</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.job_application_id as any} onChange={(e) => form.setData('job_application_id', e.target.value)}>
              <option value="">Select application…</option>
              {(applications || []).map((a: any) => (
                <option key={a.id} value={a.id}>{a.candidate_name} {a.job?.title ? `• ${a.job.title}` : ''}</option>
              ))}
            </select>
            {form.errors.job_application_id && <p className="text-xs text-red-600 mt-1">{form.errors.job_application_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">When</label>
            <input type="datetime-local" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.scheduled_at as any} onChange={(e) => form.setData('scheduled_at', e.target.value)} />
            {form.errors.scheduled_at && <p className="text-xs text-red-600 mt-1">{form.errors.scheduled_at}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Mode</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.mode as any} onChange={(e) => form.setData('mode', e.target.value)}>
                <option value="in_person">In person</option>
                <option value="phone">Phone</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Location/Link</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.location_or_link as any} onChange={(e) => form.setData('location_or_link', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" rows={3} value={form.data.notes as any} onChange={(e) => form.setData('notes', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700">{form.processing ? 'Saving…' : 'Schedule'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// Modern Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan' | 'emerald' | 'rose' | 'indigo';
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
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-800', icon: 'bg-rose-600 text-white', text: 'text-rose-700 dark:text-rose-300' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'bg-indigo-600 text-white', text: 'text-indigo-700 dark:text-indigo-300' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color, onClick }) => {
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
          {typeof value === 'number' ? <AnimatedCounter value={numericValue} /> : value}
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
  onClick?: () => void;
  color: string;
}> = ({ icon, title, description, onClick, color }) => {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left w-full"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${color}`} />
      <div className={`inline-flex p-3 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Quick Add</span>
        <IconMapper name="ArrowRight" size={16} className="ml-1" />
      </div>
    </button>
  );
};

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}

function Sparkline({ data, color = 'text-red-500' }: { data: number[]; color?: string }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-16">
        <EmptyState
          title="No data"
          size="sm"
          contentClassName="px-0 py-0 flex h-16 flex-col items-center justify-center"
        />
      </div>
    );
  }
  const width = 320;
  const height = 64;
  const pad = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / (data.length - 1);
    const y = height - pad - ((v - min) * (height - pad * 2)) / range;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 text-red-500 dark:text-red-400">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function QuickHolidayModal({ open, onClose, form }: { open: boolean; onClose: () => void; form: any }) {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('hr.leaves.holidays.store'), { onSuccess: onClose });
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Holiday</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
            {form.errors.name && <p className="text-xs text-red-600 mt-1">{form.errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.date} onChange={(e) => form.setData('date', e.target.value)} />
            {form.errors.date && <p className="text-xs text-red-600 mt-1">{form.errors.date}</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.data.is_recurring} onChange={(e) => form.setData('is_recurring', e.target.checked)} />
              <span>Recurring annually</span>
            </label>
            <label className="text-sm">
              <span className="mr-2">Type</span>
              <select className="border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}>
                <option value="company">Company</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">{form.processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function QuickOffDayModal({ open, onClose, form, guards }: { open: boolean; onClose: () => void; form: any; guards: any[] }) {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('hr.leaves.off-days.store'), { onSuccess: onClose });
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Off Day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Guard</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.guard_id} onChange={(e) => form.setData('guard_id', e.target.value)}>
              <option value="">Select guard…</option>
              {(guards || []).map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>
              ))}
            </select>
            {form.errors.guard_id && <p className="text-xs text-red-600 mt-1">{form.errors.guard_id}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} />
              {form.errors.start_date && <p className="text-xs text-red-600 mt-1">{form.errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} />
              {form.errors.end_date && <p className="text-xs text-red-600 mt-1">{form.errors.end_date}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
            {form.errors.reason && <p className="text-xs text-red-600 mt-1">{form.errors.reason}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{form.processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function QuickChecklistAssignModal({ open, onClose, guards, templates }: { open: boolean; onClose: () => void; guards: any[]; templates: any[] }) {
  const form: any = useForm<any>({
    guard_id: '',
    checklist_template_id: '',
    start_date: '',
  } as any);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('hr.checklists.assign'), { onSuccess: onClose });
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Checklist</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Guard</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.guard_id as any} onChange={(e) => form.setData('guard_id', e.target.value)}>
              <option value="">Select guard…</option>
              {(guards || []).map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>
              ))}
            </select>
            {form.errors.guard_id && <p className="text-xs text-red-600 mt-1">{form.errors.guard_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Template</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.checklist_template_id as any} onChange={(e) => form.setData('checklist_template_id', e.target.value)}>
              <option value="">Select template…</option>
              {(templates || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} • {t.type}</option>
              ))}
            </select>
            {form.errors.checklist_template_id && <p className="text-xs text-red-600 mt-1">{form.errors.checklist_template_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.start_date as any} onChange={(e) => form.setData('start_date', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{form.processing ? 'Assigning…' : 'Assign'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
