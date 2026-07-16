import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { useForm } from '@inertiajs/react';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  module: string;
  assigned_to_name?: string;
}

interface WeeklyTasks {
  monday: Task[];
  tuesday: Task[];
  wednesday: Task[];
  thursday: Task[];
  friday: Task[];
  saturday: Task[];
  sunday: Task[];
}

interface TaskStats {
  today_pending: number;
  week_total: number;
  overdue: number;
  completed_today: number;
}

interface ModuleTask {
  label: string;
  pending: number;
  due_this_week: number;
}

interface FrontDeskStats {
  open_tickets: number;
  visitors_today: number;
  scheduled_appointments: number;
  pending_followups: number;
}

interface Visitor {
  id: number;
  name: string;
  company?: string;
  purpose?: string;
  created_at: string;
  status: string;
}

interface TeamMember {
  id: number;
  name: string;
}

interface Props {
  auth?: any;
  weeklyTasks: WeeklyTasks;
  todayTasks: Task[];
  taskStats: TaskStats;
  moduleTasks: Record<string, ModuleTask>;
  frontDeskStats: FrontDeskStats;
  recentVisitors: Visitor[];
  teamMembers: TeamMember[];
  modules: Record<string, string>;
  priorities: Record<string, string>;
  isAssistant: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-600 dark:bg-red-700',
  high: 'bg-orange-500 dark:bg-orange-600',
  medium: 'bg-yellow-500 dark:bg-yellow-600',
  low: 'bg-green-500 dark:bg-green-600',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400',
  in_progress: 'text-blue-400',
  completed: 'text-green-400',
};

const MODULE_ICONS: Record<string, string> = {
  control_room: 'activity',
  hr: 'users',
  assets: 'truck',
  requisitions: 'clipboard-list',
  finance: 'bar-chart-2',
  training: 'graduation-cap',
  front_office: 'id-card',
  front_desk: 'id-card',
  general: 'circle',
};

