import React from 'react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import useToast from '@/Components/ui/use-toast';

interface Props {
  flagId: number | null;
  open: boolean;
  onClose: () => void;
  refreshList?: () => void;
}

export default function AdminFlagModal({ flagId, open, onClose, refreshList }: Props) {
  const [flag, setFlag] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const resolveForm = useForm({});

  React.useEffect(() => {
    if (open && flagId) {
      setLoading(true);
      axios.get(route('admin.flags.json', { flag: flagId }))
        .then(res => setFlag(res.data))
        .catch(err => console.error('Failed to load flag', err))
        .finally(() => setLoading(false));
    } else {
      setFlag(null);
    }
  }, [open, flagId]);

  const handleResolve = () => {
    if (!flag) return;
    resolveForm.post(route('admin.flags.resolve', { flag: flag.id }), {
      onSuccess: () => {
        toast({ title: 'Resolved', description: 'Flag resolved successfully.' });
        refreshList && refreshList();
        onClose();
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to resolve flag.' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flag Details</DialogTitle>
          {loading && <p className="text-sm text-gray-500">Loading...</p>}
        </DialogHeader>

        {flag && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-lg font-semibold">{flag.subject}</h2>
              <div className="text-sm text-gray-600">Type: {flag.flaggable_type}</div>
              <div className="text-sm text-gray-500">Reported {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}</div>
              <div className="mt-2 text-sm text-gray-700">{flag.notes}</div>
              <div className="mt-2">
                Status: <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs">{flag.status}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={handleResolve}>Resolve</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
