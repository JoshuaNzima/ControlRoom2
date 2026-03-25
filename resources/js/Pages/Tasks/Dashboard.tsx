import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import TaskTrackerLayout from '@/Layouts/TaskTrackerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import IconMapper from '@/Components/IconMapper';
import AddTaskModal from '@/Components/Tasks/AddTaskModal';
import EditTaskModal from '@/Components/Tasks/EditTaskModal';
import CompleteTaskModal from '@/Components/Tasks/CompleteTaskModal';
import DeleteTaskModal from '@/Components/Tasks/DeleteTaskModal';
import Pagination from '@/Components/Common/Pagination';
import { formatDistanceToNow, format } from 'date-fns';

interface Task {
  id: number;
  title: string;
  description: string | null;
  module: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  created_at: string;
  assigned_to: {
    id: number;
    name: string;
  };
  created_by: {
    id: number;
    name: string;
  };
  categories?: Array<{ id: number; name: string; color?: string }>;
  dependencies?: Array<any>;
  comments_count?: number;
  time_entries_count?: number;
}

interface PageProps {
  auth: { user: any };
  tasks: {
    data: Task[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
  pettyCash?: {
    current_balance: number;
    total_replenished: number;
    total_spent: number;
    monthly_expenses: number;
    monthly_replenished: number;
    pending_entries: number;
  };
  assigneeStats?: Array<{
    user_id: number;
    name: string;
    open_tasks: number;
    tasks: Array<{ id: number; title: string; status: string; priority: string; due_date: string | null }>;
  }>;
  departmentStats?: Array<{
    module: string;
    module_name: string;
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  }>;
  overdueAnalytics?: {
    total_overdue: number;
    overdue_by_priority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    overdue_by_department: Record<string, number>;
  };
  isExecutiveAssistant: boolean;
  isFrontOffice: boolean;
  filters: {
    filter: string;
    module: string | null;
    priority: string | null;
    category?: string | null;
    search?: string | null;
  };
  modules: Record<string, string>;
  statuses: Record<string, string>;
  priorities: Record<string, string>;
  taskCategories: Array<{ id: number; name: string; color?: string }>;
  taskTemplates: Array<{ id: number; name: string; description?: string; module?: string; priority?: string; }>; 
  users: { id: number; name: string }[];
}

export default function TaskDashboard({ auth, tasks, stats, isExecutiveAssistant, isFrontOffice, filters, modules, statuses, priorities, users, pettyCash, assigneeStats, departmentStats, overdueAnalytics, taskCategories, taskTemplates }: PageProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [completeTask, setCompleteTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const handleFilterChange = (key: string, value: string | null) => {
    router.get(route('tasks.dashboard'), { ...filters, [key]: value }, { preserveState: true });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-500/10 text-gray-500';
      case 'medium': return 'bg-blue-500/10 text-blue-500';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'urgent': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return false;
    return new Date(task.due_date) < new Date();
  };

  const getOverduePriorityColor = (count: number) => {
    if (count === 0) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (count <= 2) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (count <= 5) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  const getRowColor = (task: Task) => {
    if (isOverdue(task)) {
      if (task.priority === 'urgent') return 'bg-red-50 dark:bg-red-950/30 border-l-4 border-l-red-600';
      if (task.priority === 'high') return 'bg-orange-50 dark:bg-orange-950/30 border-l-4 border-l-orange-500';
      return 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500';
    }
    if (task.priority === 'urgent') return 'bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-400';
    if (task.priority === 'high') return 'bg-orange-50/50 dark:bg-orange-950/20 border-l-4 border-l-orange-400';
    return '';
  };

  return (
    <TaskTrackerLayout title="Task Dashboard" user={auth.user}>
      <Head title="Task Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.in_progress}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {isExecutiveAssistant && pettyCash && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800 border-yellow-100 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{pettyCash.current_balance.toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Petty Cash Balance</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-blue-100 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{pettyCash.monthly_expenses.toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Expenses</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-green-100 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{pettyCash.monthly_replenished.toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Replenished</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-orange-100 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{pettyCash.pending_entries}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending Petty Cash Entries</div>
              <Button
                size="sm"
                className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => router.visit(route('finance.petty-cash.index'))}
              >
                Manage Petty Cash
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

        {taskCategories && taskCategories.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-white mb-2">Task Categories</h2>
            <div className="flex flex-wrap gap-2">
              {taskCategories.map((cat) => (
                <Badge key={cat.id} className="border-0" style={{ backgroundColor: cat.color || '#edf2f7', color: '#1a202c' }}>
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {taskTemplates && taskTemplates.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-white mb-2">Task Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {taskTemplates.map((template) => (
                <Card key={template.id} className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold text-red-900 dark:text-white">{template.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description || 'No description'}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      {isExecutiveAssistant && assigneeStats && assigneeStats.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-red-900 dark:text-white mb-3">Assigned Task Boxes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assigneeStats.map((assignee) => (
              <Card key={assignee.user_id} className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                <CardContent>
                  <div className="text-lg font-bold text-red-900 dark:text-white">{assignee.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Open tasks: {assignee.open_tasks}</div>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {assignee.tasks.slice(0, 3).map((task) => (
                      <li key={task.id}>• {task.title} ({task.status})</li>
                    ))}
                    {assignee.tasks.length > 3 && <li>…and {assignee.tasks.length - 3} more</li>}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isExecutiveAssistant && departmentStats && departmentStats.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-red-900 dark:text-white mb-3">Department Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departmentStats.map((dept) => (
              <Card key={dept.module} className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                <CardContent>
                  <div className="font-bold text-red-900 dark:text-white">{dept.module_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{dept.total} tasks</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300 mb-2">
                    <div>Pending: {dept.pending}</div>
                    <div>In Progress: {dept.in_progress}</div>
                    <div>Completed: {dept.completed}</div>
                    <div>Overdue: {dept.overdue}</div>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600" style={{ width: `${dept.total > 0 ? (dept.completed / dept.total) * 100 : 0}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Analytics */}
      {overdueAnalytics && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-red-900 dark:text-white mb-3">Overdue Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueAnalytics.total_overdue}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Overdue</div>
              </CardContent>
            </Card>
            <Card className={`border-red-100 dark:border-gray-700 ${getOverduePriorityColor(overdueAnalytics.overdue_by_priority.urgent)}`}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{overdueAnalytics.overdue_by_priority.urgent}</div>
                <div className="text-sm opacity-80">Urgent Overdue</div>
              </CardContent>
            </Card>
            <Card className={`border-red-100 dark:border-gray-700 ${getOverduePriorityColor(overdueAnalytics.overdue_by_priority.high)}`}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{overdueAnalytics.overdue_by_priority.high}</div>
                <div className="text-sm opacity-80">High Overdue</div>
              </CardContent>
            </Card>
            <Card className={`border-red-100 dark:border-gray-700 ${getOverduePriorityColor(overdueAnalytics.overdue_by_priority.medium)}`}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{overdueAnalytics.overdue_by_priority.medium}</div>
                <div className="text-sm opacity-80">Medium Overdue</div>
              </CardContent>
            </Card>
            <Card className={`border-red-100 dark:border-gray-700 ${getOverduePriorityColor(overdueAnalytics.overdue_by_priority.low)}`}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{overdueAnalytics.overdue_by_priority.low}</div>
                <div className="text-sm opacity-80">Low Overdue</div>
              </CardContent>
            </Card>
          </div>
          {overdueAnalytics.overdue_by_department && Object.keys(overdueAnalytics.overdue_by_department).length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(overdueAnalytics.overdue_by_department).map(([module, count]) => (
                <div key={module} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-100 dark:border-red-900">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{modules[module] || module}</span>
                  <Badge className={`${getOverduePriorityColor(count as number)} border-0`}>{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <Select value={filters.filter} onValueChange={(v) => handleFilterChange('filter', v)}>
                <SelectTrigger className="w-[150px] dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.module ?? 'all'} onValueChange={(v) => handleFilterChange('module', v === 'all' ? null : v)}>
                <SelectTrigger className="w-[150px] dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Object.entries(modules).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.priority ?? 'all'} onValueChange={(v) => handleFilterChange('priority', v === 'all' ? null : v)}>
                <SelectTrigger className="w-[150px] dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Object.entries(priorities).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.category ?? 'all'} onValueChange={(v) => handleFilterChange('category', v === 'all' ? null : v)}>
                <SelectTrigger className="w-[150px] dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {taskCategories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={filters.search ?? ''}
                onChange={(e) => handleFilterChange('search', e.target.value || null)}
                placeholder="Search tasks"
                className="w-[220px] dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {isFrontOffice && (
              <>
                <Button
                  onClick={() => setAddModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <IconMapper name="plus" className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
                <Button
                  onClick={() => router.visit(route('tasks.templates'))}
                  variant="outline"
                  className="border-gray-300 text-gray-700 dark:text-gray-300"
                >
                  <IconMapper name="layers" className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task feature table view (no module-level dashboard) */}

      {/* Tasks Table */}
      <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-red-900 dark:text-white text-lg">Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-red-100 dark:border-gray-700">
                  <TableHead className="text-red-900 dark:text-gray-200">Task</TableHead>
                  <TableHead className="text-red-900 dark:text-gray-200">Department</TableHead>
                  <TableHead className="text-red-900 dark:text-gray-200">Priority</TableHead>
                  <TableHead className="text-red-900 dark:text-gray-200">Status</TableHead>
                  <TableHead className="text-red-900 dark:text-gray-200">Assigned To</TableHead>
                  <TableHead className="text-red-900 dark:text-gray-200">Due Date</TableHead>
                  <TableHead className="text-red-900 dark:text-gray-200 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.data.map((task) => (
                    <TableRow key={task.id} className={`border-red-100 dark:border-gray-700 ${getRowColor(task)}`}>
                      <TableCell>
                        <div className="font-medium text-red-900 dark:text-white">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{task.description}</div>
                        )}
                        {task.categories && task.categories.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {task.categories.map((category) => (
                              <Badge key={category.id} className="text-xs border-0" style={{ backgroundColor: category.color || '#ebf8ff', color: '#2c5282' }}>
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Comments: {task.comments_count ?? 0}, Hours: {task.time_entries_count ?? 0}
                          {task.dependencies && task.dependencies.length > 0 && (
                            <span className="ml-2">Dependencies: {task.dependencies.length}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{modules[task.module]}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(task.priority)} border-0`}>
                          {priorities[task.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(task.status)} border-0`}>
                          {statuses[task.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {task.assigned_to.name}
                      </TableCell>
                      <TableCell>
                        {task.due_date ? (
                          <div className={isOverdue(task) ? 'text-red-600 font-semibold dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}>
                            {format(new Date(task.due_date), 'MMM dd, yyyy')}
                            {isOverdue(task) && (
                              <span className="text-xs ml-1 text-red-600 dark:text-red-400 font-bold">(Overdue)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCompleteTask(task)}
                              className="border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              <IconMapper name="check" className="h-4 w-4" />
                            </Button>
                          )}
                          {isFrontOffice && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditTask(task)}
                                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                <IconMapper name="pencil" className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const comment = prompt('Enter comment');
                                  if (!comment) {
                                    return;
                                  }
                                  router.post(route('tasks.comment.add', task.id), { comment }, { preserveState: true });
                                }}
                                className="border-gray-500 text-gray-600 hover:bg-gray-100 dark:border-gray-400 dark:text-gray-300 dark:hover:bg-gray-700/20"
                              >
                                <IconMapper name="message-circle" className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const hours = prompt('Enter hours spent (decimal)');
                                  if (!hours || isNaN(Number(hours)) || Number(hours) <= 0) {
                                    return;
                                  }
                                  const notes = prompt('Optional notes');
                                  router.post(route('tasks.time.log', task.id), { hours: Number(hours), notes }, { preserveState: true });
                                }}
                                className="border-gray-500 text-gray-600 hover:bg-gray-100 dark:border-gray-400 dark:text-gray-300 dark:hover:bg-gray-700/20"
                              >
                                <IconMapper name="clock" className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteTask(task)}
                                className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <IconMapper name="trash-2" className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {tasks.last_page > 1 && (
            <div className="p-4 border-t border-red-100 dark:border-gray-700">
              <Pagination links={tasks as any} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {completeTask && (
        <CompleteTaskModal
          task={completeTask}
          open={!!completeTask}
          onClose={() => setCompleteTask(null)}
        />
      )}

      {isFrontOffice && (
        <>
          <AddTaskModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            modules={modules}
            priorities={priorities}
            users={users}
            categories={taskCategories}
            templates={taskTemplates}
          />

          {editTask && (
            <EditTaskModal
              task={editTask}
              open={!!editTask}
              onClose={() => setEditTask(null)}
              modules={modules}
              priorities={priorities}
              statuses={statuses}
              users={users}
              categories={taskCategories}
              templates={taskTemplates}
            />
          )}

          {deleteTask && (
            <DeleteTaskModal
              task={deleteTask}
              open={!!deleteTask}
              onClose={() => setDeleteTask(null)}
            />
          )}
        </>
      )}
    </TaskTrackerLayout>
  );
}
