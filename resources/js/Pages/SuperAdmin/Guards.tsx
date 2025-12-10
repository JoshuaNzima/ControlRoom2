import React from 'react';
import { Head, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';
import useNotification from '@/Providers/useNotifications';
import Modal from '@/Components/Modal';
import GuardForm from '@/Components/Guards/GuardForm';
import { GuardFormData } from '@/types/guards';
import AssignSiteModal from '@/Components/Guards/AssignSiteModal';
import PromoteGuardModal from '@/Components/HR/PromoteGuardModal';

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

interface Supervisor { id: number; name: string }
interface GradeOption { id: number; code: string; name: string }

interface GuardsPageProps {
  guards: {
    data: Guard[];
    meta?: any;
    links?: any[];
  };
  filters: Filters & { status?: string; zone_id?: string; grade_id?: string; sort?: string; dir?: 'asc'|'desc'; per_page?: number|string };
  supervisors?: Supervisor[];
  grades?: GradeOption[];
  zones?: Array<{ id: number; name: string }>;
}

export default function SuperAdminGuards({ guards, filters, supervisors = [], grades = [], zones = [] }: GuardsPageProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const [status, setStatus] = React.useState<string>(filters.status || '');
  const [zoneId, setZoneId] = React.useState<string>(filters.zone_id || '');
  const [gradeId, setGradeId] = React.useState<string>(filters.grade_id || '');
  const [sort, setSort] = React.useState<string>(() => {
    if (filters.sort) return String(filters.sort);
    if (typeof window !== 'undefined') return window.localStorage.getItem('superadmin.guards.sort') || 'name';
    return 'name';
  });
  const [dir, setDir] = React.useState<'asc'|'desc'>(() => {
    if (filters.dir === 'desc') return 'desc';
    if (typeof window !== 'undefined') return (window.localStorage.getItem('superadmin.guards.dir') as any) === 'desc' ? 'desc' : 'asc';
    return 'asc';
  });
  const [perPage, setPerPage] = React.useState<string>(() => {
    if (filters.per_page) return String(filters.per_page);
    if (typeof window !== 'undefined') return window.localStorage.getItem('superadmin.guards.perPage') || '20';
    return '20';
  });
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const { push } = useNotification();

  // Modals
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showAssign, setShowAssign] = React.useState(false);
  const [showPromote, setShowPromote] = React.useState(false);
  const [selectedGuard, setSelectedGuard] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [photoCreate, setPhotoCreate] = React.useState<File | null>(null);
  const [photoEdit, setPhotoEdit] = React.useState<File | null>(null);
  const [selectedGuardIds, setSelectedGuardIds] = React.useState<number[]>([]);
  const [showSupervisor, setShowSupervisor] = React.useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = React.useState<string>('');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('superadmin.guards.sort', sort);
    window.localStorage.setItem('superadmin.guards.dir', dir);
    window.localStorage.setItem('superadmin.guards.perPage', perPage);
  }, [sort, dir, perPage]);

  const applyFilters = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: status || undefined,
      zone_id: zoneId || undefined,
      grade_id: gradeId || undefined,
      sort,
      dir,
      per_page: perPage,
    };
    router.get(route('superadmin.guards'), query, { preserveState: true, preserveScroll: true });
  };
  const resetFilters = () => {
    setSearch(''); setStatus(''); setZoneId(''); setGradeId(''); setSort('name'); setDir('asc'); setPerPage('20');
    router.get(route('superadmin.guards'), {}, { preserveState: true, preserveScroll: true });
  };

  const handleExport = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: status || undefined,
      zone_id: zoneId || undefined,
      grade_id: gradeId || undefined,
      sort,
      dir,
    };
    const url = route('admin.guards.export', query);
    window.location.href = url;
  };

  function showToast(message: string) {
    push(message, 'info');
  }

  const openAdd = () => { setSelectedGuard(null); setShowAdd(true); };
  const openEdit = async (guardId: number) => {
    try {
      const res = await fetch(route('admin.guards.json', guardId));
      const data = await res.json();
      setSelectedGuard(data);
      setShowEdit(true);
    } catch {}
  };
  const openDetails = async (guardId: number) => {
    try {
      const res = await fetch(route('admin.guards.json', guardId));
      const data = await res.json();
      setSelectedGuard(data);
      setShowDetails(true);
    } catch {}
  };
  const openAssign = (guardId: number) => { setSelectedGuard({ id: guardId }); setShowAssign(true); };
  const openPromote = async (guardId: number) => {
    try {
      const res = await fetch(route('admin.guards.json', guardId));
      const data = await res.json();
      setSelectedGuard(data);
      setShowPromote(true);
    } catch {}
  };

  const submitCreate = async (form: GuardFormData) => {
    setSaving(true);
    const fd = new FormData();
    let appendedPhoto = false;
    Object.entries(form as any).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(`${k}[]`, String(item)));
      } else if (typeof File !== 'undefined' && v instanceof File) {
        fd.append(k, v as any);
        if (k === 'photo') appendedPhoto = true;
      } else {
        fd.append(k, String(v));
      }
    });
    if (!appendedPhoto && photoCreate) fd.append('photo', photoCreate);
    router.post(route('admin.guards.store'), fd, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => { setShowAdd(false); setPhotoCreate(null); },
    });
  };

  const submitUpdate = async (form: GuardFormData) => {
    if (!selectedGuard) return;
    setSaving(true);
    const fd = new FormData();
    let appendedPhoto = false;
    Object.entries(form as any).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(`${k}[]`, String(item)));
      } else if (typeof File !== 'undefined' && v instanceof File) {
        fd.append(k, v as any);
        if (k === 'photo') appendedPhoto = true;
      } else {
        fd.append(k, String(v));
      }
    });
    fd.append('_method', 'PUT');
    if (!appendedPhoto && photoEdit) fd.append('photo', photoEdit);
    router.post(route('admin.guards.update', { guard: selectedGuard.id }), fd, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => { setShowEdit(false); setPhotoEdit(null); },
    });
  };

  const printDetails = () => {
    if (!selectedGuard) return;
    const w = window.open('', 'PRINT', 'height=650,width=900');
    if (!w) return;
    const g = selectedGuard;
    w.document.write(`<!doctype html><html><head><title>Guard ${g.employee_id || ''} - ${g.name}</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;}
      h1{font-size:20px;margin:0 0 8px 0}
      .section{margin:12px 0}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .row{display:flex;justify-content:space-between;border-bottom:1px dashed #ccc;padding:4px 0}
      .label{color:#555}
    </style>
    </head><body>`);
    w.document.write(`<h1>Guard Profile</h1>`);
    const row = (label: string, val: any) => `<div class="row"><span class="label">${label}</span><span>${val ?? ''}</span></div>`;
    w.document.write(`<div class="section">${row('Name', g.name)}${row('Employee ID', g.employee_id)}${row('Phone', g.phone)}${row('Email', g.email)}</div>`);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const toggleGuardSelected = (id: number) => {
    setSelectedGuardIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    const idsOnPage = guards.data.map((g: Guard) => g.id);
    const allSelected = idsOnPage.every((id: number) => selectedGuardIds.includes(id));
    if (allSelected) {
      setSelectedGuardIds(prev => prev.filter(id => !idsOnPage.includes(id)));
    } else {
      setSelectedGuardIds(prev => Array.from(new Set([...prev, ...idsOnPage])));
    }
  };

  return (
    <SuperAdminLayout title="Guards Management">
      <Head title="Guards" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Guards Management</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage field guards and assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
              title="Export CSV"
              aria-label="Export CSV"
            >
              <IconMapper name="FileDown" size={18} />
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
              title="Add Guard"
              aria-label="Add Guard"
            >
              <IconMapper name="Plus" size={20} />
              <span className="hidden sm:inline">Add Guard</span>
            </button>
          </div>
        </div>
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  placeholder="Name or Employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-600"
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
                {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grade</label>
              <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {grades.map((g) => (<option key={g.id} value={g.id}>{g.code ?? g.name}</option>))}
              </select>
            </div>
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
          <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">Page {guards.meta?.current_page ?? ''} of {guards.meta?.last_page ?? ''}</div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Apply</button>
              <button onClick={resetFilters} className="px-4 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={guards.data.length > 0 && guards.data.every((g: Guard) => selectedGuardIds.includes(g.id))}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Guard</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {guards.data.map((guard) => (
                <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedGuardIds.includes(guard.id)}
                      onChange={() => toggleGuardSelected(guard.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                        {guard.name.charAt(0)}
                      </div>
                      <button onClick={() => openDetails(guard.id)} className="text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100 hover:underline">{guard.name}</div>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{guard.employee_id}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{guard.supervisor?.name || 'Unassigned'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{guard.phone || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      guard.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {guard.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(guard.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
                        title="Edit"
                      >
                        <IconMapper name="Pencil" size={18} />
                      </button>
                      <button
                        onClick={() => openAssign(guard.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                        title="Assign to site"
                        aria-label="Assign to site"
                      >
                        <IconMapper name="MapPin" size={18} />
                      </button>
                      <button
                        onClick={() => { setSelectedSupervisorId(''); setShowSupervisor(true); setSelectedGuardIds([guard.id]); }}
                        className="p-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition"
                        title="Assign Supervisor"
                      >
                        <IconMapper name="UserPlus" size={18} />
                      </button>
                      <button
                        onClick={() => openPromote(guard.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                        title="Promote"
                        aria-label="Promote"
                      >
                        <IconMapper name="ArrowUpCircle" size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this guard?')) {
                            router.delete(route('admin.guards.destroy', { guard: guard.id }));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        <IconMapper name="Trash" size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          const newStatus = guard.status === 'active' ? 'suspended' : 'active';
                          if (!confirm(`Are you sure you want to set status to ${newStatus}?`)) return;
                          setLoadingId(guard.id);
                          try {
                            await router.put(route('admin.guards.update', { guard: guard.id }), { status: newStatus });
                            showToast(`Guard ${guard.name} set to ${newStatus}`);
                          } catch (e) {
                            showToast('Failed to update status');
                          } finally {
                            setLoadingId(null);
                          }
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                        title={guard.status === 'active' ? 'Suspend guard' : 'Activate guard'}
                        aria-label={guard.status === 'active' ? 'Suspend guard' : 'Activate guard'}
                        disabled={loadingId === guard.id}
                      >
                        {loadingId === guard.id ? (
                          <IconMapper name="Loader2" size={18} />
                        ) : (
                          <IconMapper name={guard.status === 'active' ? 'PauseCircle' : 'PlayCircle'} size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guards.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No guards found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Footer: selection and pagination */}
          <div className="p-4 border-t dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">Page {guards.meta?.current_page ?? ''} of {guards.meta?.last_page ?? ''}</div>
            {selectedGuardIds.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{selectedGuardIds.length} selected</div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {Array.isArray(guards.links) && guards.links.filter((l: any) => l.url !== null).map((l: any, idx: number) => (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                  dangerouslySetInnerHTML={{ __html: l.label }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Add Guard Modal */}
        <Modal show={showAdd} onClose={() => setShowAdd(false)} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Guard</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoCreate(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-gray-800 dark:file:text-gray-100"
              />
            </div>
            <GuardForm
              initialData={{ status: 'active', guard_type: 'permanent' } as any}
              supervisors={supervisors}
              grades={grades}
              onSubmit={submitCreate}
              canAssignSupervisor={true}
              processing={saving}
              errors={{}}
              hideCancel={false}
              onCancel={() => setShowAdd(false)}
            />
          </div>
        </Modal>

        {/* Edit Guard Modal */}
        <Modal show={showEdit} onClose={() => setShowEdit(false)} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Guard</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoEdit(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-gray-800 dark:file:text-gray-100"
              />
            </div>
            {selectedGuard && (
              <GuardForm
                initialData={selectedGuard}
                supervisors={supervisors}
                grades={grades}
                onSubmit={submitUpdate}
                canAssignSupervisor={true}
                processing={saving}
                errors={{}}
                hideCancel={false}
                onCancel={() => setShowEdit(false)}
              />
            )}
          </div>
        </Modal>

        {/* Guard Details Modal */}
        <Modal show={showDetails} onClose={() => setShowDetails(false)} maxWidth="xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Guard Details</h2>
              <button onClick={printDetails} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">Print</button>
            </div>
            {!selectedGuard ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                {/* Photo Preview */}
                {(() => {
                  const p = (selectedGuard as any).photo as string | undefined;
                  if (!p) return null;
                  const url = p.startsWith('http') || p.startsWith('/storage') ? p : `/storage/${p}`;
                  return (
                    <div className="flex items-center gap-3">
                      <img
                        src={url}
                        alt={selectedGuard.name}
                        className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <div className="text-sm text-gray-600 dark:text-gray-300">Profile photo</div>
                    </div>
                  );
                })()}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><span className="text-sm text-gray-500">Name</span><div className="font-medium">{selectedGuard.name}</div></div>
                  <div><span className="text-sm text-gray-500">Employee ID</span><div className="font-medium">{selectedGuard.employee_id}</div></div>
                  <div><span className="text-sm text-gray-500">Phone</span><div className="font-medium">{selectedGuard.phone || '—'}</div></div>
                  <div><span className="text-sm text-gray-500">Email</span><div className="font-medium">{selectedGuard.email || '—'}</div></div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Identity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Date of Birth</span><div>{selectedGuard.date_of_birth || '—'}</div></div>
                    <div><span className="text-gray-500">Gender</span><div>{selectedGuard.gender || '—'}</div></div>
                    <div><span className="text-gray-500">ID Number</span><div>{selectedGuard.id_number || '—'}</div></div>
                    <div><span className="text-gray-500">Role</span><div>{selectedGuard.employee_role || 'guard'}</div></div>
                    <div><span className="text-gray-500">Guard Type</span><div>{selectedGuard.guard_type || '—'}</div></div>
                    <div><span className="text-gray-500">Supervisor</span><div>{selectedGuard.supervisor?.name || '—'}</div></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Residence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Address</span><div>{selectedGuard.residence_address || selectedGuard.address || '—'}</div></div>
                    <div><span className="text-gray-500">City</span><div>{selectedGuard.residence_city || '—'}</div></div>
                    <div><span className="text-gray-500">District</span><div>{selectedGuard.residence_district || '—'}</div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Assign to Site Modal */}
        <AssignSiteModal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          guardId={selectedGuard?.id ?? null}
          zones={zones}
          scope="admin"
          onSuccess={() => { push('Guard assigned to site', 'success'); router.reload(); }}
        />

        {/* Promote Guard Modal */}
        <PromoteGuardModal
          open={showPromote}
          guard={selectedGuard}
          zones={zones}
          onClose={() => setShowPromote(false)}
          onSuccess={() => push('Guard promoted')}
        />

        {/* Assign Supervisor Modal */}
        <Modal show={showSupervisor} onClose={() => setShowSupervisor(false)} maxWidth="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const targetIds = selectedGuardIds.length > 0 ? selectedGuardIds : (selectedGuard?.id ? [selectedGuard.id] : []);
              if (!targetIds.length || !selectedSupervisorId) return;
              router.post(route('guards.assign-supervisor'), {
                guard_ids: targetIds,
                supervisor_id: Number(selectedSupervisorId),
              }, {
                preserveScroll: true,
                onSuccess: () => { setShowSupervisor(false); setSelectedGuardIds([]); router.reload(); },
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
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowSupervisor(false)} className="px-4 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const targetIds = selectedGuardIds.length > 0 ? selectedGuardIds : (selectedGuard?.id ? [selectedGuard.id] : []);
                  if (!targetIds.length) return;
                  if (!confirm('Unassign supervisor from selected guard(s)?')) return;
                  router.post(route('guards.unassign-supervisor'), { guard_ids: targetIds }, {
                    preserveScroll: true,
                    onSuccess: () => { setShowSupervisor(false); setSelectedGuardIds([]); router.reload(); },
                  });
                }}
                className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Unassign
              </button>
              <button type="submit" disabled={!selectedSupervisorId} className="px-4 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white">Assign</button>
            </div>
          </form>
        </Modal>
      </div>
    </SuperAdminLayout>
  );
}
