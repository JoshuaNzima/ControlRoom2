import React from 'react';
import { useForm } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import useToast from '@/Components/ui/use-toast';

interface User {
  id: number;
  name: string;
}

interface Props {
  flagId: number;
  open: boolean;
  onClose: () => void;
  users: User[];
  onSuccess?: () => void;
}

export default function AdminEscalateFlagDialog({ flagId, open, onClose, users, onSuccess }: Props) {
  const { data, setData, post, processing } = useForm({ assigned_to: '', reason: '' });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.flags.escalate', { flag: flagId }), {
      onSuccess: () => {
        toast({ title: 'Escalated', description: 'Flag escalated successfully.' });
        onSuccess && onSuccess();
        onClose();
      },
      onError: (errors: any) => {
        toast({ title: 'Error', description: 'Failed to escalate flag.' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escalate Flag</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Provide a reason for escalation and assign to a supervisor or manager.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign To</label>
            <select
              value={data.assigned_to}
              onChange={e => setData('assigned_to', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={data.reason}
              onChange={e => setData('reason', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default" className="bg-red-600 hover:bg-red-700" disabled={processing}>
              Escalate Flag
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}