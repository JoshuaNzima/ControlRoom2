import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  employee_id?: string;
  role?: string;
}

export default function CreateUser({ roles }: any) {
  const { data, setData, post, processing, errors } = useForm<UserFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    employee_id: '',
    role: roles?.[0]?.name || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.users.store'));
  };

  return (
    <AdminLayout title="Add User">
      <Head title="Add User" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New User</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  {roles?.map((r: any) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={processing} className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">{processing ? 'Saving...' : 'Create User'}</button>
              <button type="button" onClick={() => window.history.back()} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
