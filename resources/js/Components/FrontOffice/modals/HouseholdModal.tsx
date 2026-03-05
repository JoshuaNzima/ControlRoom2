import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import axios from 'axios';
import { format } from 'date-fns';

interface HouseholdTask {
  id: number;
  title: string;
  description: string | null;
  service_provider: string | null;
  household_category: string | null;
  scheduled_start: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface HouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HouseholdModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_provider: '',
    household_category: 'cleaning',
    scheduled_start: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (open) fetchTasks();
  }, [open]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/personal-duties', {
        params: { duty_type: 'household_coordination' }
      });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch household tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/personal-duties', {
        ...formData,
        duty_type: 'household_coordination',
        employer_name: 'Principal',
      });
      setFormData({ title: '', description: '', service_provider: '', household_category: 'cleaning', scheduled_start: '', priority: 'medium' });
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/front-office/api/personal-duties/${id}`, { status });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await axios.delete(`/front-office/api/personal-duties/${id}`);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getCategoryIcon = (category: string | null) => {
    const icons: Record<string, string> = {
      cleaning: 'Sparkles',
      maintenance: 'Wrench',
      catering: 'UtensilsCrossed',
      gardening: 'Flower2',
      security: 'Shield',
      other: 'Home',
    };
    return icons[category || 'other'] || 'Home';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <IconMapper name="Home" size={24} />
            </div>
            Household Coordination
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Household Tasks ({tasks.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Add Task'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-indigo-200 dark:border-indigo-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Task Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Schedule plumber visit"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={formData.household_category} 
                      onValueChange={(value) => setFormData({ ...formData, household_category: value })}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="catering">Catering</SelectItem>
                        <SelectItem value="gardening">Gardening</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Provider</Label>
                    <Input
                      value={formData.service_provider}
                      onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
                      placeholder="e.g., ABC Cleaning Services"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scheduled Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_start}
                      onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Details</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Specific requirements, contact info, access instructions..."
                    rows={2}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Task</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="Home" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No household tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <IconMapper name={getCategoryIcon(task.household_category)} size={18} className="text-indigo-600 dark:text-indigo-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</h4>
                        {task.household_category && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 capitalize">
                            {task.household_category}
                          </span>
                        )}
                      </div>
                      {task.service_provider && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Provider: {task.service_provider}</p>
                      )}
                      {task.scheduled_start && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(task.scheduled_start), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
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
