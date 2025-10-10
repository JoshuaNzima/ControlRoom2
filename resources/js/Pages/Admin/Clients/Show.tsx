import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';

interface Site {
  id: number;
  name: string;
  address?: string;
}

interface ClientProps {
  client: {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    sites?: Site[];
  };
}

export default function Show({ client }: ClientProps) {
  return (
    <AdminLayout title="Client Details">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{client.name}</h1>

        <div className="mb-6">
          <h2 className="font-semibold">Contact</h2>
          <p>{client.contact_person}</p>
          <p>{client.phone}</p>
          <p>{client.email}</p>
          <p>{client.address}</p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Sites</h2>
          <div className="mb-3">
            <Button asChild size="sm">
              <a href={route('admin.clients.sites.create', { client: client.id })}>Add Site</a>
            </Button>
          </div>
          <ul className="space-y-2">
            {client.sites && client.sites.length ? (
              client.sites.map((site: Site) => (
                <li key={site.id} className="p-3 border rounded">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{site.name}</div>
                      <div className="text-sm text-gray-600">{site.address}</div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <div>No sites available.</div>
            )}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
