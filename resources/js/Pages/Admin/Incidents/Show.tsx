import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import IncidentComments from '@/Components/Operations/ControlRoom/IncidentComments';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  incident: any;
}

export default function Show({ incident }: Props) {
  const handleResolve = () => {
    if (!confirm('Mark this incident as resolved?')) return;
    router.post(route('admin.incidents.resolve', { incident: incident.id }));
  };

  const handleAssign = (userId: number) => {
    router.post(route('admin.incidents.assign', { incident: incident.id }), { assigned_to: userId });
  };

  return (
    <AdminLayout title={`Incident: ${incident.title}`}>
      <Head title={`Incident: ${incident.title}`} />
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{incident.title}</h1>
          <div className="text-sm text-gray-600">{incident.type} — Severity {incident.severity}</div>
          <div className="text-sm text-gray-500">Reported {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</div>
        </div>

        <div className="mb-4 p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-700">{incident.description}</p>
          <div className="mt-3 text-sm text-gray-600">Client: {incident.client?.name || '—'} / Site: {incident.client_site?.name || '—'}</div>
          <div className="mt-3">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${incident.status === 'open' ? 'bg-red-100 text-red-800' : incident.status === 'escalated' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              {incident.status}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-medium">Comments</h2>
          <div className="mt-2 bg-white rounded p-4">
            <IncidentComments incidentId={incident.id} comments={incident.comments || []} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
          <Button onClick={handleResolve}>Resolve</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
