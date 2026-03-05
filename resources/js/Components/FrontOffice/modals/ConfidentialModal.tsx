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

interface ConfidentialItem {
  id: number;
  title: string;
  description: string | null;
  confidentiality_level: string;
  document_reference: string | null;
  status: string;
  created_at: string;
}

interface ConfidentialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfidentialModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<ConfidentialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    confidentiality_level: 'confidential',
    document_reference: '',
  });

  useEffect(() => {
    if (open) fetchItems();
  }, [open]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/office-duties', {
        params: { duty_type: 'confidential' }
      });
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch confidential items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/office-duties', {
        ...formData,
        duty_type: 'confidential',
        priority: 'high',
      });
      setFormData({ title: '', description: '', confidentiality_level: 'confidential', document_reference: '' });
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Delete this confidential item?')) return;
    try {
      await axios.delete(`/front-office/api/office-duties/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getConfidentialityBadge = (level: string) => {
    const badges: Record<string, string> = {
      normal: 'bg-gray-100 text-gray-700 dark:bg-gray-800',
      confidential: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
      strictly_confidential: 'bg-red-100 text-red-700 dark:bg-red-900/30',
    };
    return badges[level] || badges.confidential;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-slate-700 rounded-lg text-white">
              <IconMapper name="Lock" size={24} />
            </div>
            Confidential Information Vault
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <IconMapper name="ShieldAlert" size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-semibold">Security Notice</p>
                <p>This section contains sensitive information. Access is logged and monitored.</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confidential Items ({items.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-slate-700 hover:bg-slate-800 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Add Item'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-slate-200 dark:border-slate-700">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Item Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Merger Discussion Notes"
                    required
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Security Level</Label>
                    <Select 
                      value={formData.confidentiality_level} 
                      onValueChange={(value) => setFormData({ ...formData, confidentiality_level: value })}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confidential">Confidential</SelectItem>
                        <SelectItem value="strictly_confidential">Strictly Confidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference/Code</Label>
                    <Input
                      value={formData.document_reference}
                      onChange={(e) => setFormData({ ...formData, document_reference: e.target.value })}
                      placeholder="e.g., SEC-001"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Content/Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Sensitive information details..."
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white">Save Securely</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="Lock" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No confidential items stored.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4 dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-red-500">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <IconMapper name="Lock" size={16} className="text-red-500" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getConfidentialityBadge(item.confidentiality_level)}`}>
                          {item.confidentiality_level.replace('_', ' ')}
                        </span>
                      </div>
                      {item.document_reference && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ref: {item.document_reference}</p>
                      )}
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">{item.description}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Added: {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
