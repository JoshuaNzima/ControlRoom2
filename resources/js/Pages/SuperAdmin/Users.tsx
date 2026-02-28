import React from 'react';
import { Head, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import useNotification from '@/Providers/useNotifications';

interface Role { id: number; name: string }
interface Zone { id: number; name: string }
interface UserRow {
  id: number;
  name: string;
  email: string;
  employee_id?: string;
  phone?: string;
  roles: { id?: number; name: string }[];
  status?: string;
  zone_id?: number | null;
}

interface UsersIndexProps {
  users: { data: UserRow[]; meta?: any };
  filters: { search?: string };
  roles: Role[];
  zones: Zone[];
}

export default function SuperAdminUsers({ users, filters, roles, zones }: UsersIndexProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserRow | null>(null);
  const [saving, setSaving] = React.useState(false);
  const { push } = useNotification();

  const [createForm, setCreateForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    role: roles?.[0]?.name || 'admin',
    status: 'active',
    zone_id: '' as any,
    password: '',
    password_confirmation: '',
  });

  const [editForm, setEditForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    role: '',
    status: 'active',
    zone_id: '' as any,
    password: '',
    password_confirmation: '',
  });

  React.useEffect(() => {
    if (selectedUser) {
      setEditForm({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        employee_id: selectedUser.employee_id || '',
        role: selectedUser.roles?.[0]?.name || '',
        status: selectedUser.status || 'active',
        zone_id: (selectedUser.zone_id as any) ?? '',
        password: '',
        password_confirmation: '',
      });
    }
  }, [selectedUser]);

  const roleNormalized = (createForm.role || '').toLowerCase().replace(' ', '_');
  const createPasswordsMatch = !!createForm.password && createForm.password === createForm.password_confirmation;
  const createPasswordValid = (createForm.password || '').length >= 8;
  const createZoneRequired = roleNormalized === 'zone_commander';
  const createZoneValid = !createZoneRequired || !!createForm.zone_id;
  const canCreate =
    !!createForm.name &&
    !!createForm.email &&
    !!createForm.role &&
    createPasswordValid &&
    createPasswordsMatch &&
    createZoneValid &&
    !saving;

  React.useEffect(() => {
    if (roleNormalized !== 'zone_commander' && createForm.zone_id !== null) {
      setCreateForm((prev) => ({ ...prev, zone_id: '' as any }));
    } else if (roleNormalized === 'zone_commander' && (createForm.zone_id === null || createForm.zone_id === '')) {
      if (zones && zones.length > 0) {
        setCreateForm((prev) => ({ ...prev, zone_id: zones[0].id as any }));
      }
    }
  }, [createForm.role, roleNormalized, zones]);

  const editRoleNormalized = (editForm.role || '').toLowerCase().replace(' ', '_');
  const editPasswordsMatch = !editForm.password || editForm.password === editForm.password_confirmation;
  const editPasswordValid = !editForm.password || (editForm.password || '').length >= 8;
  const editZoneRequired = editRoleNormalized === 'zone_commander';
  const editZoneValid = !editZoneRequired || !!editForm.zone_id;
  const canEdit =
    !!editForm.name &&
    !!editForm.email &&
    !!editForm.role &&
    editPasswordValid &&
    editPasswordsMatch &&
    editZoneValid &&
    !saving;

  React.useEffect(() => {
    if (editRoleNormalized !== 'zone_commander' && editForm.zone_id !== null && editForm.zone_id !== '') {
      setEditForm((prev) => ({ ...prev, zone_id: '' as any }));
    } else if (editRoleNormalized === 'zone_commander' && (editForm.zone_id === null || editForm.zone_id === '')) {
      if (zones && zones.length > 0) {
        setEditForm((prev) => ({ ...prev, zone_id: zones[0].id as any }));
      }
    }
  }, [editForm.role, editRoleNormalized, zones]);

  const handleSearch = () => {
    router.get(route('superadmin.users'), { search }, { preserveState: true });
  };

  const submitCreate = () => {
    setSaving(true);
    const payload: any = {
      ...createForm,
      role: (createForm.role || '').trim(),
      zone_id: createForm.zone_id ? createForm.zone_id : null,
    };
    router.post(route('admin.users.store'), payload, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => {
        setShowAdd(false);
        push('User created');
        setCreateForm({
          name: '',
          email: '',
          phone: '',
          employee_id: '',
          role: roles?.[0]?.name || 'admin',
          status: 'active',
          zone_id: '' as any,
          password: '',
          password_confirmation: '',
        });
      },
      onError: () => push('Failed to create user'),
    });
  };

  const submitUpdate = () => {
    if (!selectedUser) return;
    setSaving(true);
    const payload: any = { ...editForm, role: (editForm.role || '').trim() };
    if (!payload.password) { delete payload.password; delete payload.password_confirmation; }
    if (!payload.zone_id) payload.zone_id = null;
    router.put(route('admin.users.update', { user: selectedUser.id }), payload, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => { setShowEdit(false); push('User updated'); },
      onError: () => push('Failed to update user'),
    });
  };

  return (
    <SuperAdminLayout title="Users Management">
      <Head title="Users" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="Users" size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Users Management</h1>
                <p className="text-red-100 mt-1">Create, edit and manage system users and their roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600">
                <IconMapper name="Users" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.meta?.total ?? users.data.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600">
                <IconMapper name="UserCheck" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {users.data.filter((u: UserRow) => u.status === 'active').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600">
                <IconMapper name="Shield" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{roles.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Roles</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-600">
                <IconMapper name="MapPin" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{zones.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Zones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Directory</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage system users and their access</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
          >
            <IconMapper name="Plus" size={20} />
            Add User
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0 relative">
              <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-3 md:hidden">
          {users.data.map((u) => (
            <div key={u.id} className="rounded-xl bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{u.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</div>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 rounded-full text-xs font-semibold">
                  {u.roles?.[0]?.name || 'No Role'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">Employee: {u.employee_id || 'N/A'}</div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  u.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {u.status || 'Active'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedUser(u); setShowEdit(true); }}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this user?')) {
                      router.delete(route('admin.users.destroy', { user: u.id }));
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                >
                  <IconMapper name="Trash" size={18} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const newStatus = u.status === 'active' ? 'inactive' : 'active';
                    if (!confirm(`Set status to ${newStatus}?`)) return;
                    try {
                      await router.put(route('admin.users.update', { user: u.id }), { status: newStatus });
                      push(`User ${u.name} set to ${newStatus}`);
                    } catch (e) {
                      push('Failed to update user status');
                    }
                  }}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition"
                  title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                >
                  {u.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.data.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{u.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{u.employee_id || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 rounded-full text-xs font-semibold">
                      {u.roles?.[0]?.name || 'No Role'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      u.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedUser(u); setShowEdit(true); }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                        title="Edit"
                      >
                        <IconMapper name="Pencil" size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this user?')) {
                            router.delete(route('admin.users.destroy', { user: u.id }));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        <IconMapper name="Trash" size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          const newStatus = u.status === 'active' ? 'inactive' : 'active';
                          if (!confirm(`Set status to ${newStatus}?`)) return;
                          try {
                            await router.put(route('admin.users.update', { user: u.id }), { status: newStatus });
                            push(`User ${u.name} set to ${newStatus}`);
                          } catch (e) {
                            push('Failed to update user status');
                          }
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                        title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        <Modal show={showAdd} onClose={() => setShowAdd(false)} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add User</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee ID</label>
                <input value={createForm.employee_id} onChange={(e) => setCreateForm({ ...createForm, employee_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role *</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100">
                  <option value="">-- Select Role --</option>
                  {roles.map((r) => (<option key={r.id} value={r.name}>{r.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Zone</label>
                <select value={createForm.zone_id} onChange={(e) => setCreateForm({ ...createForm, zone_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100">
                  <option value="">-- Unassigned --</option>
                  {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password *</label>
                <input type="password" value={createForm.password_confirmation} onChange={(e) => setCreateForm({ ...createForm, password_confirmation: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
              </div>
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg font-bold">Cancel</button>
              <button onClick={submitCreate} disabled={!canCreate} className={`px-6 py-3 rounded-lg font-bold text-white ${canCreate ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed'}`}>{saving ? 'Saving...' : 'Save User'}</button>
            </div>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal show={showEdit} onClose={() => setShowEdit(false)} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit User</h2>
            {!selectedUser ? (
              <div className="text-sm text-gray-500">No user selected</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee ID</label>
                  <input value={editForm.employee_id} onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100">
                    <option value="">-- Select Role --</option>
                    {roles.map((r) => (<option key={r.id} value={r.name}>{r.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Zone</label>
                  <select value={editForm.zone_id} onChange={(e) => setEditForm({ ...editForm, zone_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100">
                    <option value="">-- Unassigned --</option>
                    {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                  <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
                  {!editPasswordValid && editForm.password && (
                    <p className="text-xs text-red-500 mt-1">Minimum 8 characters.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                  <input type="password" value={editForm.password_confirmation} onChange={(e) => setEditForm({ ...editForm, password_confirmation: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100" />
                  {editForm.password_confirmation && !editPasswordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Passwords must match.</p>
                  )}
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={() => setShowEdit(false)} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg font-bold">Cancel</button>
              <button onClick={submitUpdate} disabled={!canEdit} className={`px-6 py-3 rounded-lg font-bold text-white ${canEdit ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed'}`}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </Modal>
      </div>
    </SuperAdminLayout>
  );
}
