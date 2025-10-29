import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import GuardForm from '@/Components/Guards/GuardForm';
import { GuardFormData } from '@/types/guards';

interface Supervisor {
  id: number;
  name: string;
}

interface EditGuardProps {
  guard: any;
  supervisors: Supervisor[];
  can: {
    assign_supervisor: boolean;
  };
}

export default function EditGuard({ guard, supervisors, can }: EditGuardProps) {
  const { post, processing, errors } = useForm();

  const handleSubmit = (data: GuardFormData) => {
    // Build FormData and send via POST with _method=PUT so Laravel treats it as an update
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v));
    });
    formData.append('_method', 'PUT');
    post(route('guards.update', { guard: guard.id }), formData as any);
  };

  return (
    <AdminLayout title="Edit Guard">
      <Head title="Edit Guard" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Guard</h1>

          <GuardForm
            initialData={guard}
            supervisors={supervisors}
            onSubmit={handleSubmit}
            canAssignSupervisor={can.assign_supervisor}
            processing={processing}
            errors={errors}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
