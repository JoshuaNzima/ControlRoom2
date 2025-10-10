import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Plus, Pencil, Trash } from 'lucide-react';
import useNotification from '@/Providers/useNotifications';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone?: string;
  status?: string;
  supervisor?: { id: number; name: string } | null;
}

interface Filters {
  search?: string;
  status?: string;
}

interface GuardsIndexProps {
  guards: {
    data: Guard[];
    meta?: any;
  };
  filters: Filters;
}

export default function GuardsIndex({ guards, filters }: GuardsIndexProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const { push } = useNotification();

  const handleSearch = () => {
    router.get(route('guards.index'), { search }, { preserveState: true });
  };

  function showToast(message: string) {
    push(message, 'info');
  }

  return (
    <AdminLayout title="Guards Management">
      <Head title="Guards" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notifications are displayed by the global NotificationProvider */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guards Management</h1>
            <p className="text-gray-600">Manage field guards and assignments</p>
          </div>
          <Link
            href={route('guards.create')}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
          >
            <Plus size={20} />
            Add Guard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, employee id or phone..."
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

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guard</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guards.data.map((guard) => (
                <tr key={guard.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                        {guard.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{guard.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{guard.employee_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{guard.supervisor?.name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{guard.phone || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      guard.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {guard.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={route('guards.edit', { guard: guard.id })}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Pencil size={18} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this guard?')) {
                            router.delete(route('guards.destroy', { guard: guard.id }));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash size={18} />
                      </button>
                      {/* Suspend / Activate */}
                      <button
                        onClick={async () => {
                          const newStatus = guard.status === 'active' ? 'suspended' : 'active';
                          if (!confirm(`Are you sure you want to set status to ${newStatus}?`)) return;
                          setLoadingId(guard.id);
                          try {
                            await router.put(route('guards.update', { guard: guard.id }), { status: newStatus });
                            showToast(`Guard ${guard.name} set to ${newStatus}`);
                          } catch (e) {
                            showToast('Failed to update status');
                          } finally {
                            setLoadingId(null);
                          }
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                        title={guard.status === 'active' ? 'Suspend guard' : 'Activate guard'}
                        disabled={loadingId === guard.id}
                      >
                        {loadingId === guard.id ? '...' : guard.status === 'active' ? 'Suspend' : 'Activate'}
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
