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

interface TravelItem {
  id: number;
  title: string;
  description: string | null;
  travel_destination: string | null;
  travel_booking_ref: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface TravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'executive' | 'personal';
}

export default function TravelModal({ open, onOpenChange, category }: { open: boolean; onOpenChange: (open: boolean) => void; category: 'executive' | 'personal' }) {
  const [items, setItems] = useState<TravelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    travel_destination: '',
    travel_booking_ref: '',
    scheduled_start: '',
    scheduled_end: '',
    priority: 'medium',
  });

  const isExecutive = category === 'executive';
  const dutyType = isExecutive ? 'travel_arrangements' : 'travel_transport';
  const apiEndpoint = isExecutive ? '/front-office/api/office-duties' : '/front-office/api/personal-duties';
  const modalTitle = isExecutive ? 'Travel Arrangements' : 'Personal Travel';
  const iconColor = isExecutive ? 'bg-cyan-600' : 'bg-pink-600';

  useEffect(() => {
    if (open) fetchItems();
  }, [open]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiEndpoint, { params: { duty_type: dutyType } });
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch travel:', error);
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
      setFormData({ title: '', description: '', travel_destination: '', travel_booking_ref: '', scheduled_start: '', scheduled_end: '', priority: 'medium' });
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`${apiEndpoint}/${id}`, { status });
      fetchItems();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Delete this travel item?')) return;
    try {
      await axios.delete(`${apiEndpoint}/${id}`);
      fetchItems();
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
              <IconMapper name="Plane" size={24} />
            </div>
            {modalTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Travel ({items.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className={`${iconColor} hover:opacity-90 text-white`}>
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Add Travel'}
            </Button>
          </div>

          {showForm && (
            <Card className={`p-4 ${isExecutive ? 'border-cyan-200 dark:border-cyan-800' : 'border-pink-200 dark:border-pink-800'}`}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Trip Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Business Trip to Johannesburg"
                    required
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Input
                      value={formData.travel_destination}
                      onChange={(e) => setFormData({ ...formData, travel_destination: e.target.value })}
                      placeholder="City, Country"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Booking Reference</Label>
                    <Input
                      value={formData.travel_booking_ref}
                      onChange={(e) => setFormData({ ...formData, travel_booking_ref: e.target.value })}
                      placeholder="Flight/Hotel ref"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departure *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_start}
                      onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Return</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_end}
                      onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Flight details, hotel info, visa requirements..."
                    rows={2}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className={`${iconColor} hover:opacity-90 text-white`}>Save Travel</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="Plane" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No travel items yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
                      {item.travel_destination && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <IconMapper name="MapPin" size={14} />
                          {item.travel_destination}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {item.scheduled_start && (
                          <span>Dep: {format(new Date(item.scheduled_start), 'MMM d, yyyy')}</span>
                        )}
                        {item.scheduled_end && (
                          <span>Ret: {format(new Date(item.scheduled_end), 'MMM d, yyyy')}</span>
                        )}
                        {item.travel_booking_ref && (
                          <span>Ref: {item.travel_booking_ref}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'completed')}
                          className="text-green-600 border-green-200 dark:border-green-800">
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
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
