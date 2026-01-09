import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';

interface Supervisor {
  id: number;
  name: string;
  employee_id: string;
  email: string;
}

interface Assignment {
  id: number;
  client_name: string;
  site_name: string;
}

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  supervisor?: Supervisor;
  status: string;
  current_assignment?: Assignment;
}

interface GuardAssignmentsProps {
  guards: {
    data: Guard[];
  };
  supervisors: Supervisor[];
}

export default function GuardAssignments({ guards, supervisors }: GuardAssignmentsProps) {
  const [selectedGuards, setSelectedGuards] = useState<number[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');

  const handleToggleGuard = (guardId: number) => {
    setSelectedGuards(prev =>
      prev.includes(guardId)
        ? prev.filter(id => id !== guardId)
        : [...prev, guardId]
    );
  };

  const handleAssign = () => {
    if (selectedGuards.length === 0 || !selectedSupervisor) {
      alert('Please select guards and a supervisor');
      return;
    }

    router.post(route('admin.guards.assign-supervisor'), {
      guard_ids: selectedGuards,
      supervisor_id: selectedSupervisor,
    }, {
      onSuccess: () => {
        setSelectedGuards([]);
        setSelectedSupervisor('');
      },
    });
  };

  const handleUnassign = () => {
    if (selectedGuards.length === 0) {
      alert('Please select guards to unassign');
      return;
    }

    if (confirm('Unassign selected guards from their supervisors?')) {
      router.post(route('admin.guards.unassign-supervisor'), {
        guard_ids: selectedGuards,
      }, {
        onSuccess: () => setSelectedGuards([]),
      });
    }
  };

  const unassignedGuards = guards.data.filter(g => !g.supervisor);
  const assignedGuards = guards.data.filter(g => g.supervisor);

  return (
    <AdminLayout title="Guard Assignments">
      <Head title="Guard Assignments" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Guard-Supervisor Assignments</h1>
          <p className="text-gray-600 dark:text-gray-300">Assign guards to supervisors for management</p>
        </div>

        {/* Assignment Controls */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm shadow-black/5 dark:shadow-none p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Bulk Assignment</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full sm:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
            >
              <option value="">Select Supervisor...</option>
              {supervisors.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} - {sup.employee_id}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={selectedGuards.length === 0 || !selectedSupervisor}
              className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-700 dark:disabled:text-gray-200 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              Assign ({selectedGuards.length})
            </button>
            <button
              onClick={handleUnassign}
              disabled={selectedGuards.length === 0}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-700 dark:disabled:text-gray-200 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              Unassign
            </button>
          </div>
        </div>

        {/* Unassigned Guards */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm shadow-black/5 dark:shadow-none overflow-hidden">
          <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Unassigned Guards ({unassignedGuards.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {unassignedGuards.map((guard) => (
              <GuardCard
                key={guard.id}
                guard={guard}
                selected={selectedGuards.includes(guard.id)}
                onToggle={() => handleToggleGuard(guard.id)}
              />
            ))}
          </div>
        </div>

        {/* Assigned Guards by Supervisor */}
        {supervisors.map((supervisor) => {
          const supervisorGuards = assignedGuards.filter(
            g => g.supervisor?.id === supervisor.id
          );

          if (supervisorGuards.length === 0) return null;

          return (
            <div key={supervisor.id} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm shadow-black/5 dark:shadow-none overflow-hidden">
              <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                      {supervisor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{supervisor.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{supervisorGuards.length} Guards</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {supervisorGuards.map((guard) => (
                  <GuardCard
                    key={guard.id}
                    guard={guard}
                    selected={selectedGuards.includes(guard.id)}
                    onToggle={() => handleToggleGuard(guard.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

interface GuardCardProps {
  guard: Guard;
  selected: boolean;
  onToggle: (id: number) => void;
}

function GuardCard({ guard, selected, onToggle }: GuardCardProps) {
  return (
    <div
      onClick={() => onToggle(guard.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(guard.id);
        }
      }}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected
          ? 'border-coin-500 bg-coin-50 dark:bg-coin-900/20 dark:border-coin-800'
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
      } focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
            {guard.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{guard.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id}</p>
          </div>
        </div>
        {selected && (
          <IconMapper name="CheckCircle" size={24} className="text-coin-700 dark:text-coin-300" />
        )}
      </div>
      
      {guard.current_assignment && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded p-2 text-xs">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            {guard.current_assignment.client_name}
          </p>
          <p className="text-blue-700 dark:text-blue-200">{guard.current_assignment.site_name}</p>
        </div>
      )}
    </div>
  );
}