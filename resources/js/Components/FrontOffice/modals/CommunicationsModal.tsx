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

interface Communication {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  recipient_name: string | null;
  recipient_type: string | null;
  created_at: string;
}

interface CommunicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommunicationsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    recipient_name: '',
    recipient_type: 'executive',
  });

  useEffect(() => {
    if (open) fetchItems();
  }, [open]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/office-duties', {
        params: { duty_type: 'communication' }
      });
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/office-duties', {
        ...formData,
        duty_type: 'communication',
      });
      setFormData({ title: '', description: '', priority: 'medium', recipient_name: '', recipient_type: 'executive' });
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/front-office/api/office-duties/${id}`, { status });
      fetchItems();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Delete this communication log?')) return;
    try {
      await axios.delete(`/front-office/api/office-duties/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getPriorityColor = (p: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-800',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30',
      urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30',
    };
    return colors[p] || colors.medium;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-amber-600 rounded-lg text-white">
              <IconMapper name="Mail" size={24} />
            </div>
            Communications Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Communications ({items.length})
            </h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Log Communication'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-amber-200 dark:border-amber-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject/Caller *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Call from ABC Corp"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From/Caller Name</Label>
                    <Input
                      value={formData.recipient_name}
                      onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                      placeholder="e.g., John Smith"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Message/Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details of the communication, action required..."
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">Save</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="MessageSquare" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No communications logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                        {item.recipient_name && ` • From: ${item.recipient_name}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'completed')}
                          className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800">
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteItem(item.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800">
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
