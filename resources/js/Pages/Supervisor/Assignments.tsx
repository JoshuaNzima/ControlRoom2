import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';

interface Client {
  id: number;
  name: string;
}

interface Site {
  id: number;
  name: string;
  address: string;
  client: Client;
  full_name: string;
}

interface Assignment {
  id: number;
  site_name: string;
  client_name: string;
  start_date: string;
  end_date?: string;
  assignment_type: 'permanent' | 'temporary';
}

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone: string;
  status: string;
  current_assignment?: Assignment;
}

interface AssignmentsProps {
  guards: Guard[];
  sites: Site[];
}

export default function Assignments({ guards, sites }: AssignmentsProps) {
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [formData, setFormData] = useState<{
    client_site_id: string;
    start_date: string;
    end_date: string;
    assignment_type: 'permanent' | 'temporary';
    notes: string;
  }>({
    client_site_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    assignment_type: 'permanent',
    notes: '',
  });

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route('supervisor.assignments.assign'), {
      guard_id: selectedGuard?.id,
      ...formData,
    }, {
      onSuccess: () => {
        setSelectedGuard(null);
        setFormData({
          client_site_id: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          assignment_type: 'permanent',
          notes: '',
        });
      },
    });
  };

  const handleUnassign = (assignmentId: number) => {
    if (confirm('Unassign this guard from the location?')) {
      router.delete(route('supervisor.assignments.unassign', { id: assignmentId }));
    }
  };

  const assignedGuards = guards.filter(g => g.current_assignment);
  const unassignedGuards = guards.filter(g => !g.current_assignment);

  return (
    <SupervisorLayout title="Guard Assignments">
      <Head title="Assignments" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Guard Assignments</h1>
          <p className="text-gray-600">Assign your guards to client locations</p>
        </div>

        {/* Unassigned Guards */}
        {unassignedGuards.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
            <h3 className="font-bold text-yellow-900 mb-4">
              Unassigned Guards ({unassignedGuards.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedGuards.map((guard) => (
                <button
                  key={guard.id}
                  onClick={() => setSelectedGuard(guard)}
                  className="p-4 bg-white rounded-lg border-2 border-yellow-200 hover:border-yellow-400 transition text-left"
                >
                  <h4 className="font-semibold text-gray-900">{guard.name}</h4>
                  <p className="text-sm text-gray-600">{guard.employee_id}</p>
                  <p className="text-xs text-yellow-600 mt-2">Click to assign</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Guards */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">
            Assigned Guards ({assignedGuards.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedGuards.map((guard) => (
              <div key={guard.id} className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{guard.name}</h4>
                    <p className="text-sm text-gray-600">{guard.employee_id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    guard.current_assignment?.assignment_type === 'permanent'
                      ? 'bg-green-500 text-white'
                      : guard.current_assignment?.assignment_type === 'temporary'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {guard.current_assignment?.assignment_type}
                  </span>
                </div>
                <div className="bg-white rounded p-3 mb-3">
                  <p className="font-medium text-gray-900">
                    {guard.current_assignment?.client_name}
                  </p>
                  <p className="text-sm text-gray-600">{guard.current_assignment?.site_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Since: {guard.current_assignment?.start_date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedGuard(guard)}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                  >
                    Reassign
                  </button>
                  <button
                    onClick={() => guard.current_assignment && handleUnassign(guard.current_assignment.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Unassign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedGuard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Assign {selectedGuard.name}
              </h3>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Site *
                </label>
                <select
                  value={formData.client_site_id}
                  onChange={(e) => setFormData({...formData, client_site_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.full_name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type *
                </label>
                <select
                  value={formData.assignment_type}
                  onChange={(e) => setFormData({...formData, assignment_type: e.target.value as 'permanent' | 'temporary'})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary</option>
                  <option value="relief">Relief</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  min={formData.start_date}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Any special instructions..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
                >
                  Confirm Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGuard(null)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SupervisorLayout>
  );
}