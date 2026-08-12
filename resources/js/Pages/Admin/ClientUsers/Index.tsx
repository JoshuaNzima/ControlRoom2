import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import EmptyState from '@/Components/ui/empty-state';
import Modal from '@/Components/Modal';

interface ClientUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  clients: Array<{ id: number; name: string; status: string }>;
}

interface Client {
  id: number;
  name: string;
  status: string;
}

interface Filters {
  search?: string;
  per_page?: number | string;
  status?: string;
  client_id?: number | string;
}

interface Props {
  users: {
    data: ClientUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
  };
  filters: Filters;
  clients: Client[];
  clientsWithoutUsers: Client[];
}

const fieldClassName = 'mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

export default function ClientUsersIndex({ users, filters, clients, clientsWithoutUsers }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [clientFilter, setClientFilter] = useState(filters.client_id || '');
  const [perPage, setPerPage] = useState(Number(filters.per_page || 20));
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: formData, setData, post, processing, reset, errors } = useForm({
    client_id: '',
    name: '',
    email: '',
    phone: '',
    client_role: 'contact' as 'primary' | 'contact' | 'viewer',
  });

  const handleSearch = () => {
    router.get(
      route('admin.client-users.index'),
      { search, status: statusFilter, client_id: clientFilter, per_page: perPage },
      { preserveState: true }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.client-users.store'), {
      onSuccess: () => {
        reset();
        setShowAddModal(false);
        router.reload({ only: ['users', 'clientsWithoutUsers'] });
      },
    });
  };

  const toggleStatus = async (user: ClientUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${actionText} "${user.name}"?`)) return;

    setLoadingId(user.id);
    try {
      const response = await fetch(route('admin.client-users.toggle-status', { user: user.id }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        router.reload({ only: ['users'] });
      } else {
        alert(data.message || 'Failed to update status.');
      }
    } catch (e) {
      alert('Failed to update status.');
    } finally {
      setLoadingId(null);
    }
  };

  const sendResetLink = async (user: ClientUser) => {
    if (!confirm(`Send password reset email to "${user.name}" at ${user.email}?`)) return;

    setLoadingId(user.id);
    try {
      const response = await fetch(route('admin.client-users.send-reset-link', { user: user.id }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
      } else {
        alert(data.message || 'Failed to send reset email.');
      }
    } catch (e) {
      alert('Failed to send reset email.');
    } finally {
      setLoadingId(null);
    }
  };

  const deleteUser = async (user: ClientUser) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"? This action cannot be undone.`)) return;

    setLoadingId(user.id);
    try {
      const response = await fetch(route('admin.client-users.destroy', { user: user.id }), {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });

      const data = await response.json();
      if (data.success) {
        router.reload({ only: ['users', 'clientsWithoutUsers'] });
      } else {
        alert(data.message || 'Failed to delete user.');
      }
    } catch (e) {
      alert('Failed to delete user.');
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge variant="success">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <AuthenticatedLayout header="Client Users">
      <Head title="Client Users" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-coin-100 dark:bg-coin-900/20 rounded-full flex items-center justify-center">
                  <IconMapper name="UserCog" size={24} className="text-coin-600" />
                </div>
                <div>
                  <CardTitle>Client Users</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {users.total} user{users.total !== 1 ? 's' : ''} total
                    {clientsWithoutUsers.length > 0 && (
                      <span className="ml-2 text-amber-600 dark:text-amber-400">
                        ({clientsWithoutUsers.length} client{clientsWithoutUsers.length !== 1 ? 's' : ''} without users)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowAddModal(true)}>
                <IconMapper name="Plus" size={16} className="mr-2" />
                Add Client User
              </Button>
            </CardHeader>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Clients</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              {users.data.length === 0 ? (
                <EmptyState
                  icon="Users"
                  title="No client users found"
                  description="No users match your search criteria. Click 'Add Client User' to create one."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client(s)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {users.data.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                              {user.phone && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {user.clients.map((c) => (
                                <Badge key={c.id} variant={c.status === 'active' ? 'outline' : 'secondary'}>
                                  {c.name}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendResetLink(user)}
                                disabled={loadingId === user.id}
                                title="Send password reset email"
                              >
                                <IconMapper name="Mail" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant={user.status === 'active' ? 'outline' : 'default'}
                                onClick={() => toggleStatus(user)}
                                disabled={loadingId === user.id}
                                title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                <IconMapper name={user.status === 'active' ? 'UserX' : 'UserCheck'} size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteUser(user)}
                                disabled={loadingId === user.id}
                                className="text-red-500 hover:text-red-600 hover:border-red-500"
                                title="Delete user"
                              >
                                <IconMapper name="Trash2" size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {users.last_page > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {users.from} to {users.to} of {users.total} results
                  </div>
                  <div className="flex gap-1">
                    {users.links.map((link, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url as string)}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Client User Modal */}
      <Modal show={showAddModal} onClose={() => !processing && setShowAddModal(false)}>
        <div className="bg-white dark:bg-gray-950 rounded-xl p-6 max-w-lg w-full mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Add Client User
          </h2>

          {clientsWithoutUsers.length === 0 ? (
            <div className="text-center py-6">
              <IconMapper name="CheckCircle" size={48} className="mx-auto text-green-500 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                All active clients already have user accounts.
              </p>
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="mt-4">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setData('client_id', e.target.value)}
                  className={fieldClassName}
                  required
                >
                  <option value="">Select a client</option>
                  {clientsWithoutUsers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.client_id && <p className="text-red-600 text-sm mt-1">{errors.client_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className={fieldClassName}
                  required
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className={fieldClassName}
                  required
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                  className={fieldClassName}
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Role</label>
                <select
                  value={formData.client_role}
                  onChange={(e) => setData('client_role', e.target.value as 'primary' | 'contact' | 'viewer')}
                  className={fieldClassName}
                >
                  <option value="primary">Primary Contact (Full Access)</option>
                  <option value="contact">Contact (Standard Access)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  A password reset email will be sent to set their password.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={processing} className="flex-1">
                  {processing ? 'Creating...' : 'Create User'}
                </Button>
                <Button type="button" variant="outline" onClick={() => !processing && setShowAddModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
