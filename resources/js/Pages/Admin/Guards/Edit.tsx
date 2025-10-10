import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { GuardFormData } from '@/types/guards';

interface Supervisor {
  id: number;
  name: string;
}

interface EditGuardProps {
  guard: any;
  supervisors: Supervisor[];
}

export default function EditGuard({ guard, supervisors }: EditGuardProps) {
  const { data, setData, put, processing, errors } = useForm<GuardFormData>({
    employee_id: guard.employee_id || '',
    name: guard.name || '',
    phone: guard.phone || '',
    email: guard.email || '',
    address: guard.address || '',
    id_number: guard.id_number || '',
    date_of_birth: guard.date_of_birth || '',
    gender: guard.gender || '',
    emergency_contact_name: guard.emergency_contact_name || '',
    emergency_contact_phone: guard.emergency_contact_phone || '',
    supervisor_id: guard.supervisor_id || '',
    hire_date: guard.hire_date || '',
    notes: guard.notes || '',
    status: guard.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('guards.update', { guard: guard.id }));
  };

  return (
    <AdminLayout title="Edit Guard">
      <Head title="Edit Guard" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Guard</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                <input
                  type="text"
                  value={data.employee_id}
                  onChange={(e) => setData('employee_id', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {errors.employee_id && <p className="text-red-600 text-sm mt-1">{errors.employee_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Other fields go here - same as create form */}

            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={processing} className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">
                {processing ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => window.history.back()} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
