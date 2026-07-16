import React, { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { format, parseISO } from 'date-fns';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone: string | null;
  email: string | null;
  status: string;
  photo_url: string | null;
  grade: { code: string; name: string } | null;
  supervisor: { name: string } | null;
  sites: { site_name: string; client: { name: string } }[];
  refresher_training_records?: RefresherRecord[];
}

interface GuardDetails {
  id: number;
  name: string;
  employee_id: string;
  phone: string | null;
  email: string | null;
  status: string;
  photo_url: string | null;
  grade: { id: number; code: string; name: string } | null;
  supervisor: { id: number; name: string } | null;
  sites: { id: number; name: string; client: { id: number; name: string } | null }[];
  hire_date: string | null;
  years_of_service: number | null;
}

interface KPIs {
  attendance_rate: number;
  attendance_days: number;
  infraction_count: number;
  risk_level: 'normal' | 'warning' | 'high';
  days_since_infraction: number | null;
  training_completion_rate: number;
  total_trainings: number;
  completed_trainings: number;
}

interface Infraction {
  id: number;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: string;
  created_at: string;
}

interface RefresherRecord {
  id: number;
  refresher_id: number;
  status: 'in_progress' | 'completed' | 'passed' | 'failed' | 'dismissed' | 'promoted';
  training_date: string;
  completed_date: string | null;
  trainer_notes: string | null;
  refresher: {
    title: string;
    duration_hours: number;
  };
}

interface Refresher {
  id: number;
  title: string;
  duration_hours: number;
  validity_months: number;
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
  refreshers: Refresher[];
  activeRefresherRecords: Record<number, RefresherRecord[]>;
  filters: { search?: string; status?: string };
}

const statusConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  active: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'CheckCircle', label: 'Active' },
  inactive: { color: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', icon: 'Circle', label: 'Inactive' },
  suspended: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', icon: 'AlertCircle', label: 'Suspended' },
  terminated: { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40', icon: 'XCircle', label: 'Terminated' },
  in_progress: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', icon: 'Clock', label: 'In Progress' },
  completed: { color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40', icon: 'CheckCircle2', label: 'Completed' },
  passed: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'Award', label: 'Passed' },
  failed: { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40', icon: 'XCircle', label: 'Failed' },
  dismissed: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', icon: 'UserX', label: 'Dismissed' },
  promoted: { color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40', icon: 'TrendingUp', label: 'Promoted' },
};

const fieldClassName = 'w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-red-500 focus:border-red-500 transition-colors';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-all';
const btnDanger = 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-all active:scale-95';
const btnSuccess = 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all active:scale-95';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const config = statusConfig[status] || statusConfig.inactive;
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses}`}>
      <IconMapper name={config.icon} className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      {config.label}
    </span>
  );
}

function GuardAvatar({ guard, size = 'md' }: { guard: Guard; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  if (guard.photo_url) {
    return (
      <img
        src={guard.photo_url}
        alt={guard.name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-semibold shadow-sm`}>
      {getInitials(guard.name)}
    </div>
  );
}

