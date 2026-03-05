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

interface Event {
  id: number;
  title: string;
  description: string | null;
  meeting_location: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface EventsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_location: '',
    scheduled_start: '',
    scheduled_end: '',
    priority: 'high',
  });

  useEffect(() => {
    if (open) fetchEvents();
  }, [open]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/front-office/api/office-duties', {
        params: { duty_type: 'event_planning' }
      });
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/front-office/api/office-duties', {
        ...formData,
        duty_type: 'event_planning',
      });
      setFormData({ title: '', description: '', meeting_location: '', scheduled_start: '', scheduled_end: '', priority: 'high' });
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/front-office/api/office-duties/${id}`, { status });
      fetchEvents();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteEvent = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    try {
      await axios.delete(`/front-office/api/office-duties/${id}`);
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-pink-600 rounded-lg text-white">
              <IconMapper name="PartyPopper" size={24} />
            </div>
            Event Planning
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Events ({events.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-pink-600 hover:bg-pink-700 text-white">
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Plan Event'}
            </Button>
          </div>

          {showForm && (
            <Card className="p-4 border-pink-200 dark:border-pink-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Annual Board Dinner"
                    required
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input
                      value={formData.meeting_location}
                      onChange={(e) => setFormData({ ...formData, meeting_location: e.target.value })}
                      placeholder="Location"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_start}
                      onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                      required
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_end}
                      onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Event Details</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Guest list, catering, decorations, schedule..."
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white">Save Event</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="PartyPopper" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No events planned yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</h4>
                      {event.meeting_location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <IconMapper name="MapPin" size={14} />
                          {event.meeting_location}
                        </p>
                      )}
                      {event.scheduled_start && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(event.scheduled_start), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-pink-50 dark:bg-pink-900/20 p-2 rounded">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {event.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(event.id, 'completed')}
                          className="text-green-600 border-green-200 dark:border-green-800">
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteEvent(event.id)}
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
