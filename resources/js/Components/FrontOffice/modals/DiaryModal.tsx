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

interface PersonalDuty {
  id: number;
  title: string;
  description: string | null;
  duty_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_start: string | null;
  employer_name: string;
  budget_amount: number | null;
  actual_amount: number | null;
  vendor_name: string | null;
  created_at: string;
}

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiaryModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [duties, setDuties] = useState<PersonalDuty[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    scheduled_start: '',
    scheduled_end: '',
    employer_name: '',
    privacy_level: 'private',
  });

  useEffect(() => {
    if (open) {
      fetchDuties();
    }
  }, [open]);

  const fetchDuties = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/personal-duties', {
        params: { duty_type: 'diary_management' }
      });
      setDuties(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch diary entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/personal-duties', {
        ...formData,
        duty_type: 'diary_management',
      });
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        scheduled_start: '',
        scheduled_end: '',
        employer_name: '',
        privacy_level: 'private',
      });
      setShowForm(false);
      fetchDuties();
    } catch (error) {
      console.error('Failed to create diary entry:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/front-office/api/personal-duties/${id}`, { status });
      fetchDuties();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const deleteDuty = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await axios.delete(`/front-office/api/personal-duties/${id}`);
      fetchDuties();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      medium: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[priority] || colors.medium;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-violet-600 rounded-lg text-white">
              <IconMapper name="CalendarDays" size={24} />
            </div>
            Diary Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Diary Entries ({duties.length})
            </h3>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Add Entry'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-violet-200 dark:border-violet-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Appointment/Entry Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Lunch with Dr. Smith"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employer">For (Employer/Principal) *</Label>
                    <Input
                      id="employer"
                      value={formData.employer_name}
                      onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                      placeholder="e.g., Mr. Johnson"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Date/Time *</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={formData.scheduled_start}
                      onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End Time</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={formData.scheduled_end}
                      onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="privacy">Privacy Level</Label>
                    <Select 
                      value={formData.privacy_level} 
                      onValueChange={(value) => setFormData({ ...formData, privacy_level: value })}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="confidential">Confidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Notes/Details</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Location, context, preparation needed..."
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
                    Save Entry
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : duties.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="BookOpen" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No diary entries yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {duties.map((duty) => (
                <Card key={duty.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{duty.title}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(duty.priority)}`}>
                          {duty.priority}
                        </span>
                      </div>
                      {duty.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{duty.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {duty.scheduled_start && (
                          <span className="flex items-center gap-1">
                            <IconMapper name="Clock" size={14} />
                            {format(new Date(duty.scheduled_start), 'MMM d, yyyy h:mm a')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <IconMapper name="User" size={14} />
                          For: {duty.employer_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {duty.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(duty.id, 'completed')}
                          className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                        >
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDuty(duty.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
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
