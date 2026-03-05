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

interface Errand {
  id: number;
  title: string;
  description: string | null;
  budget_amount: number | null;
  actual_amount: number | null;
  vendor_name: string | null;
  status: string;
  priority: string;
  scheduled_start: string | null;
  created_at: string;
}

interface ErrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ErrandsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_amount: '',
    vendor_name: '',
    scheduled_start: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (open) fetchErrands();
  }, [open]);

  const fetchErrands = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/personal-duties', {
        params: { duty_type: 'personal_errands' }
      });
      setErrands(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch errands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/personal-duties', {
        ...formData,
        duty_type: 'personal_errands',
        employer_name: 'Principal',
      });
      setFormData({ title: '', description: '', budget_amount: '', vendor_name: '', scheduled_start: '', priority: 'medium' });
      setShowForm(false);
      fetchErrands();
    } catch (error) {
      console.error('Failed to create errand:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/front-office/api/personal-duties/${id}`, { status });
      fetchErrands();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteErrand = async (id: number) => {
    if (!confirm('Delete this errand?')) return;
    try {
      await axios.delete(`/front-office/api/personal-duties/${id}`);
      fetchErrands();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-rose-600 rounded-lg text-white">
              <IconMapper name="ShoppingBag" size={24} />
            </div>
            Personal Errands
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Errands ({errands.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-rose-600 hover:bg-rose-700 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Add Errand'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-rose-200 dark:border-rose-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Errand Description *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Pick up dry cleaning, Buy groceries"
                    required
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Budget (MWK)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget_amount}
                      onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                      placeholder="0.00"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor/Store</Label>
                    <Input
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      placeholder="e.g., Shoprite"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>When</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_start}
                      onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Specific items to buy, special instructions..."
                    rows={2}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Save Errand</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : errands.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="ShoppingBag" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No errands yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errands.map((errand) => (
                <Card key={errand.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{errand.title}</h4>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Budget: {formatCurrency(errand.budget_amount)}</span>
                        {errand.actual_amount && <span>Spent: {formatCurrency(errand.actual_amount)}</span>}
                        {errand.vendor_name && <span>Vendor: {errand.vendor_name}</span>}
                      </div>
                      {errand.scheduled_start && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Due: {format(new Date(errand.scheduled_start), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {errand.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(errand.id, 'completed')}
                          className="text-green-600 border-green-200 dark:border-green-800">
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteErrand(errand.id)}
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
