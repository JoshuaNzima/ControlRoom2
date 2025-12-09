import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';

interface ReviewFlagModalProps {
  flag: any | null;
  canReview?: boolean;
  onUpdated?: () => void;
}

const statusColors: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

const ReviewFlagModal: React.FC<ReviewFlagModalProps> = ({ flag, canReview = false, onUpdated }) => {
  if (!flag) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _form: any = useForm({
    status: flag.status,
    review_notes: flag.review_notes || '',
  });
  const { data, setData, patch, processing } = _form;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('control-room.flags.update', flag.id), {
      onSuccess: () => onUpdated && onUpdated(),
    });
  };

  const acknowledgeFlag = () => router.post(route('control-room.flags.acknowledge', flag.id), {}, { onSuccess: onUpdated });
  const resolveFlag = () => router.post(route('control-room.flags.resolve', flag.id), {}, { onSuccess: onUpdated });
  const escalateFlag = () => router.post(route('control-room.flags.escalate', flag.id), {}, { onSuccess: onUpdated });

  return (
    <DialogContent className="sm:max-w-[760px]">
      <DialogHeader>
        <DialogTitle>Flag #{flag.id}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Flag Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge className={statusColors[flag.status] || 'bg-gray-100 text-gray-800'}>
                    {String(flag.status || '').replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Flagged Item</Label>
                <div className="mt-1 text-gray-900 dark:text-gray-100">
                  {flag.flaggable?.name || `Guard #${flag.flaggable?.id}`}
                </div>
              </div>

              <div>
                <Label>Type</Label>
                <div className="mt-1 text-gray-900 dark:text-gray-100">
                  {String(flag.flaggable_type || '').includes('Guard') ? 'Guard' : 'User'}
                </div>
              </div>

              <div>
                <Label>Reason</Label>
                <div className="mt-1 text-gray-900 dark:text-gray-100">{flag.reason}</div>
              </div>

              <div>
                <Label>Details</Label>
                <div className="mt-1 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{flag.details}</div>
              </div>

              <div>
                <Label>Reported By</Label>
                <div className="mt-1 text-gray-900 dark:text-gray-100">
                  {flag.reporter?.name || '-'} {flag.created_at ? `on ${new Date(flag.created_at).toLocaleDateString()}` : ''}
                </div>
              </div>

              {flag.reviewer && (
                <div>
                  <Label>Reviewed By</Label>
                  <div className="mt-1 text-gray-900 dark:text-gray-100">
                    {flag.reviewer.name} {flag.review_date ? `on ${new Date(flag.review_date).toLocaleDateString()}` : ''}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {canReview && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Review Flag</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Update Status</Label>
                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review_notes">Review Notes</Label>
                    <Textarea
                      id="review_notes"
                      value={data.review_notes}
                      onChange={(e) => setData('review_notes', e.target.value)}
                      rows={4}
                      placeholder="Add your review notes..."
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={processing}>
                    Update Flag
                  </Button>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button type="button" variant="outline" onClick={acknowledgeFlag}>
                      Acknowledge
                    </Button>
                    <Button type="button" variant="outline" onClick={escalateFlag}>
                      Escalate
                    </Button>
                    <Button type="button" onClick={resolveFlag}>
                      Resolve
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default ReviewFlagModal;
