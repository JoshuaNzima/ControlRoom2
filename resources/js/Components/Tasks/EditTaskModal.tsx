import React from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import IconMapper from '@/Components/IconMapper';

interface Task {
  id: number;
  title: string;
  description: string | null;
  module: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to?: {
    id: number;
    name: string;
  };
  template_id?: number | null;
  categories?: Array<{ id: number; name: string; color?: string }>;
}

interface Props {
  task: Task;
  open: boolean;
  onClose: () => void;
  modules: Record<string, string>;
  priorities: Record<string, string>;
  statuses: Record<string, string>;
  users: { id: number; name: string }[];
  categories: Array<{ id: number; name: string; color?: string }>;
  templates: Array<{ id: number; name: string; description?: string; module?: string; priority?: string }>;
}

export default function EditTaskModal({ task, open, onClose, modules, priorities, statuses, users, categories, templates }: Props) {
  const { data, setData, put, processing, errors, reset } = useForm({
    title: task.title,
    description: task.description ?? '',
    assigned_to: String(task.assigned_to?.id ?? ''),
    template_id: String(task.template_id ?? ''),
    module: task.module,
    priority: task.priority,
    status: task.status,
    due_date: task.due_date ?? '',
    category_id: task.categories && task.categories.length > 0 ? String(task.categories[0].id) : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('tasks.update', task.id), {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-red-900 dark:text-white flex items-center gap-2">
            <IconMapper name="pencil" className="h-5 w-5 text-blue-600" />
            Edit Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="edit-title" className="text-red-900 dark:text-gray-200">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              className="mt-1 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <Label htmlFor="edit-description" className="text-red-900 dark:text-gray-200">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              className="mt-1 dark:bg-gray-700 dark:border-gray-600"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-module" className="text-red-900 dark:text-gray-200">
                Module <span className="text-red-500">*</span>
              </Label>
              <Select value={data.module} onValueChange={(v) => setData('module', v)}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modules).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.module && (
                <p className="text-sm text-red-500 mt-1">{errors.module}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-status" className="text-red-900 dark:text-gray-200">
                Status
              </Label>
              <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statuses).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-priority" className="text-red-900 dark:text-gray-200">
                Priority
              </Label>
              <Select value={data.priority} onValueChange={(v) => setData('priority', v)}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorities).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-due_date" className="text-red-900 dark:text-gray-200">
                Due Date
              </Label>
              <Input
                id="edit-due_date"
                type="date"
                value={data.due_date}
                onChange={(e) => setData('due_date', e.target.value)}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-template_id" className="text-red-900 dark:text-gray-200">
              Template
            </Label>
            <Select value={data.template_id} onValueChange={(v) => setData('template_id', v)}>
              <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={String(template.id)}>{template.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-category_id" className="text-red-900 dark:text-gray-200">
              Category
            </Label>
            <Select
              value={String(data.category_id)}
              onValueChange={(v) => setData('category_id', v)}
            >
              <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="Select categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-assigned_to" className="text-red-900 dark:text-gray-200">
              Assigned To <span className="text-red-500">*</span>
            </Label>
            {users.length > 0 ? (
              <Select value={data.assigned_to} onValueChange={(v) => setData('assigned_to', v)}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="edit-assigned_to"
                type="number"
                value={data.assigned_to}
                onChange={(e) => setData('assigned_to', e.target.value)}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600"
              />
            )}
            {errors.assigned_to && (
              <p className="text-sm text-red-500 mt-1">{errors.assigned_to}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
