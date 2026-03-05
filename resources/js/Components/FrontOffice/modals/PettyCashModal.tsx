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

interface PettyCashEntry {
  id: number;
  title: string;
  description: string | null;
  petty_cash_amount: number;
  expense_receipt_number: string | null;
  status: string;
  created_at: string;
  expense?: { status: string } | null;
}

interface PettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PettyCashModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [entries, setEntries] = useState<PettyCashEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    petty_cash_amount: '',
    expense_receipt_number: '',
  });

  useEffect(() => {
    if (open) fetchEntries();
  }, [open]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/office-duties', {
        params: { duty_type: 'petty_cash' }
      });
      const data = response.data.data || [];
      setEntries(data);
      const total = data.reduce((sum: number, entry: PettyCashEntry) => sum + (entry.petty_cash_amount || 0), 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Failed to fetch petty cash:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/office-duties', {
        ...formData,
        duty_type: 'petty_cash',
        priority: 'medium',
      });
      setFormData({ title: '', description: '', petty_cash_amount: '', expense_receipt_number: '' });
      setShowForm(false);
      fetchEntries();
    } catch (error) {
      console.error('Failed to create entry:', error);
    }
  };

  const deleteEntry = async (id: number) => {
    if (!confirm('Delete this petty cash entry?')) return;
    try {
      await axios.delete(`/front-office/api/office-duties/${id}`);
      fetchEntries();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-rose-600 rounded-lg text-white">
              <IconMapper name="Banknote" size={24} />
            </div>
            Petty Cash Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Stats Card */}
          <Card className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pending Amount</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Entries</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{entries.length}</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Petty Cash Entries</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-rose-600 hover:bg-rose-700 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Add Entry'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-rose-200 dark:border-rose-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Expense Description *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Office Supplies, Transport"
                    required
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (MWK) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.petty_cash_amount}
                      onChange={(e) => setFormData({ ...formData, petty_cash_amount: e.target.value })}
                      placeholder="0.00"
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Receipt Number</Label>
                    <Input
                      value={formData.expense_receipt_number}
                      onChange={(e) => setFormData({ ...formData, expense_receipt_number: e.target.value })}
                      placeholder="e.g., RCP-001"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about the expense..."
                    rows={2}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Save Entry</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="Banknote" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No petty cash entries yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card key={entry.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{entry.title}</h4>
                        {entry.expense ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30">
                            Linked to Finance
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(entry.petty_cash_amount)}
                      </p>
                      {entry.expense_receipt_number && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receipt: {entry.expense_receipt_number}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(entry.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => deleteEntry(entry.id)}
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
