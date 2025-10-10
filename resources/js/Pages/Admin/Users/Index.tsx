import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Plus, Pencil, Trash } from 'lucide-react';
import useNotification from '@/Providers/useNotifications';

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
}

interface Filters {
  search?: string;
}

interface UsersIndexProps {
  users: {
    data: User[];
    meta?: any;
  };
  filters: Filters;
}

export default function UsersIndex({ users, filters }: UsersIndexProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const { push } = useNotification();

  function showToast(message: string) {
    push(message, 'info');
  }

  const handleSearch = () => {
    router.get(route('admin.users.index'), { search }, { preserveState: true });
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
          <Link
            href={route('admin.users.create')}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
          >
            <Plus size={20} />
            Add User
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
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
                      <Link
                        href={route('admin.users.edit', { id: user.id })}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Pencil size={18} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this user?')) {
                            router.delete(route('admin.users.destroy', { id: user.id }));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash size={18} />
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
    </AdminLayout>
  );
}