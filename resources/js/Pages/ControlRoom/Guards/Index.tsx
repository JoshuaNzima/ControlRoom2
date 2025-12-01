import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import GuardForm from '@/Components/Guards/GuardForm';
import AssignSiteModal from '@/Components/Guards/AssignSiteModal';

type Guard = {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  supervisor?: { id: number; name: string } | null;
  today_attendance?: { check_in?: string | null; check_out?: string | null } | null;
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
  const { guards: guardsProp = { data: [] }, filters = {}, supervisors = [], grades = [], zones = [], canAssignSupervisor = false } = usePage<PageProps>().props as any;
  const [search, setSearch] = useState(filters.search || '');
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [currentGuardId, setCurrentGuardId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorsCreate, setErrorsCreate] = useState<Record<string, string>>({});
  const [showSupervisor, setShowSupervisor] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');

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
          </div>
        </div>

        <Card className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && router.get(route('control-room.guards'), { search }, { preserveState: true })}
                  placeholder="Name or Employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => router.get(route('control-room.guards'), { search }, { preserveState: true })}
                className="px-4 py-2 bg-coin-600 text-white rounded w-full md:w-auto"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </Card>

        <Card className="bg-white rounded-xl shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guardsProp.data.map((g: Guard) => (
                  <tr key={g.id}>
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
                          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Assign Site
                        </button>
                        {canAssignSupervisor && (
                          <button
                            onClick={() => { setCurrentGuardId(g.id); setSelectedSupervisorId(''); setShowSupervisor(true); }}
                            className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-900 text-white"
                          >
                            Assign Supervisor
                          </button>
                        )}
                        {canAssignSupervisor && (
                          g.status === 'active' ? (
                            <>
                              <button
                                onClick={() => {
                                  if (!confirm('Suspend this guard?')) return;
                                  router.post(route('control-room.guards.suspend', { guard: g.id }), {}, { preserveScroll: true });
                                }}
                                className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Dismissal reason (optional)') || '';
                                  if (!confirm('Dismiss this guard?')) return;
                                  router.post(route('control-room.guards.dismiss', { guard: g.id }), { reason }, { preserveScroll: true });
                                }}
                                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white"
                              >
                                Dismiss
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                if (!confirm('Reinstate this guard?')) return;
                                router.post(route('control-room.guards.reinstate', { guard: g.id }), {}, { preserveScroll: true });
                              }}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Reinstate
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {guardsProp.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No guards found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

        {/* Assign Site Modal */}
        <AssignSiteModal
          open={showAssign}
          guardId={currentGuardId}
          zones={zones}
          onClose={() => { setShowAssign(false); setCurrentGuardId(null); }}
          onSuccess={() => router.reload()}
          fetchSitesRouteName="control-room.clients.sites.json"
          assignRouteName="control-room.guards.assign-site"
          unassignRouteName="control-room.guards.unassign-site"
        />

        {/* Assign Supervisor Modal */}
        <Modal show={showSupervisor} onClose={() => setShowSupervisor(false)} maxWidth="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!currentGuardId || !selectedSupervisorId) return;
              router.post(route('control-room.guards.assign-supervisor'), {
                guard_ids: [currentGuardId],
                supervisor_id: Number(selectedSupervisorId),
              }, {
                preserveScroll: true,
                onSuccess: () => { setShowSupervisor(false); setCurrentGuardId(null); router.reload(); },
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
                  if (!currentGuardId) return;
                  if (!confirm('Unassign supervisor from this guard?')) return;
                  router.post(route('control-room.guards.unassign-supervisor'), { guard_ids: [currentGuardId] }, {
                    preserveScroll: true,
                    onSuccess: () => { setShowSupervisor(false); setCurrentGuardId(null); router.reload(); },
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