export default function AssistantDashboard({
  auth = {},
  weeklyTasks,
  todayTasks,
  taskStats,
  moduleTasks,
  frontDeskStats,
  recentVisitors,
  teamMembers,
  modules,
  priorities,
  isAssistant,
}: Props) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data, setData, post, processing, reset } = useForm({
    title: '',
    description: '',
    assigned_to: '',
    module: 'front_desk',
    priority: 'medium',
    due_date: '',
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('tasks.store'), {
      onSuccess: () => {
        setCreateModalOpen(false);
        reset();
      },
    });
  };

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const statsCards = [
    {
      label: 'Pending Today',
      value: taskStats.today_pending,
      icon: 'clipboard-list',
      color: 'bg-red-800 dark:bg-red-900',
      textColor: 'text-white',
    },
    {
      label: 'This Week',
      value: taskStats.week_total,
      icon: 'calendar',
      color: 'bg-red-700 dark:bg-red-800',
      textColor: 'text-white',
    },
    {
      label: 'Overdue',
      value: taskStats.overdue,
      icon: 'alert-triangle',
      color: 'bg-orange-600 dark:bg-orange-700',
      textColor: 'text-white',
    },
    {
      label: 'Completed Today',
      value: taskStats.completed_today,
      icon: 'check-circle',
      color: 'bg-green-700 dark:bg-green-800',
      textColor: 'text-white',
    },
  ];

  const frontDeskCards = [
    {
      label: 'Open Tickets',
      value: frontDeskStats.open_tickets,
      href: route('admin.front-desk.tickets.index'),
    },
    {
      label: 'Visitors Today',
      value: frontDeskStats.visitors_today,
      href: route('admin.front-desk.visitors.index'),
    },
    {
      label: 'Pending Follow-ups',
      value: frontDeskStats.pending_followups,
      href: route('tasks.dashboard', { module: 'front_office' }),
    },
  ];

  return (
    <AuthenticatedLayout header="Assistant Dashboard" user={auth?.user as any}>
      <Head title="Assistant Dashboard" />

      <div className="min-h-screen bg-red-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-red-900 dark:text-red-100">
              Assistant Dashboard
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-red-800 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white"
              >
                <IconMapper name="plus" className="h-4 w-4 mr-2" />
                New Task
              </Button>
              <Link href={route('tasks.dashboard')}>
                <Button variant="outline" className="border-red-300 dark:border-red-700 text-red-800 dark:text-red-200">
                  <IconMapper name="external-link" className="h-4 w-4 mr-2" />
                  Full Task View
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statsCards.map((card) => (
              <div
                key={card.label}
                className={`${card.color} rounded-lg p-4 flex items-center justify-between`}
              >
                <div>
                  <p className={`text-sm ${card.textColor} opacity-80`}>{card.label}</p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
                <IconMapper name={card.icon} className={`h-8 w-8 ${card.textColor} opacity-60`} />
              </div>
            ))}
          </div>

          {/* Weekly Task Tracker */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-red-900 dark:bg-gray-950 border-b border-red-800 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <IconMapper name="calendar" className="h-5 w-5" />
                Weekly Task Tracker
              </h2>
            </div>
            <div className="p-4">
              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-7 gap-2">
                {DAYS.map((day, index) => {
                  const tasks = weeklyTasks[day] || [];
                  const isToday = index === todayIndex;
                  return (
                    <div
                      key={day}
                      className={`rounded-lg border ${
                        isToday
                          ? 'border-red-500 dark:border-red-400 ring-2 ring-red-200 dark:ring-red-900'
                          : 'border-red-100 dark:border-gray-700'
                      } bg-red-50 dark:bg-gray-900 min-h-[200px]`}
                    >
                      <div
                        className={`px-2 py-2 text-center border-b ${
                          isToday
                            ? 'bg-red-800 dark:bg-red-700 text-white'
                            : 'bg-red-100 dark:bg-gray-800 text-red-800 dark:text-gray-300'
                        } rounded-t-lg`}
                      >
                        <span className="text-xs font-medium uppercase">{DAY_LABELS[day]}</span>
                        {isToday && <span className="block text-xs opacity-75">Today</span>}
                      </div>
                      <div className="p-2 space-y-2">
                        {tasks.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No tasks</p>
                        ) : (
                          tasks.map((task) => (
                            <div
                              key={task.id}
                              className="bg-white dark:bg-gray-800 rounded p-2 text-xs shadow-sm border border-red-100 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                                  {task.title}
                                </span>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority] || 'bg-gray-400'}`} />
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <IconMapper name={MODULE_ICONS[task.module] || 'circle'} className="h-3 w-3" />
                                <span className="text-[10px] truncate">{task.assigned_to_name || 'Unassigned'}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {DAYS.map((day, index) => {
                  const tasks = weeklyTasks[day] || [];
                  const isToday = index === todayIndex;
                  return (
                    <div
                      key={day}
                      className={`rounded-lg border ${
                        isToday
                          ? 'border-red-500 dark:border-red-400 ring-1 ring-red-200 dark:ring-red-900'
                          : 'border-red-100 dark:border-gray-700'
                      } bg-red-50 dark:bg-gray-900`}
                    >
                      <button
                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                        className={`w-full px-4 py-3 flex items-center justify-between ${
                          isToday
                            ? 'bg-red-800 dark:bg-red-700 text-white'
                            : 'bg-red-100 dark:bg-gray-800 text-red-800 dark:text-gray-300'
                        } rounded-t-lg ${tasks.length === 0 ? 'rounded-lg' : ''}`}
                      >
                        <span className="font-medium">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                        <div className="flex items-center gap-2">
                          {isToday && <span className="text-xs opacity-75">Today</span>}
                          <span className="bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded text-sm">{tasks.length}</span>
                          <IconMapper name={selectedDay === day ? 'chevron-up' : 'chevron-down'} className="h-4 w-4" />
                        </div>
                      </button>
                      {selectedDay === day && tasks.length > 0 && (
                        <div className="p-3 space-y-2">
                          {tasks.map((task) => (
                            <div
                              key={task.id}
                              className="bg-white dark:bg-gray-800 rounded p-3 text-sm shadow-sm border border-red-100 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{task.title}</span>
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority] || 'bg-gray-400'}`} />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs">
                                <div className="flex items-center gap-1">
                                  <IconMapper name={MODULE_ICONS[task.module] || 'circle'} className="h-3 w-3" />
                                  <span>{modules[task.module] || task.module}</span>
                                </div>
                                <span>{task.assigned_to_name || 'Unassigned'}</span>
                              </div>
                              <div className="mt-1">
                                <span className={`text-xs ${STATUS_COLORS[task.status] || 'text-gray-400'}`}>{task.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-100 dark:border-gray-700">
              <div className="px-4 py-3 bg-red-900 dark:bg-gray-950 border-b border-red-800 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <IconMapper name="star" className="h-5 w-5" />
                  Today's Priority Tasks
                </h2>
              </div>
              <div className="p-4">
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <IconMapper name="check-circle" className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No priority tasks for today!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 bg-red-50 dark:bg-gray-900 rounded-lg border border-red-100 dark:border-gray-700"
                      >
                        <div className={`w-3 h-3 rounded-full mt-1 ${PRIORITY_COLORS[task.priority] || 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <IconMapper name={MODULE_ICONS[task.module] || 'circle'} className="h-3 w-3" />
                            <span className="truncate">{modules[task.module]}</span>
                            <span>•</span>
                            <span className="truncate">{task.assigned_to_name}</span>
                          </div>
                        </div>
                        <Link href={route('tasks.dashboard')}>
                          <Button size="sm" variant="outline" className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Module Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-100 dark:border-gray-700">
              <div className="px-4 py-3 bg-red-900 dark:bg-gray-950 border-b border-red-800 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <IconMapper name="layers" className="h-5 w-5" />
                  Module Task Overview
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {Object.entries(moduleTasks).map(([key, module]) => (
                    <Link
                      key={key}
                      href={route('tasks.dashboard', { module: key })}
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-gray-900 rounded-lg border border-red-100 dark:border-gray-700 hover:bg-red-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-800 dark:bg-red-700 rounded-lg">
                          <IconMapper name={MODULE_ICONS[key] || 'circle'} className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{module.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Due this week: {module.due_this_week}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        {module.pending} pending
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Front Desk Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-100 dark:border-gray-700">
            <div className="px-4 py-3 bg-red-900 dark:bg-gray-950 border-b border-red-800 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <IconMapper name="id-card" className="h-5 w-5" />
                Front Desk Overview
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {frontDeskCards.map((card) => (
                  <Link
                    key={card.label}
                    href={card.href}
                    className="flex items-center justify-between p-4 bg-red-50 dark:bg-gray-900 rounded-lg border border-red-100 dark:border-gray-700 hover:bg-red-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">{card.value}</p>
                    </div>
                    <IconMapper name="arrow-right" className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Visitors */}
          {recentVisitors.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-100 dark:border-gray-700">
              <div className="px-4 py-3 bg-red-900 dark:bg-gray-950 border-b border-red-800 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <IconMapper name="users" className="h-5 w-5" />
                  Recent Visitors
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {recentVisitors.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-gray-900 rounded-lg border border-red-100 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{visitor.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{visitor.company} • {visitor.purpose}</p>
                      </div>
                      <span className="text-sm text-gray-400 dark:text-gray-500">{new Date(visitor.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-900 dark:text-red-100 flex items-center gap-2">
              <IconMapper name="plus" className="h-5 w-5" />
              Create New Task
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">Task Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                className="mt-1 bg-white dark:bg-gray-900 border-red-200 dark:border-gray-700"
                required
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
              <Input
                id="description"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                className="mt-1 bg-white dark:bg-gray-900 border-red-200 dark:border-gray-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_to" className="text-gray-700 dark:text-gray-300">Assign To</Label>
                <Select value={data.assigned_to} onValueChange={(value) => setData('assigned_to', value)}>
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-900 border-red-200 dark:border-gray-700">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date" className="text-gray-700 dark:text-gray-300">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={data.due_date}
                  onChange={(e) => setData('due_date', e.target.value)}
                  className="mt-1 bg-white dark:bg-gray-900 border-red-200 dark:border-gray-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="module" className="text-gray-700 dark:text-gray-300">Module</Label>
                <Select value={data.module} onValueChange={(value) => setData('module', value)}>
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-900 border-red-200 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(modules).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" className="text-gray-700 dark:text-gray-300">Priority</Label>
                <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-900 border-red-200 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorities).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="border-red-300 dark:border-red-700 text-red-800 dark:text-red-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="bg-red-800 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white"
              >
                {processing ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}

