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
  const { data, setData, post, processing, errors } = useForm<GuardFormData>({
    employee_id: guard.employee_id || '',
    name: guard.name || '',
    email: guard.email || '',
    phone: guard.phone || '',
    address: guard.address || '',
    id_number: guard.id_number || '',
    date_of_birth: guard.date_of_birth || '',
    gender: guard.gender || '',
    emergency_contact_name: guard.emergency_contact_name || '',
    emergency_contact_phone: guard.emergency_contact_phone || '',
    supervisor_id: guard.supervisor_id?.toString() || '',
    hire_date: guard.hire_date || '',
    notes: guard.notes || '',
    status: guard.status || 'active',
  });

  const handleSubmit = (formData: GuardFormData) => {
    post(route('admin.guards.update', { guard: guard.id }), {
      ...formData,
      _method: 'PUT',
    } as any);
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
