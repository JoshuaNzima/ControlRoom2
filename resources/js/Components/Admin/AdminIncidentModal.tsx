import React from 'react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import IncidentComments from '@/Components/Operations/ControlRoom/IncidentComments';
import AdminEscalateIncidentDialog from '@/Components/Admin/AdminEscalateIncidentDialog';
import { formatDistanceToNow } from 'date-fns';
import useToast from '@/Components/ui/use-toast';

interface Props {
  incidentId: number | null;
  open: boolean;
  onClose: () => void;
  refreshList?: () => void;
}

export default function AdminIncidentModal({ incidentId, open, onClose, refreshList }: Props) {
  const [incident, setIncident] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [escalateOpen, setEscalateOpen] = React.useState(false);
  const [users, setUsers] = React.useState<any[]>([]);
  const { toast } = useToast();
  const resolveForm = useForm({});
  const assignForm = useForm({ assigned_to: '' });

  React.useEffect(() => {
    if (open && incidentId) {
      setLoading(true);
      axios.get(route('admin.incidents.json', { incident: incidentId }))
        .then(res => setIncident(res.data))
        .catch(err => console.error('Failed to load incident', err))
        .finally(() => setLoading(false));
    } else {
      setIncident(null);
    }
  }, [open, incidentId]);

  React.useEffect(() => {
    if (open) {
      // load assignable users for escalation/assignment
      axios.get(route('admin.users.json'))
        .then(res => setUsers(res.data || []))
        .catch(err => console.error('Failed to load users', err));
    }
  }, [open]);

  const handleResolve = () => {
    if (!incident) return;
    resolveForm.post(route('admin.incidents.resolve', { incident: incident.id }), {
      onSuccess: () => {
        toast({ title: 'Resolved', description: 'Incident resolved successfully.' });
        refreshList && refreshList();
        onClose();
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to resolve incident.' });
      }
    });
  };

  const handleAssign = (userId: number) => {
    if (!incident) return;
    assignForm.setData('assigned_to', String(userId));
    assignForm.post(route('admin.incidents.assign', { incident: incident.id }), {
      onSuccess: () => {
        toast({ title: 'Assigned', description: 'Incident assigned successfully.' });
        refreshList && refreshList();
        onClose();
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to assign incident.' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Incident Details</DialogTitle>
          {loading && <p className="text-sm text-gray-500">Loading...</p>}
        </DialogHeader>

        {incident && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-lg font-semibold">{incident.title}</h2>
              <div className="text-sm text-gray-600">{incident.type} • Severity {incident.severity}</div>
              <div className="text-sm text-gray-500">Reported {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</div>
              <div className="mt-2 text-sm text-gray-700">{incident.description}</div>
              <div className="mt-2 text-sm">
                Client: {incident.client?.name || '—'} / Site: {incident.client_site?.name || '—'}
              </div>
              <div className="mt-2">
                Status: <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs">{incident.status}</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium">Comments</h3>
              <IncidentComments incidentId={incident.id} comments={incident.comments || []} />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEscalateOpen(true)}>Escalate</Button>
              <Button onClick={handleResolve}>Resolve</Button>
            </div>

            <AdminEscalateIncidentDialog
              incidentId={incident.id}
              open={escalateOpen}
              onClose={() => { setEscalateOpen(false); refreshList && refreshList(); onClose(); }}
              users={users}
              onSuccess={() => { refreshList && refreshList(); }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
