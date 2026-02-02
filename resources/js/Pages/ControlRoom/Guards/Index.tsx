import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import GuardForm from '@/Components/Guards/GuardForm';
import AssignSiteModal from '@/Components/Guards/AssignSiteModal';

type Guard = {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  is_profile_complete?: boolean;
  profile_missing_fields?: string[];
  supervisor?: { id: number; name: string } | null;
  today_attendance?: { check_in?: string | null; check_out?: string | null; status?: string | null; source?: string | null } | null;
  active_assignment?: { site_id?: number | null; site_name?: string | null; client_name?: string | null } | null;
};

type PageProps = {
  guards?: { data: Guard[]; links?: any; meta?: any };
  filters?: { search?: string; status?: string; profile_status?: string; zone_id?: string; grade_id?: string; on_duty?: any; sort?: string; dir?: string; per_page?: any };
  supervisors?: Array<{ id: number; name: string }>;
  clients?: Array<{ id: number; name: string }>;
  grades?: Array<{ id: number; code: string; name: string }>;
  zones?: Array<{ id: number; name: string }>;
  canAssignSupervisor?: boolean;
};

export default function GuardsIndex() {
  const { guards: guardsProp = { data: [], links: [], meta: {} }, filters = {}, supervisors = [], clients = [], grades = [], zones = [], canAssignSupervisor = false } = usePage<PageProps>().props as any;
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState<string>(filters.status || '');
  const [profileStatus, setProfileStatus] = useState<string>(filters.profile_status || '');
  const [zoneId, setZoneId] = useState<string>(filters.zone_id || '');
  const [clientId, setClientId] = useState<string>((filters as any).client_id || '');
  const [gradeId, setGradeId] = useState<string>(filters.grade_id || '');
  const [onDuty, setOnDuty] = useState<boolean>(filters.on_duty === '1' || filters.on_duty === 1 || filters.on_duty === true || filters.on_duty === 'true');
  const [sort, setSort] = useState<string>(() => {
    if (filters.sort) return filters.sort;
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('controlRoom.guards.sort');
      return saved || 'name';
    }
    return 'name';
  });
  const [dir, setDir] = useState<'asc' | 'desc'>(() => {
    if (filters.dir === 'desc') return 'desc';
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('controlRoom.guards.dir');
      return saved === 'desc' ? 'desc' : 'asc';
    }
    return 'asc';
  });
  const [perPage, setPerPage] = useState<string>(() => {
    if (filters.per_page) return String(filters.per_page);
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('controlRoom.guards.perPage');
      return saved || '20';
    }
    return '20';
  });

  const canMarkAbsent = (g: Guard) => {
    if (!g.today_attendance) return true;
    if (g.today_attendance.check_in) return false;
    if (g.today_attendance.status === 'absent') return false;
    return true;
  };

  const canMarkPresent = (g: Guard) => {
    if (!g.today_attendance) return true;
    if (g.today_attendance.check_in) return false;
    if (g.today_attendance.status === 'present') return false;
    return true;
  };

  const markPresent = (g: Guard) => {
    if (!confirm(`Mark ${g.name} as present for today?`)) return;
    router.post(route('control-room.attendance.mark-present'), {
      guard_id: g.id,
      client_site_id: g.active_assignment?.site_id || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => router.reload(),
    });
  };

  const markAbsent = (g: Guard) => {
    if (!confirm(`Mark ${g.name} as absent for today?`)) return;
    router.post(route('control-room.attendance.mark-absent'), {
      guard_id: g.id,
    }, {
      preserveScroll: true,
      onSuccess: () => router.reload(),
    });
  };

  const applyFilters = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: status || undefined,
      profile_status: profileStatus || undefined,
      zone_id: zoneId || undefined,
      client_id: clientId || undefined,
      grade_id: gradeId || undefined,
      on_duty: onDuty ? 1 : undefined,
      sort,
      dir,
      per_page: perPage,
    };
    router.get(route('control-room.guards'), query, { preserveState: true, preserveScroll: true });
  };

  const resetFilters = () => {
    setSearch(''); setStatus(''); setProfileStatus(''); setZoneId(''); setClientId(''); setGradeId(''); setOnDuty(false); setSort('name'); setDir('asc'); setPerPage('20');
    router.get(route('control-room.guards'), {}, { preserveState: true, preserveScroll: true });
  };
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [currentGuardId, setCurrentGuardId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorsCreate, setErrorsCreate] = useState<Record<string, string>>({});
  const [showSupervisor, setShowSupervisor] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
  const [selectedGuardIds, setSelectedGuardIds] = useState<number[]>([]);
  const [bulkCoverOpen, setBulkCoverOpen] = useState(false);
  const [bulkCoverNotes, setBulkCoverNotes] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState<number | null>(null);

  const canBulkCover = !!clientId || !!zoneId;

  const bulkMarkCovered = () => {
    if (!canBulkCover) return;
    router.post(route('control-room.attendance.mark-covered'), {
      client_id: clientId ? Number(clientId) : undefined,
      zone_id: zoneId ? Number(zoneId) : undefined,
      notes: bulkCoverNotes || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => { setBulkCoverOpen(false); setBulkCoverNotes(''); router.reload(); },
    });
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('controlRoom.guards.sort', sort);
    window.localStorage.setItem('controlRoom.guards.dir', dir);
    window.localStorage.setItem('controlRoom.guards.perPage', perPage);
  }, [sort, dir, perPage]);

  const toggleGuardSelected = (id: number) => {
    setSelectedGuardIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const idsOnPage = guardsProp.data.map((g: Guard) => g.id);
    const allSelected = idsOnPage.every((id: number) => selectedGuardIds.includes(id));
    if (allSelected) {
      setSelectedGuardIds(prev => prev.filter(id => !idsOnPage.includes(id)));
    } else {
      setSelectedGuardIds(prev => Array.from(new Set([...prev, ...idsOnPage])));
    }
  };

  const handleExport = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: status || undefined,
      profile_status: profileStatus || undefined,
      zone_id: zoneId || undefined,
      grade_id: gradeId || undefined,
      on_duty: onDuty ? 1 : undefined,
      sort,
      dir,
    };
    const url = route('control-room.guards.export', query);
    window.location.href = url;
  };

  const openView = async (id: number) => {
    setViewLoading(id);
    try {
      const res = await fetch(route('control-room.guards.json', { guard: id }), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setViewData(json);
      setViewOpen(true);
    } catch (e) {
      // no-op
    } finally {
      setViewLoading(null);
    }
  };

  return (
    <ControlRoomLayout title="Guards">
      <Head title="Guards" />

      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Guards Management"
          description="Control Room scoped guard list and quick actions"
          actions={(
            <>
              <button
                onClick={() => (window.location.href = route('control-room.assignments.index'))}
                className="w-full sm:w-auto px-4 py-2 bg-coin-600 text-white rounded"
              >
                Manage Assignments
              </button>
              <Link href={route('control-room.clients')} className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800">
                Clients
              </Link>
              <button
                onClick={() => setShowAdd(true)}
                className="w-full sm:w-auto px-4 py-2 bg-coin-700 hover:bg-coin-800 text-white rounded"
              >
                Add Guard
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="w-full sm:w-auto px-4 py-2 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900"
              >
                Export CSV
              </button>
            </>
          )}
        />

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-8 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 dark:text-gray-500"><IconMapper name="Search" size={20} /></span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  placeholder="Name or Employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile</label>
              <select value={profileStatus} onChange={(e) => setProfileStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                <option value="complete">Complete</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zone</label>
              <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {zones.map((z: any) => (<option key={z.id} value={z.id}>{z.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {clients.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grade</label>
              <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {grades.map((g: any) => (<option key={g.id} value={g.id}>{g.code ?? g.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">On Duty</label>
              <div className="flex items-center h-[42px]">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={onDuty} onChange={(e) => setOnDuty(e.target.checked)} className="rounded border-gray-300 dark:border-gray-700" />
                  Currently on duty
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <button onClick={applyFilters} className="w-full sm:w-auto px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded">Apply</button>
              <button onClick={resetFilters} className="w-full sm:w-auto px-4 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
              <button
                type="button"
                disabled={!canBulkCover}
                onClick={() => setBulkCoverOpen(true)}
                className={`w-full sm:w-auto px-4 py-2 rounded text-white ${canBulkCover ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                Mark Covered
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
              <div className="flex items-center gap-2">
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  <option value="name">Name</option>
                  <option value="employee_id">Employee ID</option>
                  <option value="status">Status</option>
                  <option value="supervisor_id">Supervisor</option>
                </select>
                <button onClick={() => setDir(d => d === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 rounded border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                  {dir === 'asc' ? 'Asc' : 'Desc'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Per Page</label>
              <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="w-32 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {['10','20','50','100'].map(n => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          {guardsProp.data.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No guards found"
                description="Try adjusting your filters or search terms."
                size="sm"
                contentClassName="px-0"
              />
            </div>
          ) : (
            <>
              <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
                <div className="p-4 flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900"
                      checked={guardsProp.data.length > 0 && guardsProp.data.every((g: Guard) => selectedGuardIds.includes(g.id))}
                      onChange={toggleSelectAll}
                    />
                    <span>Select all on page</span>
                  </label>
                  {selectedGuardIds.length > 0 ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{selectedGuardIds.length} selected</div>
                  ) : null}
                </div>

                {guardsProp.data.map((g: Guard) => (
                  <div key={g.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <label className="inline-flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900"
                          checked={selectedGuardIds.includes(g.id)}
                          onChange={() => toggleGuardSelected(g.id)}
                        />
                        <span className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{g.name}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">{g.employee_id}</div>
                          {g.is_profile_complete === false ? (
                            <div className="mt-2">
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs">
                                Profile incomplete
                              </span>
                            </div>
                          ) : null}
                        </span>
                      </label>

                      <span className={`px-2 py-1 text-xs rounded-full ${
                        g.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        g.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      }`}>
                        {g.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Supervisor</div>
                        <div className="text-gray-700 dark:text-gray-200 break-words">{g.supervisor?.name || '-'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Assignment</div>
                        <div className="text-gray-700 dark:text-gray-200 break-words">
                          {g.active_assignment ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-coin-50 text-coin-800 border border-coin-200 dark:bg-gray-900/40 dark:text-coin-200 dark:border-gray-800">
                              <span className="font-medium">{g.active_assignment.client_name || 'Client'}</span>
                              <span className="text-xs text-coin-700 dark:text-coin-300">• {g.active_assignment.site_name || 'Site'}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                        <div className="text-gray-700 dark:text-gray-200">
                          {g.today_attendance ? (
                            <span>{g.today_attendance.check_in || '--:--'} → {g.today_attendance.check_out || '--:--'}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">No entry</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => { setCurrentGuardId(g.id); setShowAssign(true); }}
                        className="p-2 rounded bg-coin-700 hover:bg-coin-800 text-white"
                        title="Assign Site"
                        aria-label="Assign Site"
                      >
                        <IconMapper name="MapPin" size={18} />
                      </button>
                      <button
                        onClick={() => markPresent(g)}
                        className={`p-2 rounded text-white disabled:opacity-60 ${canMarkPresent(g) ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'}`}
                        title={canMarkPresent(g) ? 'Mark Present' : (g.today_attendance?.check_in ? 'Already checked in' : 'Already present')}
                        aria-label="Mark Present"
                        disabled={!canMarkPresent(g)}
                      >
                        <IconMapper name="CheckCircle" size={18} />
                      </button>
					  <button
						onClick={() => markAbsent(g)}
						className={`p-2 rounded text-white disabled:opacity-60 ${canMarkAbsent(g) ? 'bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600' : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'}`}
						title={canMarkAbsent(g) ? 'Mark Absent' : (g.today_attendance?.check_in ? 'Already checked in' : 'Already absent')}
						aria-label="Mark Absent"
						disabled={!canMarkAbsent(g)}
					  >
						<IconMapper name="XCircle" size={18} />
					  </button>
                      <button
                        onClick={() => openView(g.id)}
                        className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 border dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-700"
                        title="View Details"
                        aria-label="View Details"
                        disabled={viewLoading === g.id}
                      >
                        {viewLoading === g.id ? '...' : <IconMapper name="Eye" size={18} />}
                      </button>
                      {canAssignSupervisor && (
                        <button
                          onClick={() => { setCurrentGuardId(g.id); setSelectedSupervisorId(''); setShowSupervisor(true); }}
                          className="p-2 rounded bg-gray-800 hover:bg-gray-900 text-white"
                          title="Assign Supervisor"
                          aria-label="Assign Supervisor"
                        >
                          <IconMapper name="UserPlus" size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-[1100px] w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900"
                          checked={guardsProp.data.length > 0 && guardsProp.data.every((g: Guard) => selectedGuardIds.includes(g.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Supervisor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Assignment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Today</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {guardsProp.data.map((g: Guard) => (
                      <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900"
                            checked={selectedGuardIds.includes(g.id)}
                            onChange={() => toggleGuardSelected(g.id)}
                          />
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <span>{g.name}</span>
                            {g.is_profile_complete === false ? (
                              <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs">
                                Profile incomplete
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{g.employee_id}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            g.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                            g.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          }`}>
                            {g.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{g.supervisor?.name || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {g.active_assignment ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-coin-50 text-coin-800 border border-coin-200 dark:bg-gray-900/40 dark:text-coin-200 dark:border-gray-800">
                              <span className="font-medium">{g.active_assignment.client_name || 'Client'}</span>
                              <span className="text-xs text-coin-700 dark:text-coin-300">• {g.active_assignment.site_name || 'Site'}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {g.today_attendance ? (
                            <span>
                              {g.today_attendance.check_in || '--:--'} → {g.today_attendance.check_out || '--:--'}
                            </span>
                          ) : <span className="text-gray-400 dark:text-gray-500">No entry</span>}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => { setCurrentGuardId(g.id); setShowAssign(true); }}
                              className="p-2 rounded bg-coin-700 hover:bg-coin-800 text-white"
                              title="Assign Site"
                              aria-label="Assign Site"
                            >
                              <IconMapper name="MapPin" size={18} />
                            </button>
                            <button
                              onClick={() => markPresent(g)}
                              className={`p-2 rounded text-white disabled:opacity-60 ${canMarkPresent(g) ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'}`}
                              title={canMarkPresent(g) ? 'Mark Present' : (g.today_attendance?.check_in ? 'Already checked in' : 'Already present')}
                              aria-label="Mark Present"
                              disabled={!canMarkPresent(g)}
                            >
                              <IconMapper name="CheckCircle" size={18} />
                            </button>
						<button
							onClick={() => markAbsent(g)}
							className={`p-2 rounded text-white disabled:opacity-60 ${canMarkAbsent(g) ? 'bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600' : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'}`}
							title={canMarkAbsent(g) ? 'Mark Absent' : (g.today_attendance?.check_in ? 'Already checked in' : 'Already absent')}
							aria-label="Mark Absent"
							disabled={!canMarkAbsent(g)}
						>
							<IconMapper name="XCircle" size={18} />
						</button>
                            <button
                              onClick={() => openView(g.id)}
                              className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 border dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-700"
                              title="View Details"
                              aria-label="View Details"
                              disabled={viewLoading === g.id}
                            >
                              {viewLoading === g.id ? '...' : <IconMapper name="Eye" size={18} />}
                            </button>
                            {canAssignSupervisor && (
                              <button
                                onClick={() => { setCurrentGuardId(g.id); setSelectedSupervisorId(''); setShowSupervisor(true); }}
                                className="p-2 rounded bg-gray-800 hover:bg-gray-900 text-white"
                                title="Assign Supervisor"
                                aria-label="Assign Supervisor"
                              >
                                <IconMapper name="UserPlus" size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {/* Pagination */}
          {guardsProp?.links && (
            <div className="p-4 border-t dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {guardsProp?.meta?.current_page ?? ''} of {guardsProp?.meta?.last_page ?? ''}
              </div>
              {selectedGuardIds.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedGuardIds.length} selected
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {guardsProp.links.filter((l: any) => l.url !== null).map((l: any, idx: number) => (
                  <button
                    key={idx}
                    className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                    onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Add Guard Modal */}
        <Modal show={showAdd} onClose={() => setShowAdd(false)} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Guard</h2>
            <GuardForm
              initialData={{ status: 'active', guard_type: 'permanent' } as any}
              supervisors={supervisors}
              grades={grades}
              onSubmit={(form: any) => {
                setSaving(true);
                setErrorsCreate({});
                router.post(route('control-room.guards.store'), form, {
                  preserveScroll: true,
                  forceFormData: true,
                  onFinish: () => setSaving(false),
                  onSuccess: () => { setShowAdd(false); },
                  onError: (errs: any) => setErrorsCreate(errs as Record<string, string>),
                });
              }}
              canAssignSupervisor={!!canAssignSupervisor}
              processing={saving}
              errors={errorsCreate}
              hideCancel={false}
              onCancel={() => setShowAdd(false)}
            />
          </div>
        </Modal>

        {/* View Guard Details Modal */}
        <Modal show={viewOpen} onClose={() => { setViewOpen(false); setViewData(null); }} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <div className="flex items-start gap-4">
              {viewData?.photo_url ? (
                <img src={viewData.photo_url} alt={viewData?.name || 'Guard'} className="w-24 h-24 rounded object-cover border dark:border-gray-700" />
              ) : (
                <div className="w-24 h-24 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300">No Photo</div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{viewData?.name}</h2>
                <div className="text-sm text-gray-600 dark:text-gray-300">Employee ID: {viewData?.employee_id}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{viewData?.status}</span>
                  {viewData?.guard_type && <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{viewData.guard_type}</span>}
                  {viewData?.grade?.name && <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{viewData.grade.name}</span>}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.phone || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.email || '-'}</span></div>
              <div className="md:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Address:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.address || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Residence:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.residence_address || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">District:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.residence_district || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">DOB / Gender:</span> <span className="text-gray-900 dark:text-gray-100">{[viewData?.date_of_birth, viewData?.gender].filter(Boolean).join(' • ') || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">ID Number:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.id_number || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Supervisor:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.supervisor?.name || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Zone:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.zone?.name || '-'}</span></div>
              <div className="md:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Emergency Contact:</span> <span className="text-gray-900 dark:text-gray-100">{[viewData?.emergency_contact_name, viewData?.emergency_contact_phone].filter(Boolean).join(' • ') || '-'}</span></div>
              <div className="md:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Next of Kin:</span> <span className="text-gray-900 dark:text-gray-100">{[viewData?.next_of_kin_name, viewData?.next_of_kin_relationship, viewData?.next_of_kin_phone].filter(Boolean).join(' • ') || '-'}</span></div>
              <div className="md:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Children:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.children_names || '-'}</span></div>
            </div>

            {viewData?.attendance_tally ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Attendance (This Month)</h3>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                    <div className="text-xs text-gray-500">Present</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">{viewData.attendance_tally.by_status?.present ?? 0}</div>
                  </div>
                  <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                    <div className="text-xs text-gray-500">Absent</div>
                    <div className="mt-1 text-lg font-semibold text-red-700 dark:text-red-400">{viewData.attendance_tally.by_status?.absent ?? 0}</div>
                  </div>
                  <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                    <div className="text-xs text-gray-500">Late</div>
                    <div className="mt-1 text-lg font-semibold text-yellow-700 dark:text-yellow-400">{viewData.attendance_tally.by_status?.late ?? 0}</div>
                  </div>
                  <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                    <div className="text-xs text-gray-500">Half Day</div>
                    <div className="mt-1 text-lg font-semibold text-orange-700 dark:text-orange-400">{viewData.attendance_tally.by_status?.half_day ?? 0}</div>
                  </div>
                  <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                    <div className="text-xs text-gray-500">Leave</div>
                    <div className="mt-1 text-lg font-semibold text-sky-700 dark:text-sky-400">{viewData.attendance_tally.by_status?.leave ?? 0}</div>
                  </div>
                  <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                    <div className="text-xs text-gray-500">Hours</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {Number(viewData.attendance_tally.hours_worked ?? 0).toFixed(1)}
                      {Number(viewData.attendance_tally.overtime_hours ?? 0) > 0 ? (
                        <span className="ml-2 text-xs text-gray-500">OT {Number(viewData.attendance_tally.overtime_hours ?? 0).toFixed(1)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Range: {viewData.attendance_tally.range?.start} → {viewData.attendance_tally.range?.end}
                </div>
              </div>
            ) : null}
            {Array.isArray(viewData?.assignments) && viewData.assignments.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assignments</h3>
                <div className="mt-2 space-y-2">
                  {viewData.assignments.map((a: any) => (
                    <div key={a.id} className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-medium">{a.site?.client?.name || 'Client'} - {a.site?.name || 'Site'}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{a.start_date} {a.end_date ? `→ ${a.end_date}` : ''} {a.is_active ? '• Active' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => { setViewOpen(false); setViewData(null); }} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Close</button>
            </div>
          </div>
        </Modal>

        {/* Assign Site Modal */}
        <AssignSiteModal
          open={showAssign}
          guardId={currentGuardId}
          zones={zones}
          currentAssignment={guardsProp.data.find((g: Guard) => g.id === currentGuardId)?.active_assignment || null}
          onClose={() => { setShowAssign(false); setCurrentGuardId(null); }}
          onSuccess={() => router.reload()}
        />

        <Modal show={bulkCoverOpen} onClose={() => setBulkCoverOpen(false)} maxWidth="md">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mark Covered</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Marks all guards currently on shift for the selected Client/Zone as present.
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  <option value="">All</option>
                  {clients.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zone</label>
                <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  <option value="">All</option>
                  {zones.map((z: any) => (<option key={z.id} value={z.id}>{z.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (optional)</label>
                <textarea value={bulkCoverNotes} onChange={(e) => setBulkCoverNotes(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setBulkCoverOpen(false)} className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button type="button" disabled={!canBulkCover} onClick={() => { if (!confirm('Mark covered for all guards currently on shift for these filters?')) return; bulkMarkCovered(); }} className={`px-4 py-2 rounded-md text-white ${canBulkCover ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-gray-400 cursor-not-allowed'}`}>Confirm</button>
            </div>
          </div>
        </Modal>

        {/* Assign Supervisor Modal */}
        <Modal show={showSupervisor} onClose={() => setShowSupervisor(false)} maxWidth="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const targetIds = selectedGuardIds.length > 0 ? selectedGuardIds : (currentGuardId ? [currentGuardId] : []);
              if (!targetIds.length || !selectedSupervisorId) return;
              router.post(route('control-room.guards.assign-supervisor'), {
                guard_ids: targetIds,
                supervisor_id: Number(selectedSupervisorId),
              }, {
                preserveScroll: true,
                onSuccess: () => { setShowSupervisor(false); setCurrentGuardId(null); setSelectedGuardIds([]); router.reload(); },
              });
            }}
            className="p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Supervisor</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supervisor</label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => setSelectedSupervisorId(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select...</option>
                {supervisors.map((s: { id: number; name: string }) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowSupervisor(false)} className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const targetIds = selectedGuardIds.length > 0 ? selectedGuardIds : (currentGuardId ? [currentGuardId] : []);
                  if (!targetIds.length) return;
                  if (!confirm('Unassign supervisor from this guard?')) return;
                  router.post(route('control-room.guards.unassign-supervisor'), { guard_ids: targetIds }, {
                    preserveScroll: true,
                    onSuccess: () => { setShowSupervisor(false); setCurrentGuardId(null); setSelectedGuardIds([]); router.reload(); },
                  });
                }}
                className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Unassign
              </button>
              <button type="submit" disabled={!selectedSupervisorId} className="px-4 py-2 rounded-md bg-coin-700 hover:bg-coin-800 text-white">Assign</button>
            </div>
          </form>
        </Modal>

      </div>
    </ControlRoomLayout>
  );
}
