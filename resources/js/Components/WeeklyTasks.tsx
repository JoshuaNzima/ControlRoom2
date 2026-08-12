import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Checkbox } from '@/Components/ui/checkbox';
import IconMapper from '@/Components/IconMapper';
import { format, isPast, isThisWeek, parseISO } from 'date-fns';

interface Task {
  id: number;
  title: string;
  description: string | null;
  module: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_to?: {
    id: number;
    name: string;
  };
}

interface WeeklyTasksProps {
  tasks: Task[];
  module?: string;
  showModule?: boolean;
  isExecutiveAssistant?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function WeeklyTasks({ tasks, module, showModule = false, isExecutiveAssistant = false, isOpen, onClose }: WeeklyTasksProps) {
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter tasks for this week
  const thisWeekTasks = tasks.filter(task => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (module && task.module !== module) return false;
    if (!task.due_date) return true; // Show tasks without due date
    const dueDate = parseISO(task.due_date);
    return isThisWeek(dueDate) || isPast(dueDate); // Include overdue tasks
  });

  const sortedTasks = thisWeekTasks.sort((a, b) => {
    // Sort by priority: urgent > high > medium > low
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const handleComplete = (taskId: number) => {
    setCompletingId(taskId);
    router.post(route('tasks.complete', taskId), {}, {
      onFinish: () => setCompletingId(null),
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return isPast(parseISO(dueDate)) && !isThisWeek(parseISO(dueDate));
  };

  const content = (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-red-900 dark:text-white text-base flex items-center gap-2">
            <IconMapper name="clipboard-list" className="h-5 w-5 text-red-600" />
            This Week's Tasks
            {sortedTasks.length > 0 && (
              <Badge className="ml-2 bg-red-600 text-white">{sortedTasks.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.get(route('tasks.my'))}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                View All
                <IconMapper name="arrow-right" className="h-4 w-4 ml-1" />
              </Button>
            )}
            {isMobile && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              >
                <IconMapper name="x" className="h-5 w-5" />
              </Button>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              >
                <IconMapper name={isCollapsed ? 'chevron-down' : 'chevron-up'} className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {(!isCollapsed || isMobile) && (
        <CardContent className="pt-0">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No tasks for this week
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    task.status === 'in_progress'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleComplete(task.id)}
                    disabled={completingId === task.id}
                    className="mt-0.5 border-red-300 dark:border-gray-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-red-900 dark:text-white text-sm line-clamp-2">
                        {task.title}
                      </span>
                      <Badge className={`${getPriorityColor(task.priority)} text-xs shrink-0`}>
                        {task.priority.charAt(0).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {showModule && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {task.module.replace('_', ' ')}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`${isOverdue(task.due_date) ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          {isOverdue(task.due_date) ? 'Overdue: ' : 'Due: '}
                          {format(parseISO(task.due_date), 'MMM dd')}
                        </span>
                      )}
                      {isExecutiveAssistant && task.assigned_to && (
                        <span className="text-gray-500 dark:text-gray-400">
                          Assigned: {task.assigned_to.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isMobile && (
                <Button
                  variant="outline"
                  className="w-full mt-4 border-red-200 dark:border-gray-700"
                  onClick={() => router.get(route('tasks.my'))}
                >
                  View All Tasks
                  <IconMapper name="arrow-right" className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </>
  );

  // Mobile modal view
  if (isMobile && isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <Card className="w-full max-w-md max-h-[85vh] overflow-hidden bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700 shadow-2xl">
          {content}
        </Card>
      </div>
    );
  }

  // Mobile but not open (don't render)
  if (isMobile) {
    return null;
  }

  // Desktop card view
  return (
    <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
      {content}
    </Card>
  );
}
