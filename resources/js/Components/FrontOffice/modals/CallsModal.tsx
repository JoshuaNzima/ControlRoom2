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

interface Call {
  id: number;
  title: string;
  description: string | null;
  recipient_name: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface CallsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CallsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    recipient_name: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (open) fetchCalls();
  }, [open]);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/personal-duties', {
        params: { duty_type: 'calls_messages' }
      });
      setCalls(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/personal-duties', {
        ...formData,
        duty_type: 'calls_messages',
        employer_name: 'Principal',
      });
      setFormData({ title: '', description: '', recipient_name: '', priority: 'medium' });
      setShowForm(false);
      fetchCalls();
    } catch (error) {
      console.error('Failed to create call log:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/front-office/api/personal-duties/${id}`, { status });
      fetchCalls();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteCall = async (id: number) => {
    if (!confirm('Delete this call log?')) return;
    try {
      await axios.delete(`/front-office/api/personal-duties/${id}`);
      fetchCalls();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-fuchsia-600 rounded-lg text-white">
              <IconMapper name="Phone" size={24} />
            </div>
            Calls & Messages
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Call Log ({calls.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Log Call'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-fuchsia-200 dark:border-fuchsia-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Caller/Contact *</Label>
                    <Input
                      value={formData.recipient_name}
                      onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                      placeholder="e.g., John Smith"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Regarding contract"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Message/Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What was discussed, action items..."
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">Log Call</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="Phone" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No calls logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => (
                <Card key={call.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{call.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(call.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">From: {call.recipient_name}</p>
                      {call.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{call.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {call.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(call.id, 'completed')}
                          className="text-green-600 border-green-200 dark:border-green-800">
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteCall(call.id)}
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
