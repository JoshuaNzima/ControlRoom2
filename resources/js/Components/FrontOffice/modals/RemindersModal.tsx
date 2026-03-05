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

interface Reminder {
  id: number;
  title: string;
  description: string | null;
  reminder_time: string | null;
  reminder_frequency: string | null;
  status: string;
  employer_name: string;
  created_at: string;
}

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RemindersModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_time: '',
    reminder_frequency: 'once',
    employer_name: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (open) fetchReminders();
  }, [open]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/personal-duties', {
        params: { duty_type: 'reminders_followups' }
      });
      setReminders(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/personal-duties', {
        ...formData,
        duty_type: 'reminders_followups',
      });
      setFormData({ title: '', description: '', reminder_time: '', reminder_frequency: 'once', employer_name: '', priority: 'medium' });
      setShowForm(false);
      fetchReminders();
    } catch (error) {
      console.error('Failed to create reminder:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/front-office/api/personal-duties/${id}`, { status });
      fetchReminders();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteReminder = async (id: number) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      await axios.delete(`/front-office/api/personal-duties/${id}`);
      fetchReminders();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-amber-600 rounded-lg text-white">
              <IconMapper name="Bell" size={24} />
            </div>
            Reminders & Follow-ups
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reminders ({reminders.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Set Reminder'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-amber-200 dark:border-amber-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reminder Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Call dentist, Submit report"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>For (Person)</Label>
                    <Input
                      value={formData.employer_name}
                      onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                      placeholder="e.g., Mr. Johnson"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reminder Time *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.reminder_time}
                      onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select 
                      value={formData.reminder_frequency} 
                      onValueChange={(value) => setFormData({ ...formData, reminder_frequency: value })}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Context or additional details..."
                    rows={2}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">Set Reminder</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No reminders set yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className={`p-4 dark:bg-gray-800 dark:border-gray-700 ${reminder.status === 'completed' ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{reminder.title}</h4>
                      {reminder.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{reminder.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {reminder.reminder_time && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <IconMapper name="Clock" size={14} />
                            {format(new Date(reminder.reminder_time), 'MMM d, yyyy h:mm a')}
                          </span>
                        )}
                        {reminder.reminder_frequency && reminder.reminder_frequency !== 'once' && (
                          <span className="capitalize">({reminder.reminder_frequency})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {reminder.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(reminder.id, 'completed')}
                          className="text-green-600 border-green-200 dark:border-green-800">
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteReminder(reminder.id)}
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
