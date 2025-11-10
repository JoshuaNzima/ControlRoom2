import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

interface Client {
  id: number;
  name: string;
  sites: Array<{
    id: number;
    name: string;
    address: string;
  }>;
}

interface User {
  id: number;
  name: string;
}

interface IncidentFormProps {
  clients: Client[];
  users: User[];
  initialData?: any;
}

export default function IncidentForm({ clients, users, initialData }: IncidentFormProps) {
  const [selectedClient, setSelectedClient] = useState<number | null>(initialData?.client_id || null);
  
  const form: any = useForm({
    title: initialData?.title || '',
    type: initialData?.type || 'security_breach',
    severity: initialData?.severity || 'medium',
    description: initialData?.description || '',
    location: initialData?.location || '',
    client_id: initialData?.client_id || '',
    client_site_id: initialData?.client_site_id || '',
    assigned_to: initialData?.assigned_to || '',
  });
  const { data, setData, post, processing, errors } = form;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      post(route('control-room.incidents.update', initialData.id));
    } else {
      post(route('control-room.incidents.store'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={data.title}
            onChange={e => setData('title', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            required
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={data.type}
            onChange={e => setData('type', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          >
            <option value="security_breach">Security Breach</option>
            <option value="equipment_failure">Equipment Failure</option>
            <option value="personnel_issue">Personnel Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Severity</label>
          <select
            value={data.severity}
            onChange={e => setData('severity', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <select
            value={data.client_id}
            onChange={e => {
              const clientId = e.target.value;
              setData((d: any) => ({
                ...d,
                client_id: clientId,
                client_site_id: '', // Reset site when client changes
              }));
              setSelectedClient(clientId ? parseInt(clientId) : null);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          >
            <option value="">Select Client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Site</label>
          <select
            value={data.client_site_id}
            onChange={e => setData('client_site_id', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            disabled={!selectedClient}
          >
            <option value="">Select Site</option>
            {selectedClient && clients
              .find(c => c.id === selectedClient)
              ?.sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={data.location}
            onChange={e => setData('location', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Assign To</label>
          <select
            value={data.assigned_to}
            onChange={e => setData('assigned_to', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          >
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={data.description}
            onChange={e => setData('description', e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={processing}>
          {initialData ? 'Update Incident' : 'Create Incident'}
        </Button>
      </div>
    </form>
  );
}