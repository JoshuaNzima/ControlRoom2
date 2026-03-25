import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TrainingLayout from '@/Layouts/TrainingLayout';
import IconMapper from '@/Components/IconMapper';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone: string | null;
  email: string | null;
  status: string;
  grade?: { code?: string; name?: string } | null;
  supervisor: { name: string } | null;
  // Directory endpoint doesn't include sites; keep optional to avoid runtime errors
  sites?: { site_name?: string; client?: { name?: string } }[];
}

interface PageProps {
  [key: string]: any;
  auth: { user: any };
  guards: {
    data: Guard[];
    current_page: number;
    last_page: number;
    total: number;
  };
  filters: { search?: string; status?: string };
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  terminated: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
};

export default function GuardsIndex() {
  const props = usePage<PageProps>().props;
  const auth = props.auth || { user: {} };
  const guards = props.guards || { data: [], current_page: 1, last_page: 1, total: 0 };
  const filters = props.filters || {};
  
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);

  return (
    <TrainingLayout title="Guards Directory" user={auth?.user}>
      <Head title="Guards" />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Guards Directory</h2>
          <p className="text-gray-600 dark:text-gray-400">View guard profiles and assignments</p>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <IconMapper name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guards by name or employee ID..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-coin-500 focus:border-coin-500"
              />
            </div>
            <button
              onClick={() => window.location.href = route('training.guards.index', { search: search || undefined })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Guards Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guard</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supervisor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {guards.data.map((guard) => (
                  <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {guard.grade?.code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {guard.supervisor?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[guard.status] || statusColors.inactive}`}>
                        {guard.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedGuard(guard)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {guards.data.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No guards found
            </div>
          )}
        </div>

        {/* Pagination */}
        {guards.last_page > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: guards.last_page }, (_, i) => i + 1).map(page => (
              <a
                key={page}
                href={route('training.guards.index', { ...filters, page })}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  page === guards.current_page
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Guard Details Modal */}
      {selectedGuard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Guard Details</h3>
              <button onClick={() => setSelectedGuard(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedGuard.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedGuard.employee_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedGuard.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedGuard.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Grade</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedGuard.grade?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Supervisor</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedGuard.supervisor?.name || 'Unassigned'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Sites</label>
                {Array.isArray(selectedGuard.sites) && selectedGuard.sites.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {selectedGuard.sites.map((site, idx) => (
                      <li key={idx} className="text-sm text-gray-900 dark:text-gray-100">
                        {site.site_name || '—'} {site.client?.name ? `(${site.client.name})` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No sites assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </TrainingLayout>
  );
}
