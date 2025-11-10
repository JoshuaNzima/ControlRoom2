import React from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ClientForm from '@/Components/Clients/ClientForm';

interface Service {
  id: number;
  name: string;
  monthly_price: number;
}

export default function Edit({ client, services = [] }: { client: any; services: Service[] }) {
  const handleSubmit = (data: any) => {
    router.put(route('admin.clients.update', client.id), data);
  };

  return (
    <AdminLayout title="Edit Client">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Edit Client</h1>
        <div className="bg-white rounded-xl shadow p-6">
          <ClientForm
            initialData={client}
            services={services}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </AdminLayout>
  );
}