export default function TrainerGuardsIndex() {
  const props = usePage<PageProps>().props;
  const auth = props.auth || { user: {} };
  const guards = props.guards || { data: [], current_page: 1, last_page: 1, total: 0 };
  const refreshers = props.refreshers || [];
  const activeRefresherRecords = props.activeRefresherRecords || {};
  const filters = props.filters || {};

  const [search, setSearch] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [showAddToRefresher, setShowAddToRefresher] = useState(false);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuardDetails, setShowGuardDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RefresherRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'grid' : 'list';
    }
    return 'list';
  });

  // Guard details modal state
  const [guardDetails, setGuardDetails] = useState<GuardDetails | null>(null);
  const [guardKPIs, setGuardKPIs] = useState<KPIs | null>(null);
  const [guardInfractions, setGuardInfractions] = useState<Infraction[]>([]);
  const [guardHistory, setGuardHistory] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [addForm, setAddForm] = useState({
    refresher_id: '',
    training_date: format(new Date(), 'yyyy-MM-dd'),
    trainer_notes: '',
  });

  const [evaluateForm, setEvaluateForm] = useState({
    status: 'passed' as 'passed' | 'failed' | 'promoted' | 'dismissed',
    trainer_notes: '',
    dismissal_reason: '',
  });

  const guardsWithActiveTraining = useMemo(() => {
    return guards.data.map(guard => ({
      ...guard,
      activeRecords: activeRefresherRecords[guard.id] || [],
    }));
  }, [guards.data, activeRefresherRecords]);

  const stats = useMemo(() => {
    const total = guards.total;
    const inTraining = guardsWithActiveTraining.filter(g => g.activeRecords.some(r => r.status === 'in_progress')).length;
    const completed = guardsWithActiveTraining.filter(g => g.activeRecords.some(r => r.status === 'completed')).length;
    const available = guardsWithActiveTraining.filter(g => g.status === 'active' && g.activeRecords.length === 0).length;
    return { total, inTraining, completed, available };
  }, [guards.total, guardsWithActiveTraining]);

  const handleAddToRefresher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuard) return;

    setLoading(true);
    router.post(route('training.trainer-guards.add-to-refresher'), {
      guard_id: selectedGuard.id,
      refresher_id: addForm.refresher_id,
      training_date: addForm.training_date,
      trainer_notes: addForm.trainer_notes,
    }, {
      onSuccess: () => {
        setShowAddToRefresher(false);
        setAddForm({
          refresher_id: '',
          training_date: format(new Date(), 'yyyy-MM-dd'),
          trainer_notes: '',
        });
        setSelectedGuard(null);
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setLoading(true);
    router.post(route('training.trainer-guards.evaluate', selectedRecord.id), evaluateForm, {
      onSuccess: () => {
        setShowEvaluate(false);
        setEvaluateForm({
          status: 'passed',
          trainer_notes: '',
          dismissal_reason: '',
        });
        setSelectedRecord(null);
        setSelectedGuard(null);
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const openEvaluateModal = (guard: Guard, record: RefresherRecord) => {
    setSelectedGuard(guard);
    setSelectedRecord(record);
    setEvaluateForm({
      status: 'passed',
      trainer_notes: record.trainer_notes || '',
      dismissal_reason: '',
    });
    setShowEvaluate(true);
  };

  const openAddModal = (guard: Guard) => {
    setSelectedGuard(guard);
    setAddForm({
      refresher_id: '',
      training_date: format(new Date(), 'yyyy-MM-dd'),
      trainer_notes: '',
    });
    setShowAddToRefresher(true);
  };

  const openHistoryModal = (guard: Guard) => {
    setSelectedGuard(guard);
    setShowHistory(true);
  };

  const openGuardDetailsModal = async (guard: Guard) => {
    setSelectedGuard(guard);
    setShowGuardDetails(true);
    setDetailsLoading(true);
    
    try {
      const response = await fetch(route('training.trainer-guards.details', guard.id));
      const data = await response.json();
      
      if (data.success) {
        setGuardDetails(data.guard);
        setGuardKPIs(data.kpis);
        setGuardInfractions(data.infractions);
        setGuardHistory(data.refresher_history);
      }
    } catch (error) {
      console.error('Failed to load guard details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeGuardDetailsModal = () => {
    setShowGuardDetails(false);
    setGuardDetails(null);
    setGuardKPIs(null);
    setGuardInfractions([]);
    setGuardHistory([]);
  };

  const handleSearch = () => {
    router.get(route('training.trainer-guards.index'), { search, status: statusFilter }, { preserveState: true });
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    router.get(route('training.trainer-guards.index'), {}, { preserveState: true });
  };

  return (
    <AuthenticatedLayout header="Refresher Guards" user={auth.user}>
      <Head title="Refresher Guards" />
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMapper name="UserCheck" className="h-7 w-7 text-red-600" />
              Refresher Guards
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage guards for refresher training and evaluations</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className={btnSecondary}
              title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            >
              <IconMapper name={viewMode === 'grid' ? 'List' : 'Grid3x3'} className="h-4 w-4" />
              <span className="hidden sm:inline">{viewMode === 'grid' ? 'List' : 'Grid'}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <IconMapper name="Users" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Guards</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <IconMapper name="CheckCircle" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.available}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <IconMapper name="Clock" className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inTraining}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">In Training</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <IconMapper name="Award" className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ready for Eval</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <IconMapper name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or employee ID..."
                className={`${fieldClassName} pl-10`}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={fieldClassName}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <button onClick={handleSearch} className={btnPrimary}>
                <IconMapper name="Search" className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
              {(search || statusFilter) && (
                <button onClick={clearFilters} className={btnSecondary} title="Clear filters">
                  <IconMapper name="X" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Guards Grid View (Mobile) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guardsWithActiveTraining.map((guard) => (
              <div key={guard.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <GuardAvatar guard={guard} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{guard.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{guard.employee_id}</p>
                      {guard.grade && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mt-1">
                          {guard.grade.code}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={guard.status} />
                  </div>

                  {/* Active Training Checklist */}
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Training Checklist</h4>
                    {guard.activeRecords.length > 0 ? (
                      <div className="space-y-2">
                        {guard.activeRecords.map((record) => (
                          <div key={record.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            {/* Checkbox style indicator */}
                            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              record.status === 'completed' || record.status === 'passed' || record.status === 'promoted'
                                ? 'bg-emerald-500 border-emerald-500'
                                : record.status === 'failed' || record.status === 'dismissed'
                                ? 'bg-rose-500 border-rose-500'
                                : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800'
                            }`}>
                              {(record.status === 'completed' || record.status === 'passed' || record.status === 'promoted') && (
                                <IconMapper name="Check" className="h-3.5 w-3.5 text-white" />
                              )}
                              {(record.status === 'failed' || record.status === 'dismissed') && (
                                <IconMapper name="X" className="h-3.5 w-3.5 text-white" />
                              )}
                              {record.status === 'in_progress' && (
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {record.refresher.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StatusBadge status={record.status} size="sm" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {record.refresher.duration_hours}h
                                </span>
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              {record.status === 'completed' && (
                                <button
                                  onClick={() => openEvaluateModal(guard, record)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Evaluate
                                </button>
                              )}
                              {record.status === 'in_progress' && (
                                <button
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    router.post(route('training.trainer-guards.complete', record.id), {}, {
                                      onSuccess: () => setSelectedRecord(null),
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-gray-500 dark:text-gray-400">
                        <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800" />
                        <span className="text-sm">No active training assigned</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => openGuardDetailsModal(guard)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <IconMapper name="Eye" className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => openHistoryModal(guard)}
                      className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="View history"
                    >
                      <IconMapper name="History" className="h-4 w-4" />
                    </button>
                    {guard.activeRecords.length === 0 && guard.status === 'active' && (
                      <button
                        onClick={() => openAddModal(guard)}
                        className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Add to refresher"
                      >
                        <IconMapper name="Plus" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guards List/Table View (Desktop) */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guard</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Training</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {guardsWithActiveTraining.map((guard) => (
                    <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <GuardAvatar guard={guard} size="md" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{guard.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{guard.employee_id}</div>
                            {guard.grade && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 mt-0.5">
                                {guard.grade.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={guard.status} />
                      </td>
                      <td className="px-4 py-3">
                        {guard.activeRecords.length > 0 ? (
                          <div className="space-y-1.5">
                            {guard.activeRecords.map((record) => (
                              <div key={record.id} className="flex items-center gap-2">
                                <StatusBadge status={record.status} size="sm" />
                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                  {record.refresher.title}
                                </span>
                                {record.status === 'completed' && (
                                  <button
                                    onClick={() => openEvaluateModal(guard, record)}
                                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                  >
                                    Evaluate
                                  </button>
                                )}
                                {record.status === 'in_progress' && (
                                  <button
                                    onClick={() => {
                                      setSelectedRecord(record);
                                      router.post(route('training.trainer-guards.complete', record.id), {}, {
                                        onSuccess: () => setSelectedRecord(null),
                                      });
                                    }}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openGuardDetailsModal(guard)}
                            className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View details"
                          >
                            <IconMapper name="Eye" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openHistoryModal(guard)}
                            className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View history"
                          >
                            <IconMapper name="History" className="h-4 w-4" />
                          </button>
                          {guard.activeRecords.length === 0 && guard.status === 'active' && (
                            <button
                              onClick={() => openAddModal(guard)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Add to refresher"
                            >
                              <IconMapper name="Plus" className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {guards.data.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <IconMapper name="Search" className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No guards found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
            {(search || statusFilter) && (
              <button onClick={clearFilters} className={`${btnSecondary} mt-4`}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Pagination - Mobile: Simple prev/next only, Desktop: Full pagination */}
        {guards.last_page > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
              Page {guards.current_page} of {guards.last_page}
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <a
                href={guards.current_page > 1 ? route('training.trainer-guards.index', { page: guards.current_page - 1, search, status: statusFilter }) : '#'}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  guards.current_page > 1
                    ? 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                onClick={(e) => guards.current_page <= 1 && e.preventDefault()}
              >
                <IconMapper name="ChevronLeft" className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Previous</span>
              </a>
              
              {/* Page numbers - hidden on mobile, visible on sm+ */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, guards.last_page) }, (_, i) => {
                  let page: number;
                  if (guards.last_page <= 5) {
                    page = i + 1;
                  } else if (guards.current_page <= 3) {
                    page = i + 1;
                  } else if (guards.current_page >= guards.last_page - 2) {
                    page = guards.last_page - 4 + i;
                  } else {
                    page = guards.current_page - 2 + i;
                  }
                  return (
                    <a
                      key={page}
                      href={route('training.trainer-guards.index', { page, search, status: statusFilter })}
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === guards.current_page
                          ? 'bg-red-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </a>
                  );
                })}
              </div>
              
              <a
                href={guards.current_page < guards.last_page ? route('training.trainer-guards.index', { page: guards.current_page + 1, search, status: statusFilter }) : '#'}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  guards.current_page < guards.last_page
                    ? 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                onClick={(e) => guards.current_page >= guards.last_page && e.preventDefault()}
              >
                <span className="hidden sm:inline">Next</span>
                <IconMapper name="ChevronRight" className="h-4 w-4 sm:ml-1" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Add to Refresher Modal */}
      {showAddToRefresher && selectedGuard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
                  <IconMapper name="Plus" className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add to Refresher</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedGuard.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddToRefresher(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddToRefresher} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Refresher <span className="text-red-500">*</span>
                </label>
                <select
                  value={addForm.refresher_id}
                  onChange={(e) => setAddForm({ ...addForm, refresher_id: e.target.value })}
                  className={fieldClassName}
                  required
                >
                  <option value="">Choose a refresher...</option>
                  {refreshers.map((refresher) => (
                    <option key={refresher.id} value={refresher.id}>
                      {refresher.title} ({refresher.duration_hours}h)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Training Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={addForm.training_date}
                  onChange={(e) => setAddForm({ ...addForm, training_date: e.target.value })}
                  className={fieldClassName}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Trainer Notes
                </label>
                <textarea
                  value={addForm.trainer_notes}
                  onChange={(e) => setAddForm({ ...addForm, trainer_notes: e.target.value })}
                  className={fieldClassName}
                  rows={3}
                  placeholder="Optional notes about the training..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddToRefresher(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={loading || !addForm.refresher_id} className={`${btnPrimary} flex-1`}>
                  {loading ? (
                    <>
                      <IconMapper name="Loader2" className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <IconMapper name="Plus" className="h-4 w-4" />
                      Add to Training
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluate Modal */}
      {showEvaluate && selectedGuard && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                  <IconMapper name="Award" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Evaluate Guard</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedGuard.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEvaluate(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEvaluate} className="p-5 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Refresher</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedRecord.refresher.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Evaluation Result <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'passed', label: 'Passed', icon: 'CheckCircle', color: 'emerald' },
                    { value: 'promoted', label: 'Promoted', icon: 'TrendingUp', color: 'green' },
                    { value: 'failed', label: 'Failed', icon: 'XCircle', color: 'rose' },
                    { value: 'dismissed', label: 'Dismissed', icon: 'UserX', color: 'red' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEvaluateForm({ ...evaluateForm, status: option.value as any })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        evaluateForm.status === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/30 text-${option.color}-700 dark:text-${option.color}-400`
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <IconMapper name={option.icon} className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {(evaluateForm.status === 'failed' || evaluateForm.status === 'dismissed') && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Dismissal Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={evaluateForm.dismissal_reason}
                    onChange={(e) => setEvaluateForm({ ...evaluateForm, dismissal_reason: e.target.value })}
                    className={`${fieldClassName} border-rose-300 dark:border-rose-700`}
                    rows={3}
                    required
                    placeholder="Reason for dismissal/failure..."
                  />
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                    <IconMapper name="AlertTriangle" className="h-3.5 w-3.5" />
                    This will terminate the guard&apos;s employment
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Evaluation Notes
                </label>
                <textarea
                  value={evaluateForm.trainer_notes}
                  onChange={(e) => setEvaluateForm({ ...evaluateForm, trainer_notes: e.target.value })}
                  className={fieldClassName}
                  rows={3}
                  placeholder="Performance notes, observations, recommendations..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEvaluate(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 ${evaluateForm.status === 'dismissed' || evaluateForm.status === 'failed' ? btnDanger : btnSuccess}`}
                >
                  {loading ? (
                    <>
                      <IconMapper name="Loader2" className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconMapper name="CheckCircle" className="h-4 w-4" />
                      Submit Evaluation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && selectedGuard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <GuardAvatar guard={selectedGuard} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training History</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedGuard.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              {selectedGuard.refresher_training_records && selectedGuard.refresher_training_records.length > 0 ? (
                <div className="space-y-3">
                  {selectedGuard.refresher_training_records.map((record) => (
                    <div key={record.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="mt-0.5">
                        <StatusBadge status={record.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">{record.refresher.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(parseISO(record.training_date), 'MMM d, yyyy')}
                          {record.completed_date && ` → ${format(parseISO(record.completed_date), 'MMM d, yyyy')}`}
                        </p>
                        {record.trainer_notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">&quot;{record.trainer_notes}&quot;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                    <IconMapper name="History" className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No training history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Guard Details Modal with KPIs */}
      {showGuardDetails && selectedGuard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <GuardAvatar guard={selectedGuard} size="lg" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedGuard.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{selectedGuard.employee_id}</span>
                    {selectedGuard.grade && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {selectedGuard.grade.code}
                      </span>
                    )}
                    <StatusBadge status={selectedGuard.status} size="sm" />
                  </div>
                </div>
              </div>
              <button
                onClick={closeGuardDetailsModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <IconMapper name="Loader2" className="h-8 w-8 animate-spin text-red-600" />
                </div>
              ) : (
                <>
                  {/* KPI Cards */}
                  {guardKPIs && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Attendance Rate */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <IconMapper name="CalendarCheck" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Attendance</span>
                        </div>
                        <p className={`text-xl font-bold ${guardKPIs.attendance_rate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : guardKPIs.attendance_rate >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {guardKPIs.attendance_rate}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{guardKPIs.attendance_days}/30 days</p>
                      </div>

                      {/* Training Completion */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <IconMapper name="GraduationCap" className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Training</span>
                        </div>
                        <p className={`text-xl font-bold ${guardKPIs.training_completion_rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : guardKPIs.training_completion_rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {guardKPIs.training_completion_rate}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{guardKPIs.completed_trainings}/{guardKPIs.total_trainings} done</p>
                      </div>

                      {/* Infractions */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <IconMapper name="AlertTriangle" className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Infractions</span>
                        </div>
                        <p className={`text-xl font-bold ${guardKPIs.infraction_count === 0 ? 'text-emerald-600 dark:text-emerald-400' : guardKPIs.infraction_count <= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {guardKPIs.infraction_count}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {guardKPIs.days_since_infraction !== null 
                            ? `${guardKPIs.days_since_infraction}d since last` 
                            : 'No recent'}
                        </p>
                      </div>

                      {/* Risk Level */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <IconMapper name="ShieldAlert" className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Risk Level</span>
                        </div>
                        <p className={`text-xl font-bold capitalize ${
                          guardKPIs.risk_level === 'normal' ? 'text-emerald-600 dark:text-emerald-400' : 
                          guardKPIs.risk_level === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
                          'text-rose-600 dark:text-rose-400'
                        }`}>
                          {guardKPIs.risk_level}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Last 3 months</p>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {guardDetails && (
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <IconMapper name="User" className="h-4 w-4" />
                        Contact Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {guardDetails.phone && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <IconMapper name="Phone" className="h-4 w-4" />
                            {guardDetails.phone}
                          </div>
                        )}
                        {guardDetails.email && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <IconMapper name="Mail" className="h-4 w-4" />
                            {guardDetails.email}
                          </div>
                        )}
                        {guardDetails.supervisor && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <IconMapper name="UserCheck" className="h-4 w-4" />
                            Supervisor: {guardDetails.supervisor.name}
                          </div>
                        )}
                        {guardDetails.years_of_service !== null && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <IconMapper name="Clock" className="h-4 w-4" />
                            {guardDetails.years_of_service} years of service
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Active Sites */}
                  {guardDetails && guardDetails.sites.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <IconMapper name="MapPin" className="h-4 w-4" />
                        Assigned Sites
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {guardDetails.sites.map((site) => (
                          <span key={site.id} className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm">
                            {site.name}
                            {site.client && (
                              <span className="ml-1 text-blue-600 dark:text-blue-500">({site.client.name})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Infractions */}
                  {guardInfractions.length > 0 && (
                    <div className="border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 bg-rose-50 dark:bg-rose-900/20">
                      <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-400 mb-3 flex items-center gap-2">
                        <IconMapper name="AlertTriangle" className="h-4 w-4" />
                        Active Infractions ({guardInfractions.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {guardInfractions.map((infraction) => (
                          <div key={infraction.id} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              infraction.severity === 'high' ? 'bg-rose-500' : 
                              infraction.severity === 'medium' ? 'bg-amber-500' : 'bg-yellow-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{infraction.type}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{infraction.description}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {format(parseISO(infraction.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Training History Preview */}
                  {guardHistory.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <IconMapper name="History" className="h-4 w-4" />
                        Recent Training History
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {guardHistory.slice(0, 5).map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={record.status} size="sm" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                {record.refresher.title}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {format(parseISO(record.training_date), 'MMM yyyy')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </AuthenticatedLayout>
  );
}
