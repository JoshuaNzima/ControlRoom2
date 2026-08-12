import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import Modal from '@/Components/Modal';
import IconMapper from '@/Components/IconMapper';

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

// Animated Counter
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span>{count.toLocaleString()}</span>;
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color }) => {
  const colorMap = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
  };
  
  const colors = colorMap[color];
  
  return (
    <div className={`${colors.bg} ${colors.border} rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02]`}>
      <div className={`${colors.icon} p-3 rounded-lg shadow-md w-fit`}>
        {icon}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          <AnimatedCounter value={value} />
        </p>
        <p className={`text-sm font-medium ${colors.text} mt-1`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

export default function Assignments({ guards, sites }: AssignmentsProps) {
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
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

  const assignedGuards = guards.filter(g => g.current_assignment);
  const unassignedGuards = guards.filter(g => !g.current_assignment);

  const openAssignModal = (guard: Guard) => {
    setSelectedGuard(guard);
    setFormData({
      client_site_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      assignment_type: 'permanent',
      notes: '',
    });
    setIsAssignModalOpen(true);
  };

  const openReassignModal = (guard: Guard) => {
    setSelectedGuard(guard);
    setFormData({
      client_site_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      assignment_type: guard.current_assignment?.assignment_type || 'permanent',
      notes: '',
    });
    setIsAssignModalOpen(true);
  };

  const openUnassignModal = (guard: Guard) => {
    setSelectedGuard(guard);
    setIsUnassignModalOpen(true);
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuard) return;
    
    setProcessing(true);
    router.post(route('supervisor.assignments.assign'), {
      guard_id: selectedGuard.id,
      ...formData,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsAssignModalOpen(false);
        setSelectedGuard(null);
      },
      onError: () => {
      },
      onFinish: () => setProcessing(false),
    });
  };

  const handleUnassign = () => {
    if (!selectedGuard?.current_assignment) return;
    
    setProcessing(true);
    router.delete(route('supervisor.assignments.unassign', { assignment: selectedGuard.current_assignment.id }), {
      preserveScroll: true,
      onSuccess: () => {
        setIsUnassignModalOpen(false);
        setSelectedGuard(null);
      },
      onError: () => {
      },
      onFinish: () => setProcessing(false),
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    }
  };

  return (
    <AuthenticatedLayout header="Guard Assignments">
      <Head title="Assignments" />

      <div className="min-h-screen bg-red-50 dark:bg-gray-900">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-800 via-red-700 to-rose-800 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="MapPin" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Guard Assignments</h1>
                  <p className="text-red-100 text-sm mt-1">Manage your team&apos;s site deployments</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<IconMapper name="Users" size={24} />}
              title="Total Guards"
              value={guards.length}
              subtitle="Under your supervision"
              color="blue"
            />
            <StatCard
              icon={<IconMapper name="UserCheck" size={24} />}
              title="Assigned"
              value={assignedGuards.length}
              subtitle="Active deployments"
              color="green"
            />
            <StatCard
              icon={<IconMapper name="UserX" size={24} />}
              title="Unassigned"
              value={unassignedGuards.length}
              subtitle="Need assignment"
              color="amber"
            />
            <StatCard
              icon={<IconMapper name="Building" size={24} />}
              title="Active Sites"
              value={sites.length}
              subtitle="Available for assignment"
              color="purple"
            />
          </div>

          {/* Unassigned Guards */}
          {unassignedGuards.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <IconMapper name="AlertCircle" size={20} className="text-amber-600 dark:text-amber-400" />
                  <h3 className="font-bold text-amber-900 dark:text-amber-100">
                    Unassigned Guards ({unassignedGuards.length})
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unassignedGuards.map((guard) => (
                    <div
                      key={guard.id}
                      className="p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-700 transition-all cursor-pointer"
                      onClick={() => openAssignModal(guard)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                            {guard.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{guard.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{guard.employee_id}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(guard.status)}>
                          {guard.status}
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-amber-600 dark:text-amber-400">Click to assign</span>
                        <Button size="sm" onClick={() => openAssignModal(guard)}>
                          <IconMapper name="Plus" size={16} className="mr-1" />
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Assigned Guards */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <IconMapper name="CheckCircle" size={20} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-emerald-900 dark:text-emerald-100">
                  Assigned Guards ({assignedGuards.length})
                </h3>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
              {assignedGuards.map((guard) => (
                <div key={guard.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {guard.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{guard.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id}</div>
                      </div>
                    </div>
                    <Badge 
                      className={guard.current_assignment?.assignment_type === 'permanent' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}
                    >
                      {guard.current_assignment?.assignment_type}
                    </Badge>
                  </div>
                  
                  <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {guard.current_assignment?.client_name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{guard.current_assignment?.site_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Since: {guard.current_assignment?.start_date}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openReassignModal(guard)}>
                      <IconMapper name="RefreshCw" size={16} className="mr-1" />
                      Reassign
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openUnassignModal(guard)}>
                      <IconMapper name="X" size={16} className="mr-1" />
                      Unassign
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Guard</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current Assignment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {assignedGuards.map((guard) => (
                    <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {guard.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{guard.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{guard.employee_id}</td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(guard.status)}>
                          {guard.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {guard.current_assignment?.client_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {guard.current_assignment?.site_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          className={guard.current_assignment?.assignment_type === 'permanent' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}
                        >
                          {guard.current_assignment?.assignment_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openReassignModal(guard)}>
                            <IconMapper name="RefreshCw" size={16} className="mr-1" />
                            Reassign
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => openUnassignModal(guard)}>
                            <IconMapper name="X" size={16} className="mr-1" />
                            Unassign
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {assignedGuards.length === 0 && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <IconMapper name="MapPin" size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No assigned guards</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Assign guards from the unassigned section above</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal show={isAssignModalOpen} onClose={() => !processing && setIsAssignModalOpen(false)} maxWidth="md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedGuard?.current_assignment ? 'Reassign' : 'Assign'} {selectedGuard?.name}
            </h2>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={processing}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <IconMapper name="X" size={20} />
            </button>
          </div>
        </div>
        <form onSubmit={handleAssign} className="p-6 space-y-4 bg-white dark:bg-gray-900">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client Site <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.client_site_id}
              onChange={(e) => setFormData({...formData, client_site_id: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">Select a site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, assignment_type: 'permanent'})}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  formData.assignment_type === 'permanent'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                }`}
              >
                <IconMapper name="CheckCircle" size={18} className="mx-auto mb-1" />
                Permanent
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, assignment_type: 'temporary'})}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  formData.assignment_type === 'temporary'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                }`}
              >
                <IconMapper name="Clock" size={18} className="mx-auto mb-1" />
                Temporary
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date {formData.assignment_type === 'temporary' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                min={formData.start_date}
                required={formData.assignment_type === 'temporary'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              placeholder="Add any relevant notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <><IconMapper name="Loader2" size={16} className="mr-2 animate-spin" /> Processing...</>
              ) : (
                <><IconMapper name="Check" size={16} className="mr-2" /> {selectedGuard?.current_assignment ? 'Reassign' : 'Assign'} Guard</>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Unassign Confirmation Modal */}
      <Modal show={isUnassignModalOpen} onClose={() => !processing && setIsUnassignModalOpen(false)} maxWidth="sm">
        <div className="p-6 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
            <IconMapper name="AlertTriangle" size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
            Unassign Guard?
          </h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
            Are you sure you want to unassign <strong>{selectedGuard?.name}</strong> from{' '}
            <strong>{selectedGuard?.current_assignment?.client_name} — {selectedGuard?.current_assignment?.site_name}</strong>?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsUnassignModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleUnassign}
              disabled={processing}
            >
              {processing ? (
                <><IconMapper name="Loader2" size={16} className="mr-2 animate-spin" /> Processing...</>
              ) : (
                'Yes, Unassign'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
