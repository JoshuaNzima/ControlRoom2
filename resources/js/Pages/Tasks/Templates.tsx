import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TaskTrackerLayout from '@/Layouts/TaskTrackerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import IconMapper from '@/Components/IconMapper';

interface TemplateItem {
  title: string;
  description: string | null;
  module: string | null;
  priority: string | null;
}

interface PageProps {
  auth: { user: any };
  templates: Array<{
    id: number;
    name: string;
    description: string | null;
    module: string | null;
    priority: string;
    items: Array<{ title: string; description: string | null; module: string | null; priority: string }>;
  }>;
  modules: Record<string, string>;
  priorities: Record<string, string>;
}

export default function TaskTemplates({ auth, templates, modules, priorities }: PageProps) {
  const [items, setItems] = useState<TemplateItem[]>([{ title: '', description: '', module: '', priority: '' }]);
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
    module: '',
    priority: 'medium',
    items: [{ title: '', description: '', module: '', priority: 'medium' }],
  });

  const addItem = () => setItems((prev) => [...prev, { title: '', description: '', module: '', priority: 'medium' }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, key: keyof TemplateItem, value: string) => {
    const newItems = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    setItems(newItems);
    setData('items', newItems.map((item) => ({
      title: item.title,
      description: item.description || '',
      module: item.module || '',
      priority: item.priority || 'medium',
    })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('tasks.templates.store'), {
      onSuccess: () => {
        reset();
        setItems([{ title: '', description: '', module: '', priority: 'medium' }]);
      },
    });
  };

  return (
    <TaskTrackerLayout title="Task Templates" user={auth.user}>
      <Head title="Task Templates" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Create Task Template</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="module">Module</Label>
                  <Select value={data.module} onValueChange={(v) => setData('module', v)}>
                    <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600">
                      <SelectValue placeholder="Any module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Module</SelectItem>
                      {Object.entries(modules).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
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
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Item {index + 1}</h3>
                      <Button type="button" variant="outline" onClick={() => removeItem(index)}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Input
                        value={item.title}
                        placeholder="Item title"
                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                        className="dark:bg-gray-700 dark:border-gray-600"
                        required
                      />
                      <Textarea
                        value={item.description ?? ''}
                        placeholder="Item description"
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="dark:bg-gray-700 dark:border-gray-600"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Select value={item.module || ''} onValueChange={(v) => updateItem(index, 'module', v)}>
                          <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600">
                            <SelectValue placeholder="Module" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Default</SelectItem>
                            {Object.entries(modules).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={item.priority || 'medium'} onValueChange={(v) => updateItem(index, 'priority', v)}>
                          <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600">
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
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addItem} className="w-full">
                Add Template Item
              </Button>
              <Button type="submit" disabled={processing} className="w-full bg-red-600 hover:bg-red-700 text-white">
                {processing ? 'Saving...' : 'Save Template'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Existing Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No templates found.</p>
            ) : (
              <ul className="space-y-3">
                {templates.map((template) => (
                  <li key={template.id} className="border border-gray-200 dark:border-gray-700 p-3 rounded-md">
                    <div className="font-semibold text-red-900 dark:text-white">{template.name}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{template.description || 'No description'}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.items.length} items</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </TaskTrackerLayout>
  );
}
