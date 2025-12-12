import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import GuardForm from '@/Components/Guards/GuardForm';
import AssignSiteModal from '@/Components/Guards/AssignSiteModal';
import ManualCheckInModal from '@/Components/Guards/ManualCheckInModal';
import ManualCheckOutModal from '@/Components/Guards/ManualCheckOutModal';

type Guard = {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  supervisor?: { id: number; name: string } | null;
  today_attendance?: { check_in?: string | null; check_out?: string | null } | null;
  active_assignment?: { site_id?: number | null; site_name?: string | null; client_name?: string | null } | null;
};

type PageProps = {
  guards?: { data: Guard[]; links?: any; meta?: any };
  filters?: { search?: string };
  supervisors?: Array<{ id: number; name: string }>;
  grades?: Array<{ id: number; code: string; name: string }>;
  zones?: Array<{ id: number; name: string }>;
  canAssignSupervisor?: boolean;
};

export default function GuardsIndex() {
  const { guards: guardsProp = { data: [], links: [], meta: {} }, filters = {}, supervisors = [], grades = [], zones = [], canAssignSupervisor = false } = usePage<PageProps>().props as any;
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState<string>(filters.status || '');
  const [zoneId, setZoneId] = useState<string>(filters.zone_id || '');
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

  const applyFilters = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: status || undefined,
      zone_id: zoneId || undefined,
      grade_id: gradeId || undefined,
      on_duty: onDuty ? 1 : undefined,
      sort,
      dir,
      per_page: perPage,
    };
    router.get(route('control-room.guards'), query, { preserveState: true, preserveScroll: true });
  };

  const resetFilters = () => {
    setSearch(''); setStatus(''); setZoneId(''); setGradeId(''); setOnDuty(false); setSort('name'); setDir('asc'); setPerPage('20');
    router.get(route('control-room.guards'), {}, { preserveState: true, preserveScroll: true });
  };
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [currentGuardId, setCurrentGuardId] = useState<number | null>(null);
  const [showManualCheckIn, setShowManualCheckIn] = useState(false);
  const [manualGuardId, setManualGuardId] = useState<number | null>(null);
  const [showManualCheckOut, setShowManualCheckOut] = useState(false);
  const [manualOutGuardId, setManualOutGuardId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorsCreate, setErrorsCreate] = useState<Record<string, string>>({});
  const [showSupervisor, setShowSupervisor] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
  const [selectedGuardIds, setSelectedGuardIds] = useState<number[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState<number | null>(null);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guards Management</h1>
            <p className="text-gray-600">Control Room scoped guard list and quick actions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (window.location.href = route('control-room.assignments.index'))}
              className="px-4 py-2 bg-coin-600 text-white rounded"
            >
              Manage Assignments
            </button>
            <Link href={route('control-room.clients')} className="px-4 py-2 bg-gray-100 rounded text-gray-700">
              Clients
            </Link>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-coin-700 hover:bg-coin-800 text-white rounded"
            >
              Add Guard
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 border dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900"
            >
              Export CSV
            </button>
          </div>
        </div>

        <Card className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zone</label>
              <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {zones.map((z: any) => (<option key={z.id} value={z.id}>{z.name}</option>))}
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
            <div className="flex items-end gap-2">
              <button onClick={applyFilters} className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded w-full">Apply</button>
              <button onClick={resetFilters} className="px-4 py-2 border dark:border-gray-700 rounded w-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
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

        <Card className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={guardsProp.data.length > 0 && guardsProp.data.every((g: Guard) => selectedGuardIds.includes(g.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guardsProp.data.map((g: Guard) => (
                  <tr key={g.id}>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedGuardIds.includes(g.id)}
                        onChange={() => toggleGuardSelected(g.id)}
                      />
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">{g.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{g.employee_id}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        g.status === 'active' ? 'bg-green-100 text-green-800' :
                        g.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{g.supervisor?.name || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {g.active_assignment ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span className="font-medium">{g.active_assignment.client_name || 'Client'}</span>
                          <span className="text-xs text-indigo-600">• {g.active_assignment.site_name || 'Site'}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {g.today_attendance ? (
                        <span>
                          {g.today_attendance.check_in || '--:--'} → {g.today_attendance.check_out || '--:--'}
                        </span>
                      ) : <span className="text-gray-400">No entry</span>}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => { setCurrentGuardId(g.id); setShowAssign(true); }}
                          className="p-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                          title="Assign Site"
                          aria-label="Assign Site"
                        >
                          <IconMapper name="MapPin" size={18} />
                        </button>
                        <button
                          onClick={() => { setManualGuardId(g.id); setShowManualCheckIn(true); }}
                          className={`p-2 rounded text-white ${g.today_attendance?.check_in ? 'bg-gray-400 cursor-not-allowed' : 'bg-coin-700 hover:bg-coin-800'}`}
                          title={g.today_attendance?.check_in ? 'Already checked in' : 'Manual Check-In'}
                          aria-label="Manual Check-In"
                          disabled={!!g.today_attendance?.check_in}
                        >
                          <IconMapper name="CheckCircle" size={18} />
                        </button>
                        <button
                          onClick={() => { setManualOutGuardId(g.id); setShowManualCheckOut(true); }}
                          className={`p-2 rounded text-white ${(!g.today_attendance?.check_in || !!g.today_attendance?.check_out) ? 'bg-gray-400 cursor-not-allowed' : 'bg-coin-700 hover:bg-coin-800'}`}
                          title={!g.today_attendance?.check_in ? 'No active check-in' : (g.today_attendance?.check_out ? 'Already checked out' : 'Manual Check-Out')}
                          aria-label="Manual Check-Out"
                          disabled={!g.today_attendance?.check_in || !!g.today_attendance?.check_out}
                        >
                          <IconMapper name="LogOut" size={18} />
                        </button>
                        <button
                          onClick={() => openView(g.id)}
                          className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 border"
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
                {guardsProp.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No guards found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
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
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
            <div className="flex items-start gap-4">
              {viewData?.photo_url ? (
                <img src={viewData.photo_url} alt={viewData?.name || 'Guard'} className="w-24 h-24 rounded object-cover border dark:border-gray-700" />
              ) : (
                <div className="w-24 h-24 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">No Photo</div>
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
            className="p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-800"
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
              <button type="button" onClick={() => setShowSupervisor(false)} className="px-4 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200">Cancel</button>
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

        {/* Manual Check-In Modal */}
        <ManualCheckInModal
          open={showManualCheckIn}
          guardId={manualGuardId}
          zones={zones}
          onClose={() => { setShowManualCheckIn(false); setManualGuardId(null); }}
          onSuccess={() => router.reload()}
        />

        <ManualCheckOutModal
          open={showManualCheckOut}
          guardId={manualOutGuardId}
          onClose={() => { setShowManualCheckOut(false); setManualOutGuardId(null); }}
          onSuccess={() => router.reload()}
        />
      </div>
    </ControlRoomLayout>
  );
}
