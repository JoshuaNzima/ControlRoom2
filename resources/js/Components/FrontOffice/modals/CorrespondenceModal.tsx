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

interface Correspondence {
  id: number;
  title: string;
  description: string | null;
  correspondence_type: string;
  response_draft: string | null;
  awaiting_approval: boolean;
  status: string;
  employer_name: string;
  created_at: string;
}

interface CorrespondenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CorrespondenceModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    correspondence_type: 'email',
    response_draft: '',
    employer_name: '',
  });

  useEffect(() => {
    if (open) fetchItems();
  }, [open]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/personal-duties', {
        params: { duty_type: 'correspondence' }
      });
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch correspondence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/personal-duties', {
        ...formData,
        duty_type: 'correspondence',
        employer_name: formData.employer_name || 'Principal',
        priority: 'medium',
      });
      setFormData({ title: '', description: '', correspondence_type: 'email', response_draft: '', employer_name: '' });
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Failed to create correspondence:', error);
    }
  };

  const toggleApproval = async (id: number, currentValue: boolean) => {
    try {
      await axios.put(`/front-office/api/personal-duties/${id}`, { awaiting_approval: !currentValue });
      fetchItems();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Delete this correspondence?')) return;
    try {
      await axios.delete(`/front-office/api/personal-duties/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      email: 'Mail',
      letter: 'FileText',
      call: 'Phone',
      message: 'MessageSquare',
    };
    return icons[type] || 'Mail';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-cyan-600 rounded-lg text-white">
              <IconMapper name="Mail" size={24} />
            </div>
            Correspondence Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Correspondence ({items.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'New Correspondence'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-cyan-200 dark:border-cyan-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject/Topic *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Response to invitation"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={formData.correspondence_type} 
                      onValueChange={(value) => setFormData({ ...formData, correspondence_type: value })}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="message">Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                <div className="space-y-2">
                  <Label>Incoming Message/Context</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Original message or context..."
                    rows={2}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Response Draft</Label>
                  <Textarea
                    value={formData.response_draft}
                    onChange={(e) => setFormData({ ...formData, response_draft: e.target.value })}
                    placeholder="Draft your response here..."
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">Save Draft</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="Mail" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No correspondence items.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <IconMapper name={getTypeIcon(item.correspondence_type)} size={16} className="text-cyan-600 dark:text-cyan-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
                        {item.awaiting_approval && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30">
                            Awaiting Approval
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">For: {item.employer_name}</p>
                      {item.response_draft && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Draft:</span>
                          <p>{item.response_draft}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => toggleApproval(item.id, item.awaiting_approval)}
                        className={item.awaiting_approval 
                          ? "text-amber-600 border-amber-200 dark:border-amber-800" 
                          : "text-blue-600 border-blue-200 dark:border-blue-800"}
                      >
                        <IconMapper name={item.awaiting_approval ? "Clock" : "Send"} size={16} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteItem(item.id)}
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
