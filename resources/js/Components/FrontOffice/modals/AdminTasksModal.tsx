import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import axios from 'axios';
import { format } from 'date-fns';

interface AdminTask {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface AdminTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'executive' | 'personal';
}

export default function AdminTasksModal({ open, onOpenChange, category }: { open: boolean; onOpenChange: (open: boolean) => void; category: 'executive' | 'personal' }) {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  const isExecutive = category === 'executive';
  const dutyType = isExecutive ? 'office_admin_support' : 'general_admin_support';
  const apiEndpoint = isExecutive ? '/front-office/api/office-duties' : '/front-office/api/personal-duties';
  const modalTitle = isExecutive ? 'Office & Administrative Support' : 'General Administrative Support';
  const iconColor = isExecutive ? 'bg-teal-600' : 'bg-lime-600';

  useEffect(() => {
    if (open) fetchTasks();
  }, [open]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiEndpoint, { params: { duty_type: dutyType } });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch admin tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        duty_type: dutyType,
        ...(isExecutive ? {} : { employer_name: 'Principal' }),
      };
      await axios.post(apiEndpoint, payload);
      setFormData({ title: '', description: '', priority: 'medium' });
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`${apiEndpoint}/${id}`, { status });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await axios.delete(`${apiEndpoint}/${id}`);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`p-2 ${iconColor} rounded-lg text-white`}>
              <IconMapper name="ClipboardList" size={24} />
            </div>
            {modalTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tasks ({tasks.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className={`${iconColor} hover:opacity-90 text-white`}>
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Add Task'}
            </Button>
          </div>

          {showForm && (
            <Card className={`p-4 ${isExecutive ? 'border-teal-200 dark:border-teal-800' : 'border-lime-200 dark:border-lime-800'}`}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Process expense claims"
                    required
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description/Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task details, steps required..."
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className={`${iconColor} hover:opacity-90 text-white`}>Save Task</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="ClipboardList" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No admin tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Added: {format(new Date(task.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {task.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(task.id, 'completed')}
                          className="text-green-600 border-green-200 dark:border-green-800">
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteTask(task.id)}
                        className="text-red-600 border-red-200 dark:border-red-800">
                        <IconMapper name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
