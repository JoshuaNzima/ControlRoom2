import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import AdminEscalateFlagDialog from '@/Components/Admin/AdminEscalateFlagDialog';
import { useToast } from '@/Components/ui/use-toast';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  flag: any;
  auth: {
    user: {
      id: number;
      name: string;
      can: Record<string, boolean>;
    };
  };
}

export default function Show({ flag, auth }: Props) {
  const [escalateOpen, setEscalateOpen] = React.useState(false);
  const [users, setUsers] = React.useState<any[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    // Load assignable users for escalation
    axios.get(route('admin.users.json'))
      .then(res => setUsers(res.data || []))
      .catch(err => console.error('Failed to load users', err));
  }, []);

  const handleResolve = () => {
    if (!confirm('Mark this flag as resolved?')) return;
    router.post(route('admin.flags.resolve', { flag: flag.id }), {}, {
      onSuccess: () => {
        toast({ title: 'Resolved', description: 'Flag resolved successfully.' });
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to resolve flag.' });
      }
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title={`Flag #${flag.id}`}>
      <Head title={`Flag #${flag.id}`} />
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Flag #{flag.id}</h1>
            <div className="text-sm text-gray-500 mt-1">
              Reported {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold">Details</h2>
            <div className="mt-2">
              <p className="text-gray-700">{flag.description || 'No description provided.'}</p>
              <div className="mt-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusBadgeColor(flag.status)}`}>
                  {flag.status.replace('_', ' ')}
                </span>
                {flag.escalation_level > 0 && (
                  <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs">
                    Escalation Level {flag.escalation_level}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reporter Details */}
          <div className="mb-4">
            <h3 className="text-md font-medium">Reporter</h3>
            <div className="mt-1">
              <p className="text-gray-700">{flag.reporter?.name || '—'}</p>
            </div>
          </div>

          {/* Subject Details */}
          <div className="mb-4">
            <h3 className="text-md font-medium">Subject</h3>
            <div className="mt-1">
              <p className="text-gray-700">
                {flag.flaggable?.name || `${flag.flaggable_type} #${flag.flaggable?.id}`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
            {auth.user.can.escalate_flags && flag.status !== 'resolved' && (
              <Button
                onClick={() => setEscalateOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Escalate
              </Button>
            )}
            {auth.user.can.resolve_flags && flag.status !== 'resolved' && (
              <Button
                onClick={handleResolve}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Resolve
              </Button>
            )}
          </div>
        </Card>

        {/* Escalation Dialog */}
        <AdminEscalateFlagDialog
          flagId={flag.id}
          open={escalateOpen}
          onClose={() => setEscalateOpen(false)}
          users={users}
          onSuccess={() => {
            setEscalateOpen(false);
            router.reload();
          }}
        />
      </div>
    </AdminLayout>
  );
}
