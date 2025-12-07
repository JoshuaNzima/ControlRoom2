import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import useNotification from '@/Providers/useNotifications';
import Modal from '@/Components/Modal';

interface User {
  id: number;
  name: string;
  email: string;
  employee_id?: string;
  roles: { id: number; name: string }[];
  role: string;
  status?: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  zone_id?: number | null;
}

interface Filters {
  search?: string;
}

interface Role { id: number; name: string }
interface Zone { id: number; name: string }

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  employee_id?: string;
  role?: string;
  zone_id?: number | null | '';
  status: 'active' | 'inactive';
}

interface EditUserForm {
  name: string;
  email: string;
  phone?: string;
  employee_id?: string;
  role: string;
  status: string;
  zone_id: number | null | '';
}

interface UsersIndexProps {
  users: {
    data: User[];
    meta?: any;
  };
  filters: Filters;
  roles: Role[];
  zones: Zone[];
}

export default function UsersIndex({ users, filters, roles, zones }: UsersIndexProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const { push } = useNotification();

  // Create User modal state
  const [showCreate, setShowCreate] = useState(false);
  const {
    data: createData,
    setData: setCreateData,
    post: postCreate,
    processing: creating,
    errors: createErrors,
    reset: resetCreate,
  } = useForm<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    employee_id: '',
    role: roles?.[0]?.name || '',
    zone_id: null,
    status: 'active',
  });

  const openCreate = () => {
    resetCreate();
    setCreateData('role', roles?.[0]?.name || '');
    setCreateData('status', 'active');
    setCreateData('zone_id', null as any);
    setShowCreate(true);
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    postCreate(route('admin.users.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowCreate(false);
        resetCreate();
      },
    });
  };

  const isCreateZoneCommander = (createData.role || '').toLowerCase().replace(' ', '_') === 'zone_commander';

  // Edit User modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [updating, setUpdating] = useState(false);

  function showToast(message: string) {
    push(message, 'info');
  }

  const handleSearch = () => {
    router.get(route('admin.users.index'), { search }, { preserveState: true });
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      employee_id: user.employee_id || '',
      role: user.roles[0]?.name || '',
      status: user.status || 'active',
      zone_id: (user.zone_id ?? null) as any,
    });
    setShowEdit(true);
  };

  const isEditZoneCommander = (editForm?.role || '').toLowerCase().replace(' ', '_') === 'zone_commander';

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editForm) return;
    setUpdating(true);
    router.put(
      route('admin.users.update', { user: editingUser.id }),
      {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        employee_id: editForm.employee_id,
        role: editForm.role,
        status: editForm.status,
        zone_id: editForm.zone_id === '' ? null : editForm.zone_id,
      } as any,
      {
        preserveScroll: true,
        onFinish: () => setUpdating(false),
        onSuccess: () => setShowEdit(false),
      }
    );
  };

  return (
    <AdminLayout title="Users Management">
      <Head title="Users" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notifications are displayed by the global NotificationProvider */}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600">Manage system users and permissions</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
          >
            <IconMapper name="Plus" size={20} />
            Add User
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4">
              <div className="flex-1 relative">
              <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.data.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.employee_id || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
                      {user.roles[0]?.name || 'No Role'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <IconMapper name="Pencil" size={18} />
                      </button>
                        <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this user?')) {
                            router.delete(route('admin.users.destroy', { user: user.id }));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                        <IconMapper name="Trash" size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          const newStatus = user.status === 'active' ? 'inactive' : 'active';
                          if (!confirm(`Are you sure you want to set status to ${newStatus}?`)) return;
                          setLoadingId(user.id);
                          try {
                            await router.put(route('admin.users.update', { user: user.id }), { status: newStatus });
                            showToast(`User ${user.name} set to ${newStatus}`);
                          } catch (e) {
                            showToast('Failed to update user status');
                          } finally {
                            setLoadingId(null);
                          }
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                        title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                        disabled={loadingId === user.id}
                      >
                        {loadingId === user.id ? '...' : user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
    <Modal show={showCreate} onClose={() => setShowCreate(false)} maxWidth="2xl">
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add User</h2>
        <form onSubmit={submitCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                value={createData.name}
                onChange={(e) => setCreateData('name', e.target.value)}
                required
              />
              {createErrors.name && <p className="text-xs text-red-600 mt-1">{createErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                value={createData.employee_id || ''}
                onChange={(e) => setCreateData('employee_id', e.target.value)}
              />
              {createErrors.employee_id && <p className="text-xs text-red-600 mt-1">{createErrors.employee_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                value={createData.email}
                onChange={(e) => setCreateData('email', e.target.value)}
                required
              />
              {createErrors.email && <p className="text-xs text-red-600 mt-1">{createErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                value={createData.phone || ''}
                onChange={(e) => setCreateData('phone', e.target.value)}
              />
              {createErrors.phone && <p className="text-xs text-red-600 mt-1">{createErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                value={createData.password}
                onChange={(e) => setCreateData('password', e.target.value)}
                required
              />
              {createErrors.password && <p className="text-xs text-red-600 mt-1">{createErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                value={createData.password_confirmation}
                onChange={(e) => setCreateData('password_confirmation', e.target.value)}
                required
              />
              {createErrors.password_confirmation && <p className="text-xs text-red-600 mt-1">{createErrors.password_confirmation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                value={createData.role || ''}
                onChange={(e) => setCreateData('role', e.target.value)}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {createErrors.role && <p className="text-xs text-red-600 mt-1">{createErrors.role}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                value={createData.status}
                onChange={(e) => setCreateData('status', e.target.value as 'active' | 'inactive')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {createErrors.status && <p className="text-xs text-red-600 mt-1">{createErrors.status}</p>}
            </div>

            {isCreateZoneCommander && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Zone</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                  value={createData.zone_id === null ? '' : String(createData.zone_id)}
                  onChange={(e) =>
                    setCreateData('zone_id', e.target.value ? (parseInt(e.target.value, 10) as any) : (null as any))
                  }
                >
                  <option value="">No Zone Assigned</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {createErrors.zone_id && <p className="text-xs text-red-600 mt-1">{createErrors.zone_id}</p>}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </Modal>

    {/* Edit User Modal */}
    <Modal show={showEdit} onClose={() => setShowEdit(false)} maxWidth="2xl">
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit User</h2>
        {!editForm ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                  value={editForm.employee_id || ''}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), employee_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), role: e.target.value })}
                >
                  <option value="">-- Select Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {isEditZoneCommander && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Zone</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2"
                    value={editForm.zone_id === null ? '' : String(editForm.zone_id)}
                    onChange={(e) =>
                      setEditForm({
                        ...(editForm as EditUserForm),
                        zone_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">-- Unassigned --</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  </AdminLayout>
);
}
