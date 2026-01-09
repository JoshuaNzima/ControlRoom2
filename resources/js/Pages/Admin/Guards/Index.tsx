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
import ConfirmModal from '@/Components/ConfirmModal';
import ReasonModal from '@/Components/ReasonModal';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone?: string;
  status?: string;
  supervisor?: { id: number; name: string } | null;
  is_profile_complete?: boolean;
}

interface Filters {
  search?: string;
  status?: string;
  profile_status?: string;
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
  const [profileStatus, setProfileStatus] = React.useState(filters.profile_status || '');
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

  const handleSearch = () => {
    router.get(
      route('admin.guards.index'),
      { search, profile_status: profileStatus || undefined },
      { preserveState: true }
    );
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

  // Confirm & Reason Modals
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState('');
  const [confirmMessage, setConfirmMessage] = React.useState('');
  const [confirmAction, setConfirmAction] = React.useState<() => void>(() => {});
  const [reasonOpen, setReasonOpen] = React.useState(false);
  const [reasonTitle, setReasonTitle] = React.useState('');
  const [reasonMessage, setReasonMessage] = React.useState('');
  const [reasonSubmit, setReasonSubmit] = React.useState<((reason: string) => void) | null>(null);

  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };
  const openReason = (title: string, message: string, submit: (reason: string) => void) => {
    setReasonTitle(title);
    setReasonMessage(message);
    setReasonSubmit(() => submit);
    setReasonOpen(true);
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
          <div className="flex flex-col md:flex-row gap-4">
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
            <div className="w-full md:w-56">
              <label className="sr-only">Profile</label>
              <select
                value={profileStatus}
                onChange={(e) => setProfileStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg"
              >
                <option value="">All Profiles</option>
                <option value="complete">Profile Complete</option>
                <option value="incomplete">Profile Incomplete</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Search
            </button>
          </div>
        </div>

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
              {guards.data.map((guard) => (
                <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                        {guard.name.charAt(0)}
                      </div>
                      <button onClick={() => openDetails(guard.id)} className="text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100 hover:underline">{guard.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Tap to view details</span>
                          {guard.is_profile_complete === false && (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                              Profile incomplete
                            </span>
                          )}
                        </div>
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
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        guard.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : guard.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : guard.status === 'absconded'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
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
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => openPromote(guard.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                        title="Promote"
                      >
                        Promote
                      </button>
                      <button
                        onClick={() => openConfirm('Delete guard', `Are you sure you want to delete ${guard.name}?`, () => router.delete(route('admin.guards.destroy', { guard: guard.id })))}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        <IconMapper name="Trash" size={18} />
                      </button>
                      {/* Suspend / Reinstate */}
                      <button
                        onClick={() => {
                          const isSuspending = guard.status === 'active';
                          openConfirm(
                            `${isSuspending ? 'Suspend' : 'Reinstate'} guard`,
                            `${isSuspending ? 'Suspend' : 'Reinstate'} ${guard.name}?`,
                            async () => {
                              setLoadingId(guard.id);
                              try {
                                const routeName = isSuspending ? 'admin.guards.suspend' : 'admin.guards.reinstate';
                                await router.post(route(routeName, { guard: guard.id }), {});
                                showToast(`Guard ${guard.name} ${isSuspending ? 'suspended' : 'reinstated'}`);
                              } catch (e) {
                                showToast('Failed to update status');
                              } finally {
                                setLoadingId(null);
                              }
                            }
                          );
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition"
                        title={guard.status === 'active' ? 'Suspend guard' : 'Reinstate guard'}
                        disabled={loadingId === guard.id}
                      >
                        {loadingId === guard.id ? '...' : guard.status === 'active' ? 'Suspend' : 'Reinstate'}
                      </button>
                      {/* Dismiss */}
                      <button
                        onClick={() => openReason('Dismiss Guard', `Provide a reason (optional) for dismissing ${guard.name}`, async (reason: string) => {
                          setLoadingId(guard.id);
                          try {
                            await router.post(route('admin.guards.dismiss', { guard: guard.id }), { reason });
                            showToast(`Guard ${guard.name} dismissed`);
                          } catch (e) {
                            showToast('Failed to dismiss guard');
                          } finally {
                            setLoadingId(null);
                          }
                        })}
                        className="p-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition"
                        title="Dismiss guard"
                        disabled={loadingId === guard.id}
                      >
                        Dismiss
                      </button>
                      {/* Absconded */}
                      <button
                        onClick={() => openReason('Mark as Absconded', `Provide a reason (optional) for marking ${guard.name} as absconded`, async (reason: string) => {
                          setLoadingId(guard.id);
                          try {
                            await router.post(route('admin.guards.abscond', { guard: guard.id }), { reason });
                            showToast(`Guard ${guard.name} marked absconded`);
                          } catch (e) {
                            showToast('Failed to mark absconded');
                          } finally {
                            setLoadingId(null);
                          }
                        })}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
                        title="Mark as absconded"
                        disabled={loadingId === guard.id}
                      >
                        Abscond
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              canAssignSupervisor={canAssignSupervisor}
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
                canAssignSupervisor={canAssignSupervisor}
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
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Name</span><div>{selectedGuard.emergency_contact_name || '—'}</div></div>
                    <div><span className="text-gray-500">Phone</span><div>{selectedGuard.emergency_contact_phone || '—'}</div></div>
                    <div><span className="text-gray-500">Dependents</span><div>{selectedGuard.dependents_count ?? '—'}</div></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Family</h3>
                  <div className="text-sm">
                    <span className="text-gray-500">Children Names</span>
                    <div>{selectedGuard.children_names || '—'}</div>
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

        {/* Confirm & Reason Modals */}
        <ConfirmModal
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          onConfirm={() => { setConfirmOpen(false); confirmAction(); }}
          onCancel={() => setConfirmOpen(false)}
        />
        <ReasonModal
          open={reasonOpen}
          title={reasonTitle}
          message={reasonMessage}
          confirmLabel="Submit"
          onConfirm={(reason) => { setReasonOpen(false); reasonSubmit && reasonSubmit(reason); }}
          onCancel={() => setReasonOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}
