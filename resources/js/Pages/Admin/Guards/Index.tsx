import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import useNotification from '@/Providers/useNotifications';
import Modal from '@/Components/Modal';
import GuardForm from '@/Components/Guards/GuardForm';
import { GuardFormData } from '@/types/guards';

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
}

export default function GuardsIndex({ guards, filters, canAssignSupervisor, canViewSupervisor, supervisors = [], grades = [] }: GuardsIndexProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const { push } = useNotification();

  // Modals state
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [selectedGuard, setSelectedGuard] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

  const handleSearch = () => {
    router.get(route('admin.guards.index'), { search }, { preserveState: true });
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

  const submitCreate = async (form: GuardFormData) => {
    setSaving(true);
    router.post(route('admin.guards.store'), form as any, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => setShowAdd(false),
    });
  };
  const submitUpdate = async (form: GuardFormData) => {
    if (!selectedGuard) return;
    setSaving(true);
    router.post(route('admin.guards.update', { guard: selectedGuard.id }), { ...(form as any), _method: 'PUT' }, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => setShowEdit(false),
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
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this guard?')) {
                            router.delete(route('admin.guards.destroy', { guard: guard.id }));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        <IconMapper name="Trash" size={18} />
                      </button>
                      {/* Suspend / Activate */}
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
                        disabled={loadingId === guard.id}
                      >
                        {loadingId === guard.id ? '...' : guard.status === 'active' ? 'Suspend' : 'Activate'}
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
      </div>
    </AdminLayout>
  );
}
