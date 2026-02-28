import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import useNotification from '@/Providers/useNotifications';
import Modal from '@/Components/Modal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import EmptyState from '@/Components/ui/empty-state';

const adminFieldClassName =
  'mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

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
  per_page?: number | string;
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
    links?: Array<{ url: string | null; label: string; active: boolean }>;
  };
  filters: Filters;
  roles: Role[];
  zones: Zone[];
}

export default function UsersIndex({ users, filters, roles, zones }: UsersIndexProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const initialPerPage = Number(filters?.per_page ?? users.meta?.per_page ?? 20);
  const [perPage, setPerPage] = useState<number>(initialPerPage);
  const { push } = useNotification();

  // Create User modal state
  const [showCreate, setShowCreate] = useState(false);
  const {
    data: createData,
    setData: setCreateData,
    post: postCreate,
    transform: transformCreate,
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
    role: roles?.[0]?.name || 'admin',
    zone_id: null,
    status: 'active',
  });

  const openCreate = () => {
    resetCreate();
    setCreateData('role', roles?.[0]?.name || 'admin');
    setCreateData('status', 'active');
    setCreateData('zone_id', null as any);
    setShowCreate(true);
  };

  const roleNormalized = (createData.role || '').toLowerCase().replace(' ', '_');
  const passwordsMatch = !!createData.password && createData.password === createData.password_confirmation;
  const passwordValid = (createData.password || '').length >= 8;
  const zoneRequired = roleNormalized === 'zone_commander';
  const zoneValid = !zoneRequired || !!createData.zone_id;
  const canCreate = !!createData.name && !!createData.email && !!(createData.role && createData.role.length) && passwordValid && passwordsMatch && zoneValid && !creating;

  useEffect(() => {
    if (roleNormalized !== 'zone_commander' && createData.zone_id !== null) {
      setCreateData('zone_id', null as any);
    } else if (roleNormalized === 'zone_commander' && (createData.zone_id === null || createData.zone_id === '')) {
      if (zones && zones.length > 0) {
        setCreateData('zone_id', zones[0].id as any);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createData.role]);

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    transformCreate((data) => ({
      ...data,
      zone_id: (data.zone_id === '' ? null : data.zone_id) as any,
      role: (data.role || '').trim(),
    }));
    postCreate(route('admin.users.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowCreate(false);
        resetCreate();
        push('User created');
      },
      onError: () => push('Failed to create user'),
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
    router.get(route('admin.users.index'), { search, per_page: perPage }, { preserveState: true });
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

  const handleCreateClose = () => { if (!creating) setShowCreate(false); };
  const handleEditClose = () => { if (!updating) setShowEdit(false); };

  return (
    <AdminLayout title="Users Management">
      <Head title="Users" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notifications are displayed by the global NotificationProvider */}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage system users and permissions</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
          >
            <IconMapper name="Plus" size={20} />
            Add User
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm shadow-black/5 dark:shadow-none p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
              <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              />
            </div>
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              Search
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-400">Per Page:</label>
            <select
              value={String(perPage)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPerPage(v);
                router.get(route('admin.users.index'), { search, per_page: v, page: 1 }, { preserveState: true });
              }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            {users.meta && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {users.meta.from || 0} to {users.meta.to || 0} of {users.meta.total || 0}
              </span>
            )}
          </div>
        </div>

        {/* Users List - Card Based */}
        {users.data.length === 0 ? (
          <EmptyState
            title="No users found"
            description={search ? "Try adjusting your search." : "Add your first user to get started."}
          />
        ) : (
          <div className="space-y-3">
            {users.data.map((user) => (
              <Card
                key={user.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Left accent bar based on status */}
                  <div className={`w-full sm:w-1.5 ${
                    user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'
                  }`} />

                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {user.name}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </span>
                          </div>
                          <Badge className={`text-xs ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600'
                          }`}>
                            <IconMapper name={user.status === 'active' ? 'CheckCircle' : 'XCircle'} size={12} className="mr-1 inline" />
                            {user.status || 'Active'}
                          </Badge>
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-200 text-xs">
                            {user.roles[0]?.name?.replace('_', ' ') || 'No Role'}
                          </Badge>
                        </div>

                        {/* Info Row */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <IconMapper name="IDCard" size={14} />
                            {user.employee_id || 'N/A'}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <IconMapper name="Phone" size={14} />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side: Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                          title="Edit user"
                        >
                          <IconMapper name="Pencil" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
                          disabled={loadingId === user.id}
                          title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                          className={user.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
                        >
                          <IconMapper name={user.status === 'active' ? 'PauseCircle' : 'PlayCircle'} size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              router.delete(route('admin.users.destroy', { user: user.id }));
                            }
                          }}
                          title="Delete user"
                          className="text-red-500"
                        >
                          <IconMapper name="Trash" size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {users.meta && users.meta.last_page > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {users.links && users.links.map((link: any, index: number) => (
              <Link
                key={index}
                href={link.url || '#'}
                className={`px-3 py-2 rounded ${
                  link.active
                    ? 'bg-red-600 text-white'
                    : link.url
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800'
                    : 'bg-transparent text-gray-400 cursor-default'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
    <Modal show={showCreate} onClose={handleCreateClose} maxWidth="2xl">
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add User</h2>
        <form onSubmit={submitCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                className={adminFieldClassName}
                value={createData.name}
                onChange={(e) => setCreateData('name', e.target.value)}
                required
              />
              {createErrors.name && <p className="text-xs text-red-600 mt-1">{createErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
              <input
                className={adminFieldClassName}
                value={createData.employee_id || ''}
                onChange={(e) => setCreateData('employee_id', e.target.value)}
              />
              {createErrors.employee_id && <p className="text-xs text-red-600 mt-1">{createErrors.employee_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                className={adminFieldClassName}
                value={createData.email}
                onChange={(e) => setCreateData('email', e.target.value)}
                required
              />
              {createErrors.email && <p className="text-xs text-red-600 mt-1">{createErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input
                className={adminFieldClassName}
                value={createData.phone || ''}
                onChange={(e) => setCreateData('phone', e.target.value)}
              />
              {createErrors.phone && <p className="text-xs text-red-600 mt-1">{createErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                className={adminFieldClassName}
                value={createData.password}
                onChange={(e) => setCreateData('password', e.target.value)}
                required
              />
              {createErrors.password && <p className="text-xs text-red-600 mt-1">{createErrors.password}</p>}
              {!passwordValid && createData.password && (
                <p className="text-xs text-red-600 mt-1">Minimum 8 characters.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
              <input
                type="password"
                className={adminFieldClassName}
                value={createData.password_confirmation}
                onChange={(e) => setCreateData('password_confirmation', e.target.value)}
                required
              />
              {createErrors.password_confirmation && <p className="text-xs text-red-600 mt-1">{createErrors.password_confirmation}</p>}
              {createData.password_confirmation && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords must match.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                className={adminFieldClassName}
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
                className={adminFieldClassName}
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
                  className={adminFieldClassName}
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
                {!zoneValid && (
                  <p className="text-xs text-red-600 mt-1">Zone is required for Zone Commander.</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCreateClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canCreate}
              className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 ${canCreate ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 dark:bg-red-700/60 cursor-not-allowed'}`}
            >
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </Modal>

    {/* Edit User Modal */}
    <Modal show={showEdit} onClose={handleEditClose} maxWidth="2xl">
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
                  className={adminFieldClassName}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  className={adminFieldClassName}
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  className={adminFieldClassName}
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                <input
                  className={adminFieldClassName}
                  value={editForm.employee_id || ''}
                  onChange={(e) => setEditForm({ ...(editForm as EditUserForm), employee_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select
                  className={adminFieldClassName}
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
                  className={adminFieldClassName}
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
                    className={adminFieldClassName}
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
                onClick={handleEditClose}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:opacity-60"
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
