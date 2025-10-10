import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { UserCircle, CheckCircle } from 'lucide-react';

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
          <h1 className="text-2xl font-bold text-gray-900">Guard-Supervisor Assignments</h1>
          <p className="text-gray-600">Assign guards to supervisors for management</p>
        </div>

        {/* Assignment Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Bulk Assignment</h3>
          <div className="flex gap-4">
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
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
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
            >
              Assign ({selectedGuards.length})
            </button>
            <button
              onClick={handleUnassign}
              disabled={selectedGuards.length === 0}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
            >
              Unassign
            </button>
          </div>
        </div>

        {/* Unassigned Guards */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-yellow-50 border-b">
            <h3 className="font-bold text-gray-900">
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
            <div key={supervisor.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-red-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                      {supervisor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{supervisor.name}</h3>
                      <p className="text-sm text-gray-600">{supervisorGuards.length} Guards</p>
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
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
            {guard.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{guard.name}</h4>
            <p className="text-xs text-gray-500">{guard.employee_id}</p>
          </div>
        </div>
        {selected && (
          <CheckCircle size={24} className="text-indigo-600" />
        )}
      </div>
      
      {guard.current_assignment && (
        <div className="bg-blue-50 rounded p-2 text-xs">
          <p className="font-medium text-blue-900">
            {guard.current_assignment.client_name}
          </p>
          <p className="text-blue-700">{guard.current_assignment.site_name}</p>
        </div>
      )}
    </div>
  );
}