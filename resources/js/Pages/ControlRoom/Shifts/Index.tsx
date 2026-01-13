import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';

type Shift = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  description?: string | null;
  supervisor_id?: number | null;
  required_guards?: number | null;
  status?: string;
  sites?: number[];
  guards?: any[];
  supervisor?: { id: number; name: string } | null;
  is_global?: boolean;
};

export default function ShiftsIndex() {
  const { guardShifts = { data: [] }, scheduleShifts = { data: [] }, supervisors = [], sites = [], zones = [], filters = {} } = usePage().props as any;

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const [search, setSearch] = useState<string>(filters.search ?? '');
  const [zoneId, setZoneId] = useState<number | ''>(filters.zone_id ?? '');
  const [supervisorId, setSupervisorId] = useState<number | ''>(filters.supervisor_id ?? '');
  const [siteId, setSiteId] = useState<number | ''>(filters.site_id ?? '');
  const [dateFrom, setDateFrom] = useState<string>(filters.date_from ?? '');
  const [dateTo, setDateTo] = useState<string>(filters.date_to ?? '');
  const [guardType, setGuardType] = useState<string>(filters.guard_type ?? '');

  const storageKey = 'controlroom_shifts_filters';

  const didInitFromStorageRef = useRef(false);

  useEffect(() => {
    if (didInitFromStorageRef.current) return;
    didInitFromStorageRef.current = true;
    const hasServerFilters = !!(filters.search || filters.zone_id || filters.supervisor_id || filters.site_id || filters.date_from || filters.date_to || filters.guard_type);
    if (!hasServerFilters) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved || '{}');
          const params: any = {};
          if (parsed.search) params.search = parsed.search;
          if (parsed.zone_id) params.zone_id = parsed.zone_id;
          if (parsed.supervisor_id) params.supervisor_id = parsed.supervisor_id;
          if (parsed.site_id) params.site_id = parsed.site_id;
          if (parsed.date_from) params.date_from = parsed.date_from;
          if (parsed.date_to) params.date_to = parsed.date_to;
          if (Object.keys(params).length) {
            setSearch(parsed.search || '');
            setZoneId(parsed.zone_id || '');
            setSupervisorId(parsed.supervisor_id || '');
            setSiteId(parsed.site_id || '');
            setDateFrom(parsed.date_from || '');
            setDateTo(parsed.date_to || '');
            setGuardType(parsed.guard_type || '');
            router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
          }
        }
      } catch {}
    }
  }, [filters, storageKey]);

  const applyFilters = () => {
    const params: any = {};
    if (search) params.search = search;
    if (zoneId) params.zone_id = zoneId;
    if (supervisorId) params.supervisor_id = supervisorId;
    if (siteId) params.site_id = siteId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (guardType) params.guard_type = guardType;
    try { localStorage.setItem(storageKey, JSON.stringify(params)); } catch {}
    router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
  };

  const resetFilters = () => {
    setSearch('');
    setZoneId('');
    setSupervisorId('');
    setSiteId('');
    setDateFrom('');
    setDateTo('');
    setGuardType('');
    try { localStorage.removeItem(storageKey); } catch {}
    router.get(route('control-room.shifts.index'), {}, { preserveScroll: true, preserveState: true, replace: true });
  };

  const openViewModal = async (id: number) => {
    setLoadingId(id);
    try {
      const response = await fetch(route('control-room.shifts.show', id), {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load shift');
      }

      const json = await response.json();
      setViewData(json);
      setViewOpen(true);
    } catch (e) {
      router.visit(route('control-room.shifts.show', id));
    } finally {
      setLoadingId(null);
    }
  };

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setEditOpen(true);
  };

  return (
    <ControlRoomLayout title="Shift Management">
      <Head title="Shift Management" />
      <div className="space-y-4">
        <PageHeader
          title="Shifts"
          description="Manage shift templates and view roster-based scheduled shifts."
          actions={(
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center px-3 py-2 rounded-md bg-coin-700 hover:bg-coin-800 text-white text-sm"
            >
              Create Shift
            </Button>
          )}
        />

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
              <div>
                <label className="block text-sm font-medium">Search</label>
                <input
                  className="w-full border rounded-md p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  placeholder="Guard/Site/Shift name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Zone</label>
                <select
                  className="w-full border rounded-md p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  value={zoneId as any}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setZoneId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">All</option>
                  {zones.map((z: any) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Supervisor</label>
                <select
                  className="w-full border rounded-md p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  value={supervisorId as any}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupervisorId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">All</option>
                  {supervisors.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Site</label>
                <select
                  className="w-full border rounded-md p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  value={siteId as any}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">All</option>
                  {sites.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Guard Type</label>
                <select
                  className="w-full border rounded-md p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  value={guardType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGuardType(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="permanent">Standard</option>
                  <option value="standby">Standby</option>
                  <option value="reliever">Reliever</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Date From</label>
                <input
                  type="date"
                  className="w-full border rounded-md p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Date To</label>
                <input
                  type="date"
                  className="w-full border rounded-md p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <Button type="button" onClick={applyFilters} className="px-3 py-2">Apply</Button>
              <button type="button" onClick={resetFilters} className="px-3 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Reset</button>
            </div>
            {Boolean(search || zoneId || supervisorId || siteId || dateFrom || dateTo || guardType) && (
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Active:</span>
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { search: '', zone_id: zoneId, supervisor_id: supervisorId, site_id: siteId, date_from: dateFrom, date_to: dateTo } as any;
                      setSearch('');
                      const params: any = {};
                      if (next.zone_id) params.zone_id = next.zone_id;
                      if (next.supervisor_id) params.supervisor_id = next.supervisor_id;
                      if (next.site_id) params.site_id = next.site_id;
                      if (next.date_from) params.date_from = next.date_from;
                      if (next.date_to) params.date_to = next.date_to;
                      try { localStorage.setItem(storageKey, JSON.stringify(params)); } catch {}
                      router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 text-xs"
                  >
                    Search: {search}
                    <span className="text-gray-500 dark:text-gray-300">×</span>
                  </button>
                )}
                {guardType && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { search, zone_id: zoneId, supervisor_id: supervisorId, site_id: siteId, date_from: dateFrom, date_to: dateTo, guard_type: '' } as any;
                      setGuardType('');
                      const params: any = {};
                      if (next.search) params.search = next.search;
                      if (next.zone_id) params.zone_id = next.zone_id;
                      if (next.supervisor_id) params.supervisor_id = next.supervisor_id;
                      if (next.site_id) params.site_id = next.site_id;
                      if (next.date_from) params.date_from = next.date_from;
                      if (next.date_to) params.date_to = next.date_to;
                      try { localStorage.setItem(storageKey, JSON.stringify(params)); } catch {}
                      router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 text-xs"
                  >
                    Type: {guardType === 'permanent' ? 'Standard' : guardType.charAt(0).toUpperCase() + guardType.slice(1)}
                    <span className="text-gray-500 dark:text-gray-300">×</span>
                  </button>
                )}
                {zoneId && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { search, zone_id: '', supervisor_id: supervisorId, site_id: siteId, date_from: dateFrom, date_to: dateTo, guard_type: guardType } as any;
                      setZoneId('');
                      const params: any = {};
                      if (next.search) params.search = next.search;
                      if (next.supervisor_id) params.supervisor_id = next.supervisor_id;
                      if (next.site_id) params.site_id = next.site_id;
                      if (next.date_from) params.date_from = next.date_from;
                      if (next.date_to) params.date_to = next.date_to;
                      if (next.guard_type) params.guard_type = next.guard_type;
                      try { localStorage.setItem(storageKey, JSON.stringify(params)); } catch {}
                      router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 text-xs"
                  >
                    Zone: {(() => { const z = zones.find((x: any) => x.id === zoneId); return z ? z.name : zoneId; })()}
                    <span className="text-gray-500 dark:text-gray-300">×</span>
                  </button>
                )}
                {supervisorId && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { search, zone_id: zoneId, supervisor_id: '', site_id: siteId, date_from: dateFrom, date_to: dateTo, guard_type: guardType } as any;
                      setSupervisorId('');
                      const params: any = {};
                      if (next.search) params.search = next.search;
                      if (next.zone_id) params.zone_id = next.zone_id;
                      if (next.site_id) params.site_id = next.site_id;
                      if (next.date_from) params.date_from = next.date_from;
                      if (next.date_to) params.date_to = next.date_to;
                      if (next.guard_type) params.guard_type = next.guard_type;
                      try { localStorage.setItem(storageKey, JSON.stringify(params)); } catch {}
                      router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 text-xs"
                  >
                    Supervisor: {(() => { const z = supervisors.find((x: any) => x.id === supervisorId); return z ? z.name : supervisorId; })()}
                    <span className="text-gray-500 dark:text-gray-300">×</span>
                  </button>
                )}
                {siteId && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { search, zone_id: zoneId, supervisor_id: supervisorId, site_id: '', date_from: dateFrom, date_to: dateTo, guard_type: guardType } as any;
                      setSiteId('');
                      const params: any = {};
                      if (next.search) params.search = next.search;
                      if (next.zone_id) params.zone_id = next.zone_id;
                      if (next.supervisor_id) params.supervisor_id = next.supervisor_id;
                      if (next.date_from) params.date_from = next.date_from;
                      if (next.date_to) params.date_to = next.date_to;
                      if (next.guard_type) params.guard_type = next.guard_type;
                      try { localStorage.setItem(storageKey, JSON.stringify(params)); } catch {}
                      router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 text-xs"
                  >
                    Site: {(() => { const z = sites.find((x: any) => x.id === siteId); return z ? z.name : siteId; })()}
                    <span className="text-gray-500 dark:text-gray-300">×</span>
                  </button>
                )}
                {dateFrom && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { search, zone_id: zoneId, supervisor_id: supervisorId, site_id: siteId, date_from: '', date_to: dateTo, guard_type: guardType } as any;
                      setDateFrom('');
                      const params: any = {};
                      if (next.search) params.search = next.search;
                      if (next.zone_id) params.zone_id = next.zone_id;
                      if (next.supervisor_id) params.supervisor_id = next.supervisor_id;
                      if (next.site_id) params.site_id = next.site_id;
                      if (next.date_to) params.date_to = next.date_to;
                      if (next.guard_type) params.guard_type = next.guard_type;
                      try { localStorage.setItem(storageKey, JSON.stringify(params)); } catch {}
                      router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 text-xs"
                  >
                    From: {dateFrom}
                    <span className="text-gray-500 dark:text-gray-300">×</span>
                  </button>
                )}
                {dateTo && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { search, zone_id: zoneId, supervisor_id: supervisorId, site_id: siteId, date_from: dateFrom, date_to: '', guard_type: guardType } as any;
                      setDateTo('');
                      const params: any = {};
                      if (next.search) params.search = next.search;
                      if (next.zone_id) params.zone_id = next.zone_id;
                      if (next.supervisor_id) params.supervisor_id = next.supervisor_id;
                      if (next.site_id) params.site_id = next.site_id;
                      if (next.date_from) params.date_from = next.date_from;
                      if (next.guard_type) params.guard_type = next.guard_type;
                      try { localStorage.setItem(storageKey, JSON.stringify(params)); } catch {}
                      router.get(route('control-room.shifts.index'), params, { preserveScroll: true, preserveState: true, replace: true });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 text-xs"
                  >
                    To: {dateTo}
                    <span className="text-gray-500 dark:text-gray-300">×</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 text-xs"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Guard Shifts (Roster)</h3>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {guardShifts?.data?.map((s: any) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <span>{s.guard_relation?.name || 'Guard'} • {s.client_site?.name || 'Site'}</span>
                      {s.guard_relation?.guard_type && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.guard_relation.guard_type === 'reliever' ? 'bg-coin-700 text-white' : s.guard_relation.guard_type === 'standby' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'}`}>
                          {s.guard_relation.guard_type === 'permanent' ? 'Standard' : (s.guard_relation.guard_type.charAt(0).toUpperCase() + s.guard_relation.guard_type.slice(1))}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.date} • {s.start_time} - {s.end_time} • {s.shift_type}</div>
                  </div>
                  <div className="flex gap-2 text-xs text-gray-500">Scheduled</div>
                </div>
              ))}
              {(!guardShifts?.data || guardShifts.data.length === 0) && (
                <EmptyState
                  title="No guard shifts"
                  description="Shifts generated from the roster will appear here."
                  size="sm"
                  contentClassName="py-6"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Shift Templates</h3>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {scheduleShifts?.data?.map((s: any) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.start_time} - {s.end_time} • Required guards: {s.required_guards} {s.is_global ? '• General (all zones)' : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openViewModal(s.id)}
                      className="text-sm text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200 disabled:opacity-50"
                      disabled={loadingId === s.id}
                    >
                      {loadingId === s.id ? 'Opening…' : 'View'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
              {(!scheduleShifts?.data || scheduleShifts.data.length === 0) && (
                <EmptyState
                  title="No shift templates"
                  description="Create a shift template to start scheduling."
                  size="sm"
                  contentClassName="py-6"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <CreateShiftModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          supervisors={supervisors}
          sites={sites}
        />

        {editingShift && (
          <EditShiftModal
            open={editOpen}
            onClose={() => {
              setEditOpen(false);
              setEditingShift(null);
            }}
            shift={editingShift}
            supervisors={supervisors}
            sites={sites}
          />
        )}

        {viewData && (
          <ViewShiftModal
            open={viewOpen}
            onClose={() => {
              setViewOpen(false);
              setViewData(null);
            }}
            data={viewData}
          />
        )}
      </div>
    </ControlRoomLayout>
  );
}

type ShiftForm = {
  name: string;
  start_time: string;
  end_time: string;
  description: string;
  supervisor_id: number | '';
  sites: number[];
  status?: string;
  is_global?: boolean;
};

interface CreateShiftModalProps {
  open: boolean;
  onClose: () => void;
  supervisors: any[];
  sites: any[];
}

function CreateShiftModal({ open, onClose, supervisors, sites }: { open: boolean; onClose: () => void; supervisors: any[]; sites: any[]; }) {
  const { data, setData, post, processing, errors, reset } = useForm<ShiftForm>({
    name: '',
    start_time: '06:00',
    end_time: '18:00',
    description: '',
    supervisor_id: '',
    sites: [],
    is_global: false,
  });

  const [calcRequired, setCalcRequired] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (data.is_global || !(data.sites || []).length) {
      setCalcRequired(null);
      return;
    }
    const controller = new AbortController();
    const run = async () => {
      setCalcLoading(true);
      try {
        const base = route('control-room.shifts.required-guards');
        const params = new URLSearchParams();
        (data.sites as any[]).forEach((id) => params.append('sites[]', String(id)));
        const res = await fetch(`${base}?${params.toString()}`, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          setCalcRequired(Number(json.required_guards) || 0);
        }
      } catch {}
      finally { setCalcLoading(false); }
    };
    run();
    return () => controller.abort();
  }, [open, data.is_global, data.sites]);

  const toggleSite = (siteId: number) => {
    const current = new Set(data.sites as any[]);
    if (current.has(siteId)) current.delete(siteId); else current.add(siteId);
    setData('sites', Array.from(current) as any);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.shifts.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Shift</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Supervisor</label>
            <select
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.supervisor_id as any}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setData('supervisor_id', e.target.value ? Number(e.target.value) : '')
              }
            >
              <option value="">Select supervisor</option>
              {supervisors.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supervisor_id && <p className="text-sm text-red-600">{errors.supervisor_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>
          <div className="sm:col-span-2 text-xs text-gray-500 dark:text-gray-400">
            Required guards will be calculated automatically from selected site assignments.
            {!data.is_global && (data.sites || []).length > 0 && (
              <span className="ml-2">{calcLoading ? 'Calculating…' : `(Estimated: ${calcRequired ?? 0})`}</span>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={!!data.is_global}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setData('is_global', checked);
                  if (checked) setData('sites', [] as any);
                }}
              />
              <span>General shift (applies to all zones)</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Sites</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2 dark:border-gray-800">
              {sites.map((s: any) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={!!data.is_global}
                    checked={(data.sites as any[]).includes(s.id)}
                    onChange={() => toggleSite(s.id)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              rows={3}
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-800 disabled:bg-gray-400"
            >
              {processing ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface EditShiftModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
  supervisors: any[];
  sites: any[];
}

function EditShiftModal({ open, onClose, shift, supervisors, sites }: EditShiftModalProps) {
  const { data, setData, put, processing, errors, reset } = useForm<ShiftForm>({
    name: shift.name,
    start_time: shift.start_time,
    end_time: shift.end_time,
    description: shift.description ?? '',
    supervisor_id: shift.supervisor_id ?? '',
    sites: Array.isArray(shift.sites) ? (shift.sites as any[]) : [],
    status: shift.status ?? 'active',
    is_global: !!shift.is_global,
  });

  const [calcRequired, setCalcRequired] = useState<number | null>(shift.required_guards ?? null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (data.is_global || !(data.sites || []).length) {
      setCalcRequired(null);
      return;
    }
    const controller = new AbortController();
    const run = async () => {
      setCalcLoading(true);
      try {
        const base = route('control-room.shifts.required-guards');
        const params = new URLSearchParams();
        (data.sites as any[]).forEach((id) => params.append('sites[]', String(id)));
        const res = await fetch(`${base}?${params.toString()}`, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          setCalcRequired(Number(json.required_guards) || 0);
        }
      } catch {}
      finally { setCalcLoading(false); }
    };
    run();
    return () => controller.abort();
  }, [open, data.is_global, data.sites]);

  const toggleSite = (siteId: number) => {
    const current = new Set(data.sites as any[]);
    if (current.has(siteId)) current.delete(siteId); else current.add(siteId);
    setData('sites', Array.from(current) as any);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('control-room.shifts.update', shift.id), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Shift</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Supervisor</label>
            <select
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.supervisor_id as any}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setData('supervisor_id', e.target.value ? Number(e.target.value) : '')
              }
            >
              <option value="">Select supervisor</option>
              {supervisors.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supervisor_id && <p className="text-sm text-red-600">{errors.supervisor_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Required guards is calculated automatically from selected site assignments.
            {!data.is_global && (data.sites || []).length > 0 && (
              <span className="ml-2">{calcLoading ? 'Calculating…' : `(Estimated: ${calcRequired ?? 0})`}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={!!data.is_global}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setData('is_global', checked);
                  if (checked) setData('sites', [] as any);
                }}
              />
              <span>General shift (applies to all zones)</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Sites</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2 dark:border-gray-800">
              {sites.map((s: any) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={!!data.is_global}
                    checked={(data.sites as any[]).includes(s.id)}
                    onChange={() => toggleSite(s.id)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              rows={3}
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-800 disabled:bg-gray-400"
            >
              {processing ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface ViewShiftModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

function ViewShiftModal({ open, onClose, data }: ViewShiftModalProps) {
  const shift: Shift = data.shift;
  const sitesMap = data.sitesMap || {};

  const sitesLabel = (() => {
    if (shift.is_global) return 'General (all zones)';
    const ids = Array.isArray(shift.sites) ? shift.sites : [];
    if (ids.length === 0) return '';
    const names = ids.map((id: any) => sitesMap[id] || id).filter(Boolean);
    return names.join(', ');
  })();

  return (
    <Modal show={open} onClose={onClose} maxWidth="xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Shift • {shift.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Time</div>
            <div className="text-gray-900 dark:text-gray-100">{shift.start_time} - {shift.end_time}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Required Guards</div>
            <div className="text-gray-900 dark:text-gray-100">{shift.required_guards}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Supervisor</div>
            <div className="text-gray-900 dark:text-gray-100">{shift.supervisor?.name}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Status</div>
            <div className="text-gray-900 dark:text-gray-100 capitalize">{shift.status}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="font-medium text-gray-700 dark:text-gray-300">Sites</div>
            <div className="text-gray-900 dark:text-gray-100">{sitesLabel || '—'}</div>
          </div>
        </div>

        {shift.description && (
          <div className="text-sm">
            <div className="font-medium text-gray-700 dark:text-gray-300">Description</div>
            <div className="text-gray-900 dark:text-gray-100 mt-1">{shift.description}</div>
          </div>
        )}

        <div className="text-sm">
          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Guards</div>
          <div className="space-y-1">
            {(!shift.guards || shift.guards.length === 0) && (
              <EmptyState
                title="No guards assigned"
                description="Assign guards to this shift to display them here."
                size="sm"
                contentClassName="py-4"
              />
            )}
            {shift.guards && shift.guards.map((g: any) => (
              <div key={g.id} className="flex items-center justify-between border rounded px-3 py-1 dark:border-gray-700">
                <div className="text-gray-900 dark:text-gray-100">{g.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t flex justify-end text-sm dark:bg-gray-950 dark:border-gray-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-coin-700 text-white hover:bg-coin-800"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
