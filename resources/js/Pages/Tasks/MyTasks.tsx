import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import TaskTrackerLayout from '@/Layouts/TaskTrackerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import IconMapper from '@/Components/IconMapper';
import AddTaskModal from '@/Components/Tasks/AddTaskModal';
import EditTaskModal from '@/Components/Tasks/EditTaskModal';
import CompleteTaskModal from '@/Components/Tasks/CompleteTaskModal';
import Pagination from '@/Components/Common/Pagination';
import { format } from 'date-fns';

interface Task {
  id: number;
  title: string;
  description: string | null;
  module: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  created_at: string;
  assigned_to?: {
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
    assigned: number;
    overdue: number;
    completed: number;
  };
  pettyCash?: {
    current_balance: number;
    total_replenished: number;
    total_spent: number;
    monthly_expenses: number;
    monthly_replenished: number;
    pending_entries: number;
  };
  isExecutiveAssistant?: boolean;
  modules: Record<string, string>;
  statuses: Record<string, string>;
  priorities: Record<string, string>;
  users: { id: number; name: string }[];
  taskCategories: Array<{ id: number; name: string; color?: string }>;
  taskTemplates: Array<{ id: number; name: string; description?: string; module?: string; priority?: string }>;
  filters?: {
    assigned_to: string | null;
    module: string | null;
    status: string | null;
    category?: string | null;
    search?: string | null;
  };
}

export default function MyTasks({ auth, tasks, stats, modules, statuses, priorities, pettyCash, isExecutiveAssistant, users, taskCategories, taskTemplates }: PageProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [completeTask, setCompleteTask] = useState<Task | null>(null);

  const page = usePage<any>();
  const filters = page.props.filters ?? { assigned_to: null, module: null, status: null, category: null, search: null };

  const handleFilterChange = (key: string, value: string | null) => {
    router.get(route('tasks.my'), { ...filters, [key]: value }, { preserveState: true, replace: true });
  };

  const assignedToCount = tasks.data.length;

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
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <TaskTrackerLayout title="My Tasks" user={auth.user}>
      <Head title="My Tasks" />

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.assigned}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Assigned</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          </CardContent>
        </Card>
      </div>

      {isExecutiveAssistant && (
        <Card className="mb-6 bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <Label htmlFor="assigned_to" className="text-red-900 dark:text-gray-200">Assignee</Label>
                <Select value={String(filters.assigned_to ?? '')} onValueChange={(v) => handleFilterChange('assigned_to', v === '' ? null : v)}>
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 w-full">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/3">
                <Label htmlFor="module" className="text-red-900 dark:text-gray-200">Department</Label>
                <Select value={String(filters.module ?? '')} onValueChange={(v) => handleFilterChange('module', v === '' ? null : v)}>
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 w-full"><SelectValue placeholder="All Modules" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Modules</SelectItem>
                    {Object.entries(modules).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/3">
                <Label htmlFor="status" className="text-red-900 dark:text-gray-200">Status</Label>
                <Select value={String(filters.status ?? '')} onValueChange={(v) => handleFilterChange('status', v === '' ? null : v)}>
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 w-full"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {Object.entries(statuses).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/3">
                <Label htmlFor="category" className="text-red-900 dark:text-gray-200">Category</Label>
                <Select value={String(filters.category ?? '')} onValueChange={(v) => handleFilterChange('category', v === '' ? null : v)}>
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 w-full"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {taskCategories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/3">
                <Label htmlFor="search" className="text-red-900 dark:text-gray-200">Search</Label>
                <Input
                  value={filters.search ?? ''}
                  onChange={(e) => handleFilterChange('search', e.target.value || null)}
                  placeholder="Search tasks"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isExecutiveAssistant && pettyCash && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending Entries</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks List */}
      <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-red-900 dark:text-white text-lg">My Assigned Tasks</CardTitle>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <IconMapper name="plus" className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.data.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No tasks assigned to you
              </div>
            ) : (
              tasks.data.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border border-red-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <h3 className="font-semibold text-red-900 dark:text-white">{task.title}</h3>
                        <Badge className={`${getPriorityColor(task.priority)} border-0 text-xs`}>
                          {priorities[task.priority]}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Module: <span className="text-gray-700 dark:text-gray-300">{modules[task.module]}</span>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          From: <span className="text-gray-700 dark:text-gray-300">{task.created_by.name}</span>
                        </span>
                        {task.due_date && (
                          <span className={`${isOverdue(task) ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                            Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                            {isOverdue(task) && <span className="ml-1">(Overdue)</span>}
                          </span>
                        )}
                      </div>
                      {task.categories && task.categories.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.categories.map((category) => (
                            <Badge key={category.id} className="text-xs border-0" style={{ backgroundColor: category.color || '#e2e8f0', color: '#2d3748' }}>
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Comments: {task.comments_count ?? 0}, Time Entries: {task.time_entries_count ?? 0}
                        {task.dependencies && task.dependencies.length > 0 && (
                          <span className="ml-2">Dependencies: {task.dependencies.length}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(task.status)} border-0`}>
                        {statuses[task.status]}
                      </Badge>
                      {task.status !== 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCompleteTask(task)}
                            className="border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
                          >
                            <IconMapper name="check" className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditTask(task)}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          >
                            <IconMapper name="pencil" className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const comment = prompt('Enter comment');
                            if (!comment) return;
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
                            if (!hours || isNaN(Number(hours)) || Number(hours) <= 0) return;
                            const notes = prompt('Optional notes');
                            router.post(route('tasks.time.log', task.id), { hours: Number(hours), notes }, { preserveState: true });
                          }}
                          className="border-gray-500 text-gray-600 hover:bg-gray-100 dark:border-gray-400 dark:text-gray-300 dark:hover:bg-gray-700/20"
                        >
                          <IconMapper name="clock" className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {tasks.last_page > 1 && (
            <div className="mt-4 pt-4 border-t border-red-100 dark:border-gray-700">
              <Pagination links={tasks as any} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
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

      {completeTask && (
        <CompleteTaskModal
          task={completeTask}
          open={!!completeTask}
          onClose={() => setCompleteTask(null)}
        />
      )}
    </TaskTrackerLayout>
  );
}
