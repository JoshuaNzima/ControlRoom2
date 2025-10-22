import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';

interface Role { id: number; name: string }
interface Zone { id: number; name: string }
interface UserForEdit { id: number; name?: string; email?: string; roles?: { name?: string }[]; status?: string; zone_id?: number | null }
interface EditProps { user: UserForEdit; roles: Role[]; zones: Zone[] }

interface EditForm {
  name: string;
  email: string;
  role: string;
  status: string;
  zone_id: number | null;
}

export default function Edit({ user, roles, zones }: EditProps) {
  const [form, setForm] = useState<EditForm>({
    name: user.name || '',
    email: user.email || '',
    role: user.roles?.[0]?.name || '',
    status: user.status || 'active',
    zone_id: user.zone_id ?? null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // cast to any to satisfy Inertia router payload typing
    router.put(route('admin.users.update', { user: user.id }), form as any);
  };

  return (
    <AdminLayout title={`Edit ${user.name}`}>
      <Head title={`Edit ${user.name}`} />

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} className="w-full mt-1 border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select value={form.role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, role: e.target.value })} className="w-full mt-1 border rounded p-2">
              <option value="">-- Select Role --</option>
              {roles.map((r: Role) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {form.role === 'zone_commander' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned Zone</label>
              <select value={form.zone_id ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, zone_id: e.target.value ? Number(e.target.value) : null })} className="w-full mt-1 border rounded p-2">
                <option value="">-- Unassigned --</option>
                {zones.map((z: Zone) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
            <a href={route('admin.users.index')} className="px-4 py-2 border rounded">Cancel</a>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
