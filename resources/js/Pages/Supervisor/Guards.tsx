import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import { Search, Phone, CalendarDays, Eye, X } from 'lucide-react';

interface Guard {
  id: number;
  employee_id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  status_color: string;
  hire_date: string;
  is_on_duty: boolean;
  today_attendance: {
    check_in: string;
    check_out: string;
  } | null;
}

interface Props {
  guards: {
    data: Guard[];
    links: any[];
    meta: any;
  };
  filters: {
    search?: string;
    status?: string;
  };
}

export default function Guards({ guards, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    router.get(
      route('supervisor.guards'),
      { search, status },
      { preserveState: true, replace: true }
    );
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setSelectedGuard(null);
    }
  };

  useEffect(() => {
    if (selectedGuard) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedGuard]);

  const getStatusBadge = (status: string, color: string) => {
    const colors: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const guardsData = {
    data: guards.data || [],
    links: guards.links || [],
    meta: guards.meta || { last_page: 0, from: 0, to: 0, total: 0 },
  };

  return (
    <SupervisorLayout title="Guards">
      <Head title="Guards" />

      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guards Management</h1>
            <p className="text-gray-600">Manage security personnel</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Name or Employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Guards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guardsData.data.map((guard) => (
            <div key={guard.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {guard.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{guard.name}</h3>
                    <p className="text-sm text-gray-500">{guard.employee_id}</p>
                  </div>
                </div>
                {guard.is_on_duty && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    On Duty
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                {getStatusBadge(guard.status, guard.status_color)}
                <button
                  onClick={() => setSelectedGuard(guard)}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  <Eye size={16} /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {guardsData.meta.last_page > 1 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {guardsData.meta.from} to {guardsData.meta.to} of {guardsData.meta.total} guards
              </div>
              <div className="flex gap-2">
                {guardsData.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url || '#'}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      link.active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedGuard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-xl w-11/12 md:w-1/2 p-6 relative"
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedGuard(null)}
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold mb-4">{selectedGuard.name}</h2>
            <p className="text-sm text-gray-600 mb-2">Employee ID: {selectedGuard.employee_id}</p>
            <p className="text-sm text-gray-600 mb-2">Phone: {selectedGuard.phone}</p>
            <p className="text-sm text-gray-600 mb-2">Email: {selectedGuard.email}</p>
            <p className="text-sm text-gray-600 mb-2">Hired: {selectedGuard.hire_date}</p>
            <p className="text-sm text-gray-600 mb-2">Status: {selectedGuard.status}</p>

            {selectedGuard.today_attendance && (
              <div className="bg-blue-50 rounded-lg p-3 mt-4">
                <p className="text-xs text-gray-600 mb-1">Today's Attendance</p>
                <div className="flex justify-between text-sm">
                  <span>In: {selectedGuard.today_attendance.check_in}</span>
                  {selectedGuard.today_attendance.check_out && (
                    <span>Out: {selectedGuard.today_attendance.check_out}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SupervisorLayout>
  );
}
