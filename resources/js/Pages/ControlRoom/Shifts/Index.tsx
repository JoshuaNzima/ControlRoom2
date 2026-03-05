import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';

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
  const { guardShifts = { data: [] }, scheduleShifts = { data: [] }, supervisors = [], sites = [], zones = [], guards = [], filters = {} } = usePage().props as any;

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const [selectedGuardShiftIds, setSelectedGuardShiftIds] = useState<Record<number, boolean>>({});
  const selectedGuardShiftIdList = Object.entries(selectedGuardShiftIds).filter(([, v]) => !!v).map(([k]) => Number(k));
  const [guardShiftViewOpen, setGuardShiftViewOpen] = useState(false);
  const [guardShiftEditOpen, setGuardShiftEditOpen] = useState(false);
  const [guardShiftCancelOpen, setGuardShiftCancelOpen] = useState(false);
  const [activeGuardShift, setActiveGuardShift] = useState<any | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [search, setSearch] = useState<string>(filters.search ?? '');
  const [zoneId, setZoneId] = useState<number | ''>(filters.zone_id ?? '');
  const [supervisorId, setSupervisorId] = useState<number | ''>(filters.supervisor_id ?? '');
  const [siteId, setSiteId] = useState<number | ''>(filters.site_id ?? '');
  const [dateFrom, setDateFrom] = useState<string>(filters.date_from ?? '');
  const [dateTo, setDateTo] = useState<string>(filters.date_to ?? '');
  const [guardType, setGuardType] = useState<string>(filters.guard_type ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const storageKey = 'controlroom_shifts_filters';

  const didInitFromStorageRef = useRef(false);

  useEffect(() => {
    const qp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const create = qp.get('create_shift');
    const edit = qp.get('edit_shift');
    const view = qp.get('view_shift');

    if (create) {
      setCreateOpen(true);
      router.get(route('control-room.shifts.index'), {}, { preserveScroll: true, preserveState: true, replace: true });
      return;
    }

    if (edit) {
      const id = Number(edit);
      const shift = (scheduleShifts?.data || []).find((s: any) => Number(s.id) === id);
      if (shift) {
        setEditingShift(shift);
        setEditOpen(true);
      }
      router.get(route('control-room.shifts.index'), {}, { preserveScroll: true, preserveState: true, replace: true });
      return;
    }

    if (view) {
      const id = Number(view);
      if (id) {
        openViewModal(id);
      }
      router.get(route('control-room.shifts.index'), {}, { preserveScroll: true, preserveState: true, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const openGuardShiftView = async (id: number) => {
    setLoadingId(id);
    try {
      const res = await fetch(route('control-room.guard-shifts.show', id), {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setActiveGuardShift(json?.shift ?? null);
      setGuardShiftViewOpen(true);
    } catch {
      router.visit(route('control-room.guard-shifts.show', id));
    } finally {
      setLoadingId(null);
    }
  };

  const toggleGuardShiftSel = (id: number) => setSelectedGuardShiftIds((prev) => ({ ...prev, [id]: !prev[id] }));
  const clearGuardShiftSel = () => setSelectedGuardShiftIds({});

  return (
    <ControlRoomLayout title="Shift Management">
      <Head title="Shift Management" />
      <div className="space-y-4">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-coin-700 via-coin-600 to-coin-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <IconMapper name="Clock" size={28} />
                Shift Management
              </h1>
              <p className="mt-1 text-coin-100 text-sm">
                Manage shift templates and roster-based scheduled shifts
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-white text-coin-700 hover:bg-coin-50 font-semibold shadow-md transition-all"
            >
              <IconMapper name="Plus" size={18} className="mr-2" />
              Create Shift
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-xs text-coin-100">Total Templates</div>
              <div className="text-2xl font-bold">{scheduleShifts?.data?.length || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-xs text-coin-100">Scheduled Shifts</div>
              <div className="text-2xl font-bold">{guardShifts?.data?.length || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-xs text-coin-100">Selected</div>
              <div className="text-2xl font-bold">{selectedGuardShiftIdList.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-xs text-coin-100">Supervisors</div>
              <div className="text-2xl font-bold">{supervisors.length}</div>
            </div>
          </div>
        </div>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            {/* Mobile Filter Toggle */}
            <div className="sm:hidden flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <IconMapper name="Filter" size={16} />
                Filters
                {(search || zoneId || supervisorId || siteId || dateFrom || dateTo || guardType) && (
                  <span className="bg-coin-700 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {[search, zoneId, supervisorId, siteId, dateFrom, dateTo, guardType].filter(Boolean).length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="text-sm text-coin-700 dark:text-coin-300 hover:underline"
              >
                {filtersOpen ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                  <div className="relative">
                    <IconMapper name="Search" size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 pl-9 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                      placeholder="Guard/Site/Shift name"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    value={zoneId as any}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setZoneId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">All Zones</option>
                    {zones.map((z: any) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor</label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    value={supervisorId as any}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupervisorId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">All Supervisors</option>
                    {supervisors.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site</label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    value={siteId as any}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">All Sites</option>
                    {sites.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guard Type</label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    value={guardType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGuardType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="permanent">Standard</option>
                    <option value="standby">Standby</option>
                    <option value="reliever">Reliever</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Button type="button" onClick={applyFilters} className="px-4 py-2 bg-coin-700 hover:bg-coin-600 text-white">
                  <IconMapper name="Search" size={16} className="mr-2" />
                  Apply Filters
                </Button>
                <button type="button" onClick={resetFilters} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                  Reset
                </button>
              </div>
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs"
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs"
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs"
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs"
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs"
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs"
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs"
                  >
                    To: {dateTo}
                    <span className="text-gray-500 dark:text-gray-300">×</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 text-xs"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <IconMapper name="Calendar" size={20} className="text-coin-600" />
                  Guard Shifts (Roster)
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedGuardShiftIdList.length > 0 
                    ? `${selectedGuardShiftIdList.length} of ${guardShifts?.data?.length || 0} shifts selected`
                    : `${guardShifts?.data?.length || 0} scheduled shifts`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="dark:bg-gray-800 dark:hover:bg-gray-700 text-sm"
                  disabled={!selectedGuardShiftIdList.length}
                  onClick={() => setBulkOpen(true)}
                >
                  <IconMapper name="Layers" size={14} className="mr-1.5" />
                  Bulk Actions
                </Button>
                <button
                  type="button"
                  onClick={clearGuardShiftSel}
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  disabled={!selectedGuardShiftIdList.length}
                >
                  Clear
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {guardShifts?.data?.map((s: any) => (
                <div 
                  key={s.id} 
                  className={`group relative rounded-xl border transition-all duration-200 ${
                    selectedGuardShiftIds[s.id] 
                      ? 'border-coin-500 bg-coin-50 dark:bg-coin-950/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-coin-300 dark:hover:border-coin-700'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Checkbox + Main Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-coin-600 focus:ring-coin-500"
                          checked={!!selectedGuardShiftIds[s.id]}
                          onChange={() => toggleGuardShiftSel(s.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {s.guard_relation?.name || 'Unassigned'}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-400 truncate">
                              {s.client_site?.name || 'No Site'}
                            </span>
                            {s.guard_relation?.guard_type && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                s.guard_relation.guard_type === 'reliever' 
                                  ? 'bg-coin-100 text-coin-700 dark:bg-coin-900/30 dark:text-coin-300' 
                                  : s.guard_relation.guard_type === 'standby' 
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' 
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {s.guard_relation.guard_type === 'permanent' ? 'Standard' : s.guard_relation.guard_type.charAt(0).toUpperCase() + s.guard_relation.guard_type.slice(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <IconMapper name="Calendar" size={14} />
                              {s.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <IconMapper name="Clock" size={14} />
                              {s.start_time} - {s.end_time}
                            </span>
                            {s.shift_type && (
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                {s.shift_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center gap-2 sm:justify-end">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                          s.status === 'completed' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : s.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : s.status === 'cancelled'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {s.status || 'Scheduled'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openGuardShiftView(s.id)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                            disabled={loadingId === s.id}
                            title="View"
                          >
                            <IconMapper name="Eye" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setActiveGuardShift(s); setGuardShiftEditOpen(true); }}
                            className="p-1.5 rounded-md text-coin-600 hover:text-coin-700 hover:bg-coin-50 dark:text-coin-400 dark:hover:text-coin-300 dark:hover:bg-coin-950/30 transition-colors"
                            title="Edit"
                          >
                            <IconMapper name="Pencil" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setActiveGuardShift(s); setGuardShiftCancelOpen(true); }}
                            className="p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 transition-colors"
                            title="Cancel"
                          >
                            <IconMapper name="X" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!guardShifts?.data || guardShifts.data.length === 0) && (
                <EmptyState
                  title="No guard shifts"
                  description="Shifts generated from the roster will appear here."
                  size="sm"
                  contentClassName="py-8"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <GuardShiftViewModal
          open={guardShiftViewOpen}
          onClose={() => { setGuardShiftViewOpen(false); setActiveGuardShift(null); }}
          shift={activeGuardShift}
        />

        <GuardShiftEditModal
          open={guardShiftEditOpen}
          onClose={() => { setGuardShiftEditOpen(false); setActiveGuardShift(null); }}
          shift={activeGuardShift}
          guards={guards}
          sites={sites}
          onSuccess={() => router.reload()}
        />

        <GuardShiftCancelModal
          open={guardShiftCancelOpen}
          onClose={() => { setGuardShiftCancelOpen(false); setActiveGuardShift(null); }}
          shift={activeGuardShift}
          onSuccess={() => router.reload()}
        />

        <GuardShiftBulkModal
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
          shiftIds={selectedGuardShiftIdList}
          guards={guards}
          sites={sites}
          onSuccess={() => { setBulkOpen(false); clearGuardShiftSel(); router.reload(); }}
        />

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <IconMapper name="ClipboardList" size={20} className="text-coin-600" />
                  Shift Templates
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {scheduleShifts?.data?.length || 0} shift templates available
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="bg-coin-700 hover:bg-coin-600 text-white text-sm"
              >
                <IconMapper name="Plus" size={14} className="mr-1.5" />
                New Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {scheduleShifts?.data?.map((s: any) => (
                <div 
                  key={s.id} 
                  className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-coin-300 dark:hover:border-coin-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={s.name}>
                          {s.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <IconMapper name="Clock" size={14} />
                          <span>{s.start_time} - {s.end_time}</span>
                        </div>
                      </div>
                      {s.is_global && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-coin-100 text-coin-700 dark:bg-coin-900/30 dark:text-coin-300 font-medium">
                          Global
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <IconMapper name="Users" size={14} />
                          {s.required_guards || 0} guards required
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openViewModal(s.id)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                          disabled={loadingId === s.id}
                          title="View"
                        >
                          <IconMapper name="Eye" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-md text-coin-600 hover:text-coin-700 hover:bg-coin-50 dark:text-coin-400 dark:hover:text-coin-300 dark:hover:bg-coin-950/30 transition-colors"
                          title="Edit"
                        >
                          <IconMapper name="Pencil" size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(!scheduleShifts?.data || scheduleShifts.data.length === 0) && (
              <EmptyState
                title="No shift templates"
                description="Create a shift template to start scheduling."
                size="sm"
                contentClassName="py-8"
              />
            )}
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
  required_guards: number | null;
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
    required_guards: null,
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Supervisor</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="time"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Required Guards</label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.required_guards ?? ''}
              onChange={(e) => setData('required_guards', e.target.value === '' ? null : Number(e.target.value))}
            />
            {errors.required_guards && <p className="text-sm text-red-600">{errors.required_guards}</p>}
          </div>
          <div className="sm:col-span-2 text-xs text-gray-500 dark:text-gray-400">
            {!data.is_global && (data.sites || []).length > 0 && (
              <span>
                {calcLoading ? 'Calculating suggestion…' : `Suggested from current assigned guards: ${calcRequired ?? 0}`}
                {data.required_guards == null && !calcLoading && (
                  <button
                    type="button"
                    onClick={() => setData('required_guards', Number(calcRequired ?? 0))}
                    className="ml-2 text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200"
                  >
                    Use suggested
                  </button>
                )}
              </span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border border-gray-200 dark:border-gray-800 rounded p-2 bg-white dark:bg-gray-950">
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
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
              className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:bg-gray-400"
            >
              {processing ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function GuardShiftViewModal({ open, onClose, shift }: { open: boolean; onClose: () => void; shift: any | null }) {
  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Guard Shift</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {!shift ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No data.</div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Guard:</span> {shift.guard_relation?.name ?? shift.guardRelation?.name ?? '—'}</div>
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Site:</span> {shift.client_site?.name ?? shift.clientSite?.name ?? '—'}</div>
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Date:</span> {String(shift.date ?? '').substring(0, 10) || '—'}</div>
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Time:</span> {String(shift.start_time)} - {String(shift.end_time)}</div>
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Type:</span> {shift.shift_type}</div>
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Status:</span> {shift.status}</div>
            {shift.reason_for_cancellation ? (
              <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Cancel reason:</span> {shift.reason_for_cancellation}</div>
            ) : null}
            {shift.notes ? (
              <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Notes:</span> {shift.notes}</div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}

function GuardShiftEditModal({ open, onClose, shift, guards, sites, onSuccess }: { open: boolean; onClose: () => void; shift: any | null; guards: any[]; sites: any[]; onSuccess: () => void }) {
  const { data, setData, put, processing, errors, reset } = useForm<{ guard_id: number | ''; client_site_id: number | ''; notes: string }>({
    guard_id: '',
    client_site_id: '',
    notes: '',
  });

  useEffect(() => {
    if (!open) return;
    if (!shift) return;
    setData({
      guard_id: shift.guard_id ?? shift.guard_relation?.id ?? '',
      client_site_id: shift.client_site_id ?? shift.client_site?.id ?? '',
      notes: shift.notes ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shift?.id]);

  const locked = shift && ['in_progress', 'completed'].includes(String(shift.status));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift?.id) return;
    put(route('control-room.guard-shifts.update', shift.id), {
      preserveScroll: true,
      onSuccess: () => {
        onSuccess();
        reset();
        onClose();
      },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Guard Shift</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        {locked ? (
          <div className="mb-3 text-sm text-red-600">This shift is locked and cannot be edited.</div>
        ) : null}
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Guard</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.guard_id as any}
              onChange={(e) => setData('guard_id', e.target.value ? Number(e.target.value) : '')}
              disabled={processing || locked}
            >
              <option value="">Select guard</option>
              {guards.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>
              ))}
            </select>
            {errors.guard_id && <p className="text-sm text-red-600">{errors.guard_id as any}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Site</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.client_site_id as any}
              onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}
              disabled={processing || locked}
            >
              <option value="">Select site</option>
              {sites.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.client_site_id && <p className="text-sm text-red-600">{errors.client_site_id as any}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Notes</label>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
              disabled={processing || locked}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes as any}</p>}
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || locked || !data.guard_id || !data.client_site_id} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function GuardShiftCancelModal({ open, onClose, shift, onSuccess }: { open: boolean; onClose: () => void; shift: any | null; onSuccess: () => void }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ reason: string }>({ reason: '' });

  useEffect(() => {
    if (!open) return;
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shift?.id]);

  const locked = shift && ['in_progress', 'completed'].includes(String(shift.status));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift?.id) return;
    post(route('control-room.guard-shifts.cancel', shift.id), {
      preserveScroll: true,
      onSuccess: () => {
        onSuccess();
        reset();
        onClose();
      },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cancel Shift</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        {locked ? (
          <div className="mb-3 text-sm text-red-600">This shift is locked and cannot be cancelled.</div>
        ) : null}
        <form className="space-y-3" onSubmit={submit}>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            {shift?.guard_relation?.name || 'Guard'} • {shift?.client_site?.name || 'Site'} • {String(shift?.date ?? '').substring(0, 10)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Reason</label>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              rows={3}
              value={data.reason}
              onChange={(e) => setData('reason', e.target.value)}
              disabled={processing || locked}
            />
            {errors.reason && <p className="text-sm text-red-600">{errors.reason as any}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Close</button>
            <button type="submit" disabled={processing || locked || !data.reason.trim()} className="px-4 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-600 disabled:opacity-50">Cancel Shift</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function GuardShiftBulkModal({ open, onClose, shiftIds, guards, sites, onSuccess }: { open: boolean; onClose: () => void; shiftIds: number[]; guards: any[]; sites: any[]; onSuccess: () => void }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ action: 'cancel' | 'reassign_guard' | 'reassign_site'; reason: string; guard_id: number | ''; client_site_id: number | '' }>({
    action: 'cancel',
    reason: '',
    guard_id: '',
    client_site_id: '',
  });

  useEffect(() => {
    if (!open) return;
    reset();
    setData('action', 'cancel');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(
      route('control-room.guard-shifts.bulk'),
      {
        shift_ids: shiftIds,
        action: data.action,
        reason: data.action === 'cancel' ? data.reason : undefined,
        guard_id: data.action === 'reassign_guard' ? data.guard_id : undefined,
        client_site_id: data.action === 'reassign_site' ? data.client_site_id : undefined,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  };

  const needsReason = data.action === 'cancel';
  const needsGuard = data.action === 'reassign_guard';
  const needsSite = data.action === 'reassign_site';

  const disabled =
    processing ||
    !shiftIds.length ||
    (needsReason && !data.reason.trim()) ||
    (needsGuard && !data.guard_id) ||
    (needsSite && !data.client_site_id);

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Actions</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <div className="text-sm text-gray-700 dark:text-gray-200">{shiftIds.length} shift(s) selected</div>
        <form className="mt-3 space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Action</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.action}
              onChange={(e) => setData('action', e.target.value as any)}
              disabled={processing}
            >
              <option value="cancel">Cancel</option>
              <option value="reassign_guard">Reassign Guard</option>
              <option value="reassign_site">Reassign Site</option>
            </select>
            {errors.action && <p className="text-sm text-red-600">{errors.action as any}</p>}
          </div>

          {needsReason ? (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Reason</label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                rows={3}
                value={data.reason}
                onChange={(e) => setData('reason', e.target.value)}
                disabled={processing}
              />
              {errors.reason && <p className="text-sm text-red-600">{errors.reason as any}</p>}
            </div>
          ) : null}

          {needsGuard ? (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Guard</label>
              <select
                className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                value={data.guard_id as any}
                onChange={(e) => setData('guard_id', e.target.value ? Number(e.target.value) : '')}
                disabled={processing}
              >
                <option value="">Select guard</option>
                {guards.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>
                ))}
              </select>
              {errors.guard_id && <p className="text-sm text-red-600">{errors.guard_id as any}</p>}
            </div>
          ) : null}

          {needsSite ? (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Site</label>
              <select
                className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                value={data.client_site_id as any}
                onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}
                disabled={processing}
              >
                <option value="">Select site</option>
                {sites.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.client_site_id && <p className="text-sm text-red-600">{errors.client_site_id as any}</p>}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Close</button>
            <button type="submit" disabled={disabled} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:opacity-50">Run</button>
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
    required_guards: shift.required_guards ?? null,
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Supervisor</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="time"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>
          <div className="sm:col-span-2 text-xs text-gray-500 dark:text-gray-400">
            {!data.is_global && (data.sites || []).length > 0 && (
              <span>
                {calcLoading ? 'Calculating suggestion…' : `Suggested from current assigned guards: ${calcRequired ?? 0}`}
                {data.required_guards == null && !calcLoading && (
                  <button
                    type="button"
                    onClick={() => setData('required_guards', Number(calcRequired ?? 0))}
                    className="ml-2 text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200"
                  >
                    Use suggested
                  </button>
                )}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Required Guards</label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              value={data.required_guards ?? ''}
              onChange={(e) => setData('required_guards', e.target.value === '' ? null : Number(e.target.value))}
            />
            {errors.required_guards && <p className="text-sm text-red-600">{errors.required_guards}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border border-gray-200 dark:border-gray-800 rounded p-2 bg-white dark:bg-gray-950">
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
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
              className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:bg-gray-400"
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
