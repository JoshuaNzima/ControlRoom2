import React from 'react';
import { useForm } from '@inertiajs/react';
import { GuardFormData } from '@/types/guards';

interface Supervisor {
  id: number;
  name: string;
}

interface GuardFormProps {
  initialData: Partial<GuardFormData>;
  supervisors: Supervisor[];
  onSubmit: (data: GuardFormData) => void;
  canAssignSupervisor: boolean;
  processing?: boolean;
  errors?: Record<string, string>;
}

export default function GuardForm({
  initialData,
  supervisors,
  onSubmit,
  canAssignSupervisor,
  processing = false,
  errors = {}
}: GuardFormProps) {
  const { data, setData } = useForm<GuardFormData>({
    employee_id: initialData.employee_id || '',
    name: initialData.name || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
    id_number: initialData.id_number || '',
    date_of_birth: initialData.date_of_birth || '',
    gender: initialData.gender || '',
    emergency_contact_name: initialData.emergency_contact_name || '',
    emergency_contact_phone: initialData.emergency_contact_phone || '',
    supervisor_id: initialData.supervisor_id || '',
    hire_date: initialData.hire_date || '',
    notes: initialData.notes || '',
    status: initialData.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
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

        {canAssignSupervisor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
            <select
              value={data.supervisor_id}
              onChange={(e) => setData('supervisor_id', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a Supervisor</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name}
                </option>
              ))}
            </select>
            {errors.supervisor_id && <p className="text-red-600 text-sm mt-1">{errors.supervisor_id}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => setData('phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
          <input
            type="text"
            value={data.id_number}
            onChange={(e) => setData('id_number', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          {errors.id_number && <p className="text-red-600 text-sm mt-1">{errors.id_number}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={data.date_of_birth}
            onChange={(e) => setData('date_of_birth', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          {errors.date_of_birth && <p className="text-red-600 text-sm mt-1">{errors.date_of_birth}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={data.gender}
            onChange={(e) => setData('gender', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={data.address}
            onChange={(e) => setData('address', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
          {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
          <input
            type="text"
            value={data.emergency_contact_name}
            onChange={(e) => setData('emergency_contact_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          {errors.emergency_contact_name && <p className="text-red-600 text-sm mt-1">{errors.emergency_contact_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
          <input
            type="tel"
            value={data.emergency_contact_phone}
            onChange={(e) => setData('emergency_contact_phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          {errors.emergency_contact_phone && <p className="text-red-600 text-sm mt-1">{errors.emergency_contact_phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
          <input
            type="date"
            value={data.hire_date}
            onChange={(e) => setData('hire_date', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          {errors.hire_date && <p className="text-red-600 text-sm mt-1">{errors.hire_date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={data.status}
            onChange={(e) => setData('status', e.target.value as GuardFormData['status'])}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
          {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={data.notes}
            onChange={(e) => setData('notes', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            rows={4}
          />
          {errors.notes && <p className="text-red-600 text-sm mt-1">{errors.notes}</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={processing}
          className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
        >
          {processing ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}