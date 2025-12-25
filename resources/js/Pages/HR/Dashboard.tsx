import React, { useMemo, useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import IconMapper from '@/Components/IconMapper';
import QuickRequisitionModal from '@/Components/Requisitions/QuickRequisitionModal';
import Modal from '@/Components/Modal';

export default function HRDashboard() {
  const { auth, metrics, upcoming_holidays = [], upcoming_off_days = [], guards = [], compliance = {}, upcoming_birthdays = [] } = (usePage().props as any);
  const [openHoliday, setOpenHoliday] = useState(false);
  const [openOffDay, setOpenOffDay] = useState(false);
  const [openInterview, setOpenInterview] = useState(false);
  const [openAssignChecklist, setOpenAssignChecklist] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const holidayForm = useForm({
    name: '',
    date: '',
    is_recurring: false as boolean,
    type: 'company' as 'company' | 'public',
  });

  const offDayForm = useForm({
    guard_id: '' as any,
    start_date: '',
    end_date: '',
    reason: '',
  });

  const recentJobs = useMemo(() => (metrics?.jobs?.recent || []), [metrics]);
  const counts = metrics?.counts || {};
  const attendance = metrics?.attendance || {};
  const trend = metrics?.trend || {};
  const trendNet: number[] = Array.isArray(trend.net) ? trend.net : [];
  const trendLabels: string[] = Array.isArray(trend.labels) ? trend.labels : [];
  const recruitment = metrics?.recruitment || {};
  const applicationsForSchedule = (usePage().props as any).applications_for_schedule || [];
  const infractions = metrics?.infractions || {};
  const checklists = metrics?.checklists || {};
  const benefits = metrics?.benefits || {};
  const compensation = metrics?.compensation || {};
  const safety = metrics?.safety || {};
  const medical = metrics?.medical || {};
  const pensions = metrics?.pensions || {};

  const initialWindow = metrics?.window?.param || '30d';
  const initialTrend = metrics?.window?.trend || 'week';
  const [windowParam, setWindowParam] = useState<string>(initialWindow);
  const [trendMode, setTrendMode] = useState<string>(initialTrend);
  const applyFilters = () => {
    router.get(route('hr.dashboard'), { window: windowParam, trend: trendMode }, { preserveState: true, replace: true });
  };

  const markItemDone = (id: number) => {
    setCompletingId(id);
    router.patch(route('hr.checklists.items.update', { item: id }), { status: 'done' }, {
      preserveScroll: true,
      onFinish: () => setCompletingId(null),
    });
  };

  return (
    <HRLayout title="HR" user={auth?.user as any}>
      <Head title="HR Dashboard" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">HR Overview</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Key HR metrics, upcoming roster items, and quick actions.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Infractions Trend</h2>
                <div className="text-xs text-gray-500 dark:text-gray-400">{trendMode === 'month' ? 'Last 6 months' : 'Last 8 weeks'}</div>
              </div>
              <Sparkline data={Array.isArray(infractions?.trend?.counts) ? infractions.trend.counts : []} />
              <div className="mt-3">
                <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Top Guards (window)</div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {Array.isArray(infractions?.top_guards) && infractions.top_guards.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4">No infractions in this window.</div>
                  )}
                  {(infractions?.top_guards || []).map((g: any, i: number) => (
                    <div key={i} className="py-2 flex items-center justify-between">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{g.guard?.name || 'Guard'} <span className="text-xs text-gray-500 dark:text-gray-400">{g.guard?.employee_id ? `(${g.guard.employee_id})` : ''}</span></div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{g.count} · {g.last_incident_at || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Infractions Follow-ups</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {Array.isArray(infractions?.followups) && infractions.followups.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No follow-ups pending.</div>
                )}
                {(infractions?.followups || []).map((i: any) => (
                  <div key={i.id} className="py-3 flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full ${i.severity === 'major' ? 'bg-rose-600' : i.severity === 'moderate' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{i.guard?.name || 'Guard'} <span className="text-xs text-gray-500 dark:text-gray-400">{i.guard?.employee_id ? `(${i.guard.employee_id})` : ''}</span></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{i.type} · {i.severity} · {i.incident_date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Status: {i.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">On/Offboarding</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <MiniStat label="Onboarding" value={checklists?.onboarding_active || 0} />
                <MiniStat label="Offboarding" value={checklists?.offboarding_active || 0} />
                <MiniStat label="Due soon (7d)" value={checklists?.due_soon || 0} />
                <MiniStat label="Overdue" value={checklists?.overdue || 0} />
              </div>
              <div>
                <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Upcoming Due Items</div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {Array.isArray(checklists?.due_items) && checklists.due_items.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No items due soon.</div>
                  )}
                  {(checklists?.due_items || []).map((it: any) => (
                    <div key={it.id} className="py-3 flex items-start gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{it.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{it.checklist?.type || '-'} · {it.checklist?.guard?.name || 'Guard'} {it.checklist?.guard?.employee_id ? `(${it.checklist.guard.employee_id})` : ''}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Due: {it.due_date || '-'}</div>
                      </div>
                      <div>
                        <button onClick={() => markItemDone(it.id)} disabled={completingId === it.id} className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white">{completingId === it.id ? 'Completing…' : 'Mark done'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Checklist</h2>
                <button onClick={() => setOpenAssignChecklist(true)} className="text-sm px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Quick Assign</button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Templates available: {(checklists?.templates || []).length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Benefits</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MiniStat label="Active Enrollments" value={benefits?.active_enrollments || 0} />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Compensation</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MiniStat label="Pending Changes" value={compensation?.pending_changes || 0} />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Safety</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MiniStat label="Open Incidents" value={safety?.open_incidents || 0} />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Medical</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MiniStat label="Active Memberships" value={medical?.active_memberships || 0} />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pensions</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MiniStat label="Active Enrollments" value={pensions?.active_enrollments || 0} />
              </div>
            </div>
          </div>

          <QuickRequisitionModal />

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Window</label>
              <select value={windowParam} onChange={(e) => setWindowParam(e.target.value)} className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Trend</label>
              <select value={trendMode} onChange={(e) => setTrendMode(e.target.value)} className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <button onClick={applyFilters} className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700">Apply</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Guards" value={counts.total_guards || 0} color="from-slate-600 to-slate-500" icon="users" />
            <StatCard label="Active" value={counts.active_guards || 0} color="from-emerald-600 to-green-500" icon="badge-check" />
            <StatCard label="Suspended" value={counts.suspended_guards || 0} color="from-amber-600 to-yellow-500" icon="pause-circle" />
            <StatCard label="Drivers" value={counts.drivers || 0} color="from-blue-600 to-sky-500" icon="truck" />
            <StatCard label="Off-days (mo)" value={counts.off_days_this_month || 0} color="from-indigo-600 to-violet-500" icon="calendar" />
            <StatCard label="Jobs" value={(metrics?.jobs?.published_count || 0) + '/' + (metrics?.jobs?.draft_count || 0)} color="from-red-600 to-rose-500" icon="megaphone" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Headcount Trend</h2>
                <div className="text-xs text-gray-500 dark:text-gray-400">{trendMode === 'month' ? 'Last 6 months' : 'Last 8 weeks'}</div>
              </div>
              <Sparkline data={trendNet} />
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                {trendLabels.map((l, i) => (
                  <span key={`${l}-${i}`}>{l}</span>
                ))}
              
              
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="On Duty Now" value={counts.on_duty_now || 0} color="from-teal-600 to-cyan-500" icon="activity" />
                <StatCard label="New Hires (window)" value={counts.hires_window || 0} color="from-lime-600 to-green-500" icon="user-plus" />
                <StatCard label="Exits (window)" value={counts.exits_window || 0} color="from-rose-600 to-pink-500" icon="user-minus" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setOpenOffDay(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
              <IconMapper name="Plus" className="w-4 h-4" /> Quick Off Day
            </button>
            <button onClick={() => setOpenHoliday(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">
              <IconMapper name="Plus" className="w-4 h-4" /> Quick Holiday
            </button>
            <button onClick={() => setOpenInterview(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">
              <IconMapper name="Calendar" className="w-4 h-4" /> Schedule Interview
            </button>
            <button onClick={() => setOpenAssignChecklist(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
              <IconMapper name="ClipboardCheck" className="w-4 h-4" /> Assign Checklist
            </button>
            <a href={route('hr.employees.index')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
              <IconMapper name="Users" className="w-4 h-4" /> Employees
            </a>
            <a href={route('hr.leaves')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
              <IconMapper name="Calendar" className="w-4 h-4" /> Roster
            </a>
            <a href={route('hr.jobs.index')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
              <IconMapper name="Megaphone" className="w-4 h-4" /> Careers
            </a>
            <a href={route('hr.checklists.index')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
              <IconMapper name="ClipboardList" className="w-4 h-4" /> Checklists
            </a>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Attendance Today</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <MiniStat label="Present" value={attendance.present_today || 0} />
              <MiniStat label="Late" value={attendance.late_today || 0} />
              <MiniStat label="Absent" value={attendance.absent_today || 0} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Late check-ins</div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {Array.isArray(attendance.late_list) && attendance.late_list.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No late check-ins recorded today.</div>
                )}
                {(attendance.late_list || []).map((a: any) => (
                  <div key={a.id} className="py-3 flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-500" />
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{a.guard?.name || 'Guard'} <span className="text-xs text-gray-500 dark:text-gray-400">{a.guard?.employee_id ? `(${a.guard.employee_id})` : ''}</span></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{a.check_in_time || '-'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Off Days (7 days)</h2>
                <a href={route('hr.leaves')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View calendar</a>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(upcoming_off_days || []).length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No off days in the next 7 days.</div>
                )}
                {(upcoming_off_days || []).map((o: any) => (
                  <div key={o.id} className="py-3 flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500" />
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{o.guard?.name || 'Guard'} <span className="text-xs text-gray-500 dark:text-gray-400">{o.guard?.employee_id ? `(${o.guard.employee_id})` : ''}</span></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{o.start_date}{o.end_date && o.end_date !== o.start_date ? ` → ${o.end_date}` : ''}</div>
                      {o.reason && <div className="text-xs text-gray-500 dark:text-gray-400">{o.reason}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Holidays (30 days)</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(upcoming_holidays || []).length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No holidays in the next 30 days.</div>
                )}
                {(upcoming_holidays || []).map((h: any, i: number) => (
                  <div key={`${h.id}-${h.date}-${i}`} className="py-3 flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-red-500" />
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{h.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{h.date} · {h.type}{h.is_recurring ? ' · Recurring' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Job Posts</h2>
              <a href={route('hr.jobs.index')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Manage</a>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {(recentJobs || []).length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No job posts yet.</div>
              )}
              {(recentJobs || []).map((j: any) => (
                <div key={j.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{j.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{j.status} {j.posted_at ? `· ${j.posted_at}` : ''}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${j.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'}`}>{j.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Applicants ({(windowParam || '30d')})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MiniStat label="Applied" value={recruitment?.applicants?.applied || 0} />
                <MiniStat label="Screening" value={recruitment?.applicants?.screening || 0} />
                <MiniStat label="Interview" value={recruitment?.applicants?.interview || 0} />
                <MiniStat label="Offered" value={recruitment?.applicants?.offered || 0} />
                <MiniStat label="Hired" value={recruitment?.applicants?.hired || 0} />
                <MiniStat label="Rejected" value={recruitment?.applicants?.rejected || 0} />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Interviews (7 days)</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {Array.isArray(recruitment?.upcoming_interviews) && recruitment.upcoming_interviews.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No interviews scheduled in the next 7 days.</div>
                )}
                {(recruitment?.upcoming_interviews || []).map((iv: any) => (
                  <div key={iv.id} className="py-3 flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-rose-500" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{iv.candidate?.name || 'Candidate'} • <span className="text-xs text-gray-500 dark:text-gray-400">{iv.candidate?.job?.title || 'Job'}</span></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{iv.scheduled_at} · {iv.mode}{iv.location_or_link ? ` · ${iv.location_or_link}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Compliance Overview</h2>
                <a href={route('hr.dashboard.compliance-export')} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Export CSV</a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <MiniStat label="Missing Email" value={compliance?.missing?.email || 0} />
                <MiniStat label="Missing Phone" value={compliance?.missing?.phone || 0} />
                <MiniStat label="Missing DoB" value={compliance?.missing?.date_of_birth || 0} />
                <MiniStat label="Missing ID No" value={compliance?.missing?.id_number || 0} />
                <MiniStat label="Missing Hire Date" value={compliance?.missing?.hire_date || 0} />
                <MiniStat label="Missing Emergency" value={compliance?.missing?.emergency_contact || 0} />
              </div>
              <div>
                <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Top Incomplete Profiles</div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(compliance?.incomplete_profiles || []).length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-6">All profiles look complete.</div>
                  )}
                  {(compliance?.incomplete_profiles || []).map((g: any) => (
                    <div key={g.id} className="py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{g.name} <span className="text-xs text-gray-500 dark:text-gray-400">{g.employee_id ? `(${g.employee_id})` : ''}</span></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Missing: {Array.isArray(g.missing) ? g.missing.join(', ') : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Birthdays (30 days)</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(upcoming_birthdays || []).length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No birthdays in the next 30 days.</div>
                )}
                {(upcoming_birthdays || []).map((b: any) => (
                  <div key={b.id} className="py-3 flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-fuchsia-500" />
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{b.name} <span className="text-xs text-gray-500 dark:text-gray-400">{b.employee_id ? `(${b.employee_id})` : ''}</span></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{b.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <QuickHolidayModal open={openHoliday} onClose={() => setOpenHoliday(false)} form={holidayForm} />
          <QuickOffDayModal open={openOffDay} onClose={() => setOpenOffDay(false)} form={offDayForm} guards={guards || []} />
          <QuickInterviewModal open={openInterview} onClose={() => setOpenInterview(false)} applications={applicationsForSchedule} />
          <QuickChecklistAssignModal open={openAssignChecklist} onClose={() => setOpenAssignChecklist(false)} guards={guards || []} templates={checklists?.templates || []} />
        </div>
      </div>
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
  } as any) as any;
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
function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white`}>
          <IconMapper name={icon} className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="h-16 flex items-center text-sm text-gray-500 dark:text-gray-400">No data</div>;
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
