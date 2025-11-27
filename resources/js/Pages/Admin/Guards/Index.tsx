import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import useNotification from '@/Providers/useNotifications';
import Modal from '@/Components/Modal';
import GuardForm from '@/Components/Guards/GuardForm';
import { GuardFormData } from '@/types/guards';
import AssignSiteModal from '@/Components/Guards/AssignSiteModal';
import PromoteGuardModal from '@/Components/HR/PromoteGuardModal';
import { Pagination } from '@/Components/ui/Pagination';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone?: string;
  status?: string;
  supervisor?: { id: number; name: string } | null;
  photo_url?: string | null;
  photo?: string | null;
}

interface Filters {
  search?: string;
  status?: string;
  per_page?: number | string;
}

interface Supervisor { id: number; name: string }
interface GradeOption { id: number; code: string; name: string }

interface GuardsIndexProps {
  guards: {
    data: Guard[];
    meta?: any;
  };
  filters: Filters;
  canAssignSupervisor: boolean;
  canViewSupervisor: boolean;
  supervisors?: Supervisor[];
  grades?: GradeOption[];
  zones?: Array<{ id: number; name: string }>;
}

export default function GuardsIndex({ guards, filters, canAssignSupervisor, canViewSupervisor, supervisors = [], grades = [], zones = [] }: GuardsIndexProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const initialPerPage = Number((filters as any)?.per_page ?? (guards as any)?.meta?.per_page ?? 20);
  const [perPage, setPerPage] = React.useState<number>(initialPerPage);
  const [status, setStatus] = React.useState<string>(filters.status || '');
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const { push } = useNotification();

  // Modals state
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showAssign, setShowAssign] = React.useState(false);
  const [showPromote, setShowPromote] = React.useState(false);
  const [selectedGuard, setSelectedGuard] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [photoCreate, setPhotoCreate] = React.useState<File | null>(null);
  const [photoEdit, setPhotoEdit] = React.useState<File | null>(null);
  const [errorsCreate, setErrorsCreate] = React.useState<Record<string, string>>({});
  const [errorsEdit, setErrorsEdit] = React.useState<Record<string, string>>({});

  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = React.useState<'name' | 'employee_id' | 'status' | 'supervisor' | 'phone'>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const sortedGuards = React.useMemo(() => {
    const arr = [...guards.data];
    const val = (g: Guard) => {
      switch (sortBy) {
        case 'employee_id':
          return g.employee_id || '';
        case 'status':
          return g.status || '';
        case 'supervisor':
          return (g.supervisor?.name as string) || '';
        case 'phone':
          return g.phone || '';
        default:
          return g.name || '';
      }
    };
    arr.sort((a, b) => {
      const av = String(val(a)).toLowerCase();
      const bv = String(val(b)).toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [guards.data, sortBy, sortDir]);

  // Normalize paginator meta for shared Pagination component
  const defaultMeta: any = { current_page: 1, last_page: 1, per_page: perPage || 20, total: (guards as any)?.meta?.total ?? (guards?.data?.length || 0), from: 0, to: 0 };
  const rawGuards: any = guards as any;
  const guardArr: any[] = Array.isArray(rawGuards) ? (rawGuards as any[]) : (rawGuards?.data ?? []);
  const metaFromTop: any = rawGuards && typeof rawGuards === 'object' && !Array.isArray(rawGuards) && (rawGuards.current_page || rawGuards.last_page || rawGuards.total)
    ? {
        current_page: Number(rawGuards.current_page ?? 1),
        last_page: Number(rawGuards.last_page ?? 1),
        per_page: Number(rawGuards.per_page ?? perPage ?? 20),
        total: Number(rawGuards.total ?? guardArr.length ?? 0),
        from: Number(rawGuards.from ?? ((guardArr.length > 0 && rawGuards.current_page && rawGuards.per_page) ? ((Number(rawGuards.current_page) - 1) * Number(rawGuards.per_page) + 1) : 0)),
        to: Number(rawGuards.to ?? ((rawGuards.from && guardArr.length) ? (Number(rawGuards.from) + guardArr.length - 1) : (guardArr.length || 0))),
      }
    : null;
  const meta: any = Array.isArray(rawGuards) ? defaultMeta : (rawGuards?.meta ?? metaFromTop ?? defaultMeta);

  // Debounce search input
  React.useEffect(() => {
    const id = setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        router.get(route('admin.guards.index'), { search, status: status || undefined, per_page: perPage, page: 1 }, { preserveState: true, preserveScroll: true });
      }
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const getPhotoUrl = (g: Guard): string | null => {
    const pUrl = (g as any).photo_url as string | undefined;
    const p = (g as any).photo as string | undefined;
    if (p) {
      return p.startsWith('http') || p.startsWith('/storage') ? p : `/storage/${p}`;
    }
    return pUrl || null;
  };

  const handleSearch = () => {
    router.get(route('admin.guards.index'), { search, status: status || undefined, per_page: perPage }, { preserveState: true, preserveScroll: true });
  };

  function showToast(message: string) {
    push(message, 'info');
  }

  const openAdd = () => {
    setSelectedGuard(null);
    setShowAdd(true);
  };
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
  const openAssign = (guardId: number) => {
    setSelectedGuard({ id: guardId });
    setShowAssign(true);
  };
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
    Object.entries(form as any).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(`${k}[]`, String(item)));
      } else {
        fd.append(k, String(v));
      }
    });
    if (photoCreate) fd.append('photo', photoCreate);
    router.post(route('admin.guards.store'), fd, {
      forceFormData: true,
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => { setShowAdd(false); setPhotoCreate(null); setErrorsCreate({}); },
      onError: (errs: any) => { setErrorsCreate(errs as Record<string, string>); },
    });
  };
  const submitUpdate = async (form: GuardFormData) => {
    if (!selectedGuard) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(form as any).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(`${k}[]`, String(item)));
      } else {
        fd.append(k, String(v));
      }
    });
    fd.append('_method', 'PUT');
    if (photoEdit) fd.append('photo', photoEdit);
    router.post(route('admin.guards.update', { guard: selectedGuard.id }), fd, {
      forceFormData: true,
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => { setShowEdit(false); setPhotoEdit(null); setErrorsEdit({}); },
      onError: (errs: any) => { setErrorsEdit(errs as Record<string, string>); },
    });
  };

  const printDetails = () => {
    if (!selectedGuard) return;
    const w = window.open('', 'PRINT', 'height=650,width=900');
    if (!w) return;
    const g = selectedGuard;
    const photoUrl: string | null = (g as any).photo_url
      || ((g as any).photo ? (((g as any).photo as string).startsWith('http') || ((g as any).photo as string).startsWith('/storage') ? (g as any).photo : `/storage/${(g as any).photo}`) : null);
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
    if (photoUrl) {
      w.document.write(`<div class="section"><img src="${photoUrl}" alt="${g.name}" style="width:96px;height:96px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb" /></div>`);
    }
    const row = (label: string, val: any) => `<div class="row"><span class="label">${label}</span><span>${val ?? ''}</span></div>`;
    w.document.write(`<div class="section">${row('Name', g.name)}${row('Employee ID', g.employee_id)}${row('Phone', g.phone)}${row('Email', g.email)}</div>`);
    w.document.write(`<div class="section"><h3>Residence</h3>${row('Address', g.residence_address || g.address)}${row('City', g.residence_city)}${row('District', g.residence_district)}</div>`);
    w.document.write(`<div class="section"><h3>Marital</h3>${row('Status', g.marital_status)}${row('Spouse', g.spouse_name)}${row('Spouse Phone', g.spouse_phone)}</div>`);
    w.document.write(`<div class="section"><h3>Next of Kin</h3>${row('Name', g.next_of_kin_name)}${row('Relationship', g.next_of_kin_relationship)}${row('Phone', g.next_of_kin_phone)}</div>`);
    w.document.write(`<div class="section"><h3>Home</h3>${row('Village', g.home_village)}${row('T/A', g.home_ta)}${row('District', g.home_district)}</div>`);
    w.document.write(`<div class="section"><h3>Education</h3>${row('Level', g.education_level)}${row('Qualifications', Array.isArray(g.qualifications)? g.qualifications.join(', ') : (g.qualifications||''))}${row('Languages', Array.isArray(g.languages)? g.languages.join(', ') : (g.languages||''))}</div>`);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <AdminLayout title="Guards Management">
      <Head title="Guards" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notifications are displayed by the global NotificationProvider */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Guards Management</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage field guards and assignments</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
          >
            <IconMapper name="Plus" size={20} />
            Add Guard
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex gap-4">
              <div className="flex-1 relative">
              <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, employee id or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Search
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Status</span>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); router.get(route('admin.guards.index'), { search, status: e.target.value || undefined, per_page: perPage, page: 1 }, { preserveState: true, preserveScroll: true }); }}
                className="text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="name">Name</option>
                <option value="employee_id">Employee ID</option>
                <option value="phone">Phone</option>
                <option value="status">Status</option>
                {canViewSupervisor && <option value="supervisor">Supervisor</option>}
              </select>
              <button
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                title={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
              >
                <IconMapper name={sortDir === 'asc' ? 'ArrowDownNarrowWide' : 'ArrowUpNarrowWide'} size={18} />
                <span className="hidden sm:inline">{sortDir === 'asc' ? 'Asc' : 'Desc'}</span>
              </button>
            </div>
            <div className="ml-auto flex items-center gap-1 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm inline-flex items-center gap-2 ${viewMode === 'list' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}
                title="List view"
              >
                <IconMapper name="List" size={18} />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm inline-flex items-center gap-2 ${viewMode === 'grid' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}
                title="Thumbnails"
              >
                <IconMapper name="Grid" size={18} />
                <span className="hidden sm:inline">Thumbs</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Per page</span>
              <select
                value={String(perPage)}
                onChange={(e) => { const v = Number(e.target.value); setPerPage(v); router.get(route('admin.guards.index'), { search, status: status || undefined, per_page: v, page: 1 }, { preserveState: true, preserveScroll: true }); }}
                className="text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Guard</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee ID</th>
                  {canViewSupervisor && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Supervisor</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedGuards.map((guard) => (
                  <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const url = getPhotoUrl(guard);
                          if (url) {
                            return (
                              <img src={url} alt={guard.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                            );
                          }
                          return (
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                              {guard.name.charAt(0)}
                            </div>
                          );
                        })()}
                        <button onClick={() => openDetails(guard.id)} className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100 hover:underline">{guard.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Tap to view details</div>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{guard.employee_id}</td>
                    {canViewSupervisor && (
                      <td className="px-6 py-4">
                        {canAssignSupervisor ? (
                          <button
                            onClick={() => openEdit(guard.id)}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                          >
                            {guard.supervisor?.name || 'Assign Supervisor'}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-700">
                            {guard.supervisor?.name || 'Unassigned'}
                          </span>
                        )}
                      </td>
                    )}
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
                          className="px-2 py-2 inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                          title="Assign to site"
                        >
                          <IconMapper name="UserCheck" size={18} />
                          <span className="hidden sm:inline">Assign</span>
                        </button>
                        <button
                          onClick={() => openPromote(guard.id)}
                          className="px-2 py-2 inline-flex items-center gap-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                          title="Promote"
                        >
                          <IconMapper name="ArrowUpRight" size={18} />
                          <span className="hidden sm:inline">Promote</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this guard?')) {
                              router.delete(route('admin.guards.destroy', { guard: guard.id }));
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          title="Delete"
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
                          className="px-2 py-2 inline-flex items-center gap-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition"
                          title={guard.status === 'active' ? 'Suspend guard' : 'Activate guard'}
                          disabled={loadingId === guard.id}
                        >
                          {loadingId === guard.id ? (
                            '...'
                          ) : guard.status === 'active' ? (
                            <>
                              <IconMapper name="Ban" size={18} />
                              <span className="hidden sm:inline">Suspend</span>
                            </>
                          ) : (
                            <>
                              <IconMapper name="Play" size={18} />
                              <span className="hidden sm:inline">Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedGuards.map((guard) => (
              <div key={guard.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-start gap-3">
                {(() => {
                  const url = getPhotoUrl(guard);
                  if (url) {
                    return (
                      <img src={url} alt={guard.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                    );
                  }
                  return (
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {guard.name.charAt(0)}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <button onClick={() => openDetails(guard.id)} className="block text-left">
                    <div className="truncate font-medium text-gray-900 dark:text-gray-100 hover:underline">{guard.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID {guard.employee_id} • {guard.phone || 'N/A'}</div>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEdit(guard.id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
                      title="Edit"
                    >
                      <IconMapper name="Pencil" size={18} />
                    </button>
                    <button
                      onClick={() => openAssign(guard.id)}
                      className="px-2 py-2 inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                      title="Assign to site"
                    >
                      <IconMapper name="UserCheck" size={18} />
                      <span className="hidden sm:inline">Assign</span>
                    </button>
                    <button
                      onClick={() => openPromote(guard.id)}
                      className="px-2 py-2 inline-flex items-center gap-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                      title="Promote"
                    >
                      <IconMapper name="ArrowUpRight" size={18} />
                      <span className="hidden sm:inline">Promote</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this guard?')) {
                          router.delete(route('admin.guards.destroy', { guard: guard.id }));
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      title="Delete"
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
                      className="px-2 py-2 inline-flex items-center gap-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition"
                      title={guard.status === 'active' ? 'Suspend guard' : 'Activate guard'}
                      disabled={loadingId === guard.id}
                    >
                      {loadingId === guard.id ? (
                        '...'
                      ) : guard.status === 'active' ? (
                        <>
                          <IconMapper name="Ban" size={18} />
                          <span className="hidden sm:inline">Suspend</span>
                        </>
                      ) : (
                        <>
                          <IconMapper name="Play" size={18} />
                          <span className="hidden sm:inline">Activate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            total={meta.total}
            perPage={meta.per_page}
            from={meta.from}
            to={meta.to}
            baseUrl={route('admin.guards.index')}
            filters={{ search, status: status || undefined, per_page: perPage }}
          />
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
              {photoCreate && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={URL.createObjectURL(photoCreate)} alt="Preview" className="w-16 h-16 rounded object-cover border border-gray-200 dark:border-gray-700" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{photoCreate.name}</span>
                </div>
              )}
              {errorsCreate.photo && (
                <p className="text-red-600 text-sm mt-2">{errorsCreate.photo}</p>
              )}
            </div>
            <GuardForm
              initialData={{ status: 'active', guard_type: 'permanent' } as any}
              supervisors={supervisors}
              grades={grades}
              onSubmit={submitCreate}
              canAssignSupervisor={canAssignSupervisor}
              processing={saving}
              errors={errorsCreate}
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
              <div className="mt-2 flex items-center gap-3">
                {photoEdit ? (
                  <img src={URL.createObjectURL(photoEdit)} alt="Preview" className="w-16 h-16 rounded object-cover border border-gray-200 dark:border-gray-700" />
                ) : selectedGuard ? (
                  (() => {
                    const url = getPhotoUrl(selectedGuard as any);
                    return url ? (
                      <img src={url} alt={(selectedGuard as any).name} className="w-16 h-16 rounded object-cover border border-gray-200 dark:border-gray-700" />
                    ) : null;
                  })()
                ) : null}
                {photoEdit && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{photoEdit.name}</span>
                )}
              </div>
              {errorsEdit.photo && (
                <p className="text-red-600 text-sm mt-2">{errorsEdit.photo}</p>
              )}
            </div>
            {selectedGuard && (
              <GuardForm
                initialData={selectedGuard}
                supervisors={supervisors}
                grades={grades}
                onSubmit={submitUpdate}
                canAssignSupervisor={canAssignSupervisor}
                processing={saving}
                errors={errorsEdit}
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
                  const pUrl = (selectedGuard as any).photo_url as string | undefined;
                  const p = (selectedGuard as any).photo as string | undefined;
                  const url = pUrl || (p ? (p.startsWith('http') || p.startsWith('/storage') ? p : `/storage/${p}`) : '');
                  if (!url) return null;
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
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Residence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Address</span><div>{selectedGuard.residence_address || selectedGuard.address || '—'}</div></div>
                    <div><span className="text-gray-500">City</span><div>{selectedGuard.residence_city || '—'}</div></div>
                    <div><span className="text-gray-500">District</span><div>{selectedGuard.residence_district || '—'}</div></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Marital</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Status</span><div>{selectedGuard.marital_status || '—'}</div></div>
                    <div><span className="text-gray-500">Spouse</span><div>{selectedGuard.spouse_name || '—'}</div></div>
                    <div><span className="text-gray-500">Spouse Phone</span><div>{selectedGuard.spouse_phone || '—'}</div></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Next of Kin</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Name</span><div>{selectedGuard.next_of_kin_name || '—'}</div></div>
                    <div><span className="text-gray-500">Relationship</span><div>{selectedGuard.next_of_kin_relationship || '—'}</div></div>
                    <div><span className="text-gray-500">Phone</span><div>{selectedGuard.next_of_kin_phone || '—'}</div></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Home</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Village</span><div>{selectedGuard.home_village || '—'}</div></div>
                    <div><span className="text-gray-500">T/A</span><div>{selectedGuard.home_ta || '—'}</div></div>
                    <div><span className="text-gray-500">District</span><div>{selectedGuard.home_district || '—'}</div></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Education</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Level</span><div>{selectedGuard.education_level || '—'}</div></div>
                    <div><span className="text-gray-500">Qualifications</span><div>{Array.isArray(selectedGuard.qualifications) ? selectedGuard.qualifications.join(', ') : (selectedGuard.qualifications || '—')}</div></div>
                    <div><span className="text-gray-500">Languages</span><div>{Array.isArray(selectedGuard.languages) ? selectedGuard.languages.join(', ') : (selectedGuard.languages || '—')}</div></div>
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
          onSuccess={() => push('Guard assigned to site')}
        />

        {/* Promote Guard Modal */}
        <PromoteGuardModal
          open={showPromote}
          guard={selectedGuard}
          zones={zones}
          onClose={() => setShowPromote(false)}
          onSuccess={() => push('Guard promoted')}
        />
      </div>
    </AdminLayout>
  );
}
