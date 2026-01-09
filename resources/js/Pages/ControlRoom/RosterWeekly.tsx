import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import Modal from '@/Components/Modal';
import useToast from '@/Components/ui/use-toast';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';

type DayKey = string; // YYYY-MM-DD

type Site = { id: number; name: string };

type GuardWeekly = {
  id: number;
  name: string;
  employee_id?: string;
  guard_type?: 'permanent' | 'standby' | 'reliever' | string;
  sites: Record<DayKey, Site | null>;
  off: Record<DayKey, boolean>;
};

type RelieverWeekly = {
  id: number;
  name: string;
  employee_id?: string;
  sites: Record<DayKey, Site | null>;
};

type WeeklyData = {
  days: DayKey[];
  guards: GuardWeekly[];
  relievers: RelieverWeekly[];
  sites: Site[];
  active_sites?: Site[];
};

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return el?.content || '';
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function StandbyTable({ data, onRefresh }: { data: WeeklyData; onRefresh: () => void }) {
  const dayLabels = useMemo(() => data.days.map((d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })), [data.days]);
  const [offModal, setOffModal] = useState<{ open: boolean; guardId?: number; date?: string }>({ open: false });
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [bulkOffOpen, setBulkOffOpen] = useState(false);

  const toggleSel = (id: number) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const selectedIds = Object.entries(selected).filter(([_, v]) => !!v).map(([k]) => Number(k));

  const standbyGuards = (data.guards || []).filter((g) => (g.guard_type || 'permanent') === 'standby');
  if (!standbyGuards.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Standby Guards</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">Click a day to add off-day</div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">Select guards then bulk mark OFF</div>
        <button disabled={!selectedIds.length} onClick={() => setBulkOffOpen(true)} className={`w-full sm:w-auto px-3 py-1.5 rounded-md text-white ${selectedIds.length ? 'bg-coin-700 hover:bg-coin-600' : 'bg-gray-400 cursor-not-allowed'}`}>Bulk Off-day</button>
      </div>

      <div className="md:hidden space-y-2">
        {standbyGuards.map((g) => (
          <div key={g.id} className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="flex items-start justify-between gap-3">
              <label className="inline-flex items-start gap-2">
                <input className="mt-1 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSel(g.id)} />
                <span className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                    {g.name} {g.employee_id ? <span className="text-xs text-gray-500">({g.employee_id})</span> : null}
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Standby</span>
                  </div>
                </span>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.days.map((d, idx) => {
                const off = !!g.off?.[d];
                const site = g.sites?.[d];
                return (
                  <button
                    key={d}
                    type="button"
                    className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md border text-sm ${off ? 'bg-gray-800 text-gray-100 border-gray-700' : site ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'}`}
                    onClick={() => setOffModal({ open: true, guardId: g.id, date: d })}
                    title="Add off-day"
                  >
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dayLabels[idx]}</span>
                    <span className="font-semibold truncate">{off ? 'OFF' : (site ? site.name : '—')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border dark:border-gray-800 rounded-md">
        <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Guard</th>
              {dayLabels.map((lbl, idx) => (
                <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-900 bg-white dark:bg-gray-900">
            {standbyGuards.map((g) => (
              <tr key={g.id}>
                <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                  <label className="inline-flex items-center gap-2">
                    <input className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSel(g.id)} />
                    <span className="inline-flex items-center gap-2">
                      <span>{g.name} {g.employee_id ? <span className="text-xs text-gray-500">({g.employee_id})</span> : null}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Standby</span>
                    </span>
                  </label>
                </td>
                {data.days.map((d) => {
                  const off = !!g.off?.[d];
                  const site = g.sites?.[d];
                  return (
                    <td key={d} className="px-3 py-2 text-sm">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs ${off ? 'bg-gray-800 text-gray-100 border-gray-700' : site ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800'}`}
                        onClick={() => setOffModal({ open: true, guardId: g.id, date: d })}
                        title="Add off-day"
                      >
                        {off ? 'OFF' : (site ? site.name : '—')}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddOffDayModal
        open={offModal.open}
        onClose={() => setOffModal({ open: false })}
        guardId={offModal.guardId}
        date={offModal.date}
        onSaved={() => { setOffModal({ open: false }); onRefresh(); }}
      />

      <BulkOffModal
        open={bulkOffOpen}
        onClose={() => setBulkOffOpen(false)}
        guardIds={selectedIds}
        onSaved={() => { setBulkOffOpen(false); onRefresh(); }}
      />
    </div>
  );
}

function GenerateShiftsPanel({ weekStart, zoneId, supervisorId }: { weekStart: Date; zoneId: number | ''; supervisorId: number | '' }) {
  const { toast } = useToast();
  const { data, setData, post, processing } = useForm<{ start: string; start_time: string; end_time: string; shift_type?: 'day' | 'night'; include_relievers?: boolean; include_standby?: boolean; zone_id?: number | ''; supervisor_id?: number | '' }>({
    start: formatYmd(weekStart),
    start_time: '06:00',
    end_time: '18:00',
    shift_type: 'day',
    include_relievers: false,
    include_standby: true,
    zone_id: zoneId,
    supervisor_id: supervisorId,
  });

  useEffect(() => {
    setData('start', formatYmd(weekStart));
    setData('zone_id', zoneId);
    setData('supervisor_id', supervisorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.getTime(), zoneId, supervisorId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.roster.generate-shifts'), {
      onSuccess: () => { toast({ title: 'Shifts generated', description: 'Guard shifts created from roster for the selected week.' }); },
    });
  };

  return (
    <div className="border rounded-md dark:border-gray-800">
      <div className="px-4 py-3 border-b dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Generate Shifts from Roster (Week of {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})</h3>
        </div>
      </div>
      <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-sm">Start Time</label>
            <input type="time" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">End Time</label>
            <input type="time" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Type</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.shift_type as any} onChange={(e) => setData('shift_type', e.target.value as any)}>
              <option value="day">Day</option>
              <option value="night">Night</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <button type="button" className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs" onClick={() => { setData('shift_type','day'); setData('start_time','06:00'); setData('end_time','18:00'); }}>Day Preset</button>
            <button type="button" className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs" onClick={() => { setData('shift_type','night'); setData('start_time','18:00'); setData('end_time','06:00'); }}>Night Preset</button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm mt-2 sm:mt-6">
              <input type="checkbox" checked={!!data.include_relievers} onChange={(e) => setData('include_relievers', e.target.checked)} />
              <span>Include relievers</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm mt-1 sm:mt-6">
              <input type="checkbox" checked={data.include_standby !== false} onChange={(e) => setData('include_standby', e.target.checked)} />
              <span>Include standby</span>
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={processing || !data.start_time || !data.end_time} className="w-full sm:w-auto px-3 py-2 rounded-md bg-coin-700 text-white hover:bg-coin-600 text-sm">Generate</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BundlesSection({ weekStart, zoneId, supervisorId, relievers, sites }: { weekStart: Date; zoneId: number | ''; supervisorId: number | ''; relievers: any[]; sites: Site[] }) {
  const [bundles, setBundles] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const applyForm = useForm<{ start: string }>({ start: formatYmd(weekStart) });

  const hasRelievers = Array.isArray(relievers) && relievers.length > 0;

  const loadBundles = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (zoneId) params.zone_id = zoneId;
      if (supervisorId) params.supervisor_id = supervisorId;
      const url = route('control-room.roster.bundles', params);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        setBundles(json.bundles || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBundles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId, supervisorId]);

  useEffect(() => {
    applyForm.setData('start', formatYmd(weekStart));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.getTime()]);

  const applyWeek = async (bundleId: number) => {
    applyForm.post(route('control-room.roster.bundles.apply-week', bundleId), {
      preserveScroll: true,
      onSuccess: () => { toast({ title: 'Bundle applied', description: 'Reliever rotation applied for the week.' }); },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bundles (6 sites + 1 reliever)</h3>
        <button
          type="button"
          disabled={!hasRelievers}
          className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-coin-700 text-white hover:bg-coin-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            if (!hasRelievers) return;
            setEditing(null);
            setCreateOpen(true);
          }}
        >
          New Bundle
        </button>
      </div>
      {!hasRelievers ? (
        <EmptyState
          title="No relievers available"
          description="Bundles can’t be created for the current zone/supervisor scope."
          size="sm"
          contentClassName="py-2"
        />
      ) : null}
      {loading && (
        <EmptyState
          title="Loading bundles"
          description="Fetching bundle configuration…"
          size="sm"
          contentClassName="py-2"
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bundles.map((b) => (
          <div key={b.id} className="border rounded-md p-3 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Reliever: {b.reliever?.name || '—'}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800" onClick={() => { setEditing(b); setCreateOpen(true); }}>Edit</button>
                <DeleteBundleButton id={b.id} onDone={loadBundles} />
                <button type="button" className="text-xs px-2 py-1 rounded-md bg-coin-700 text-white hover:bg-coin-600" onClick={() => applyWeek(b.id)}>Apply Week</button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              Sites: {b.sites && b.sites.length ? b.sites.map((s: any) => s.name).join(', ') : '—'}
            </div>
          </div>
        ))}
      </div>
      {!loading && bundles.length === 0 && (
        <EmptyState
          title="No bundles yet"
          description="Create a bundle to define reliever rotations across 6 sites."
          size="sm"
          variant="card"
          contentClassName="py-4"
        />
      )}

      <BundleFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        initial={editing}
        relievers={relievers}
        sites={sites}
        filters={{ zone_id: zoneId, supervisor_id: supervisorId }}
        onSaved={() => { setCreateOpen(false); loadBundles(); }}
      />
    </div>
  );
}

function DeleteBundleButton({ id, onDone }: { id: number; onDone: () => void }) {
  const { post, processing } = useForm({});
  const { toast } = useToast();
  const onDelete = () => {
    if (!confirm('Delete this bundle?')) return;
    post(route('control-room.roster.bundles.destroy', id), {
      method: 'delete',
      onSuccess: () => { onDone(); toast({ title: 'Bundle deleted' }); },
    } as any);
  };
  return (
    <button type="button" className="text-xs px-2 py-1 rounded-md bg-red-600 text-white disabled:opacity-50" onClick={onDelete} disabled={processing}>Delete</button>
  );
}

function BundleFormModal({ open, onClose, initial, relievers, sites, filters, onSaved }: { open: boolean; onClose: () => void; initial?: any; relievers: any[]; sites: Site[]; filters: { zone_id: number | ''; supervisor_id: number | '' }; onSaved: () => void }) {
  const isEdit = !!initial;
  const { toast } = useToast();
  const { data, setData, post, put, processing, errors } = useForm<{ name: string; reliever_guard_id: number | ''; site_ids: number[]; zone_id?: number | ''; supervisor_id?: number | '' }>({
    name: initial?.name || '',
    reliever_guard_id: initial?.reliever?.id || ('' as any),
    site_ids: (initial?.sites || []).map((s: any) => s.id) || [],
    zone_id: filters.zone_id,
    supervisor_id: filters.supervisor_id,
  });

  useEffect(() => {
    if (open) {
      setData('name', initial?.name || '');
      setData('reliever_guard_id', initial?.reliever?.id || ('' as any));
      setData('site_ids', (initial?.sites || []).map((s: any) => s.id));
      setData('zone_id', filters.zone_id);
      setData('supervisor_id', filters.supervisor_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, filters.zone_id, filters.supervisor_id]);

  const toggleSite = (sid: number) => {
    const set = new Set(data.site_ids as any[]);
    if (set.has(sid)) set.delete(sid); else set.add(sid);
    const arr = Array.from(set) as number[];
    if (arr.length > 6) return; // enforce max 6
    setData('site_ids', arr as any);
  };

  const moveSite = (sid: number, dir: -1 | 1) => {
    const arr = [...(data.site_ids as any[])];
    const idx = arr.indexOf(sid);
    if (idx === -1) return;
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    const tmp = arr[idx];
    arr[idx] = arr[ni];
    arr[ni] = tmp;
    setData('site_ids', arr as any);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      put(route('control-room.roster.bundles.update', initial.id), {
        onSuccess: () => { toast({ title: 'Bundle updated' }); onSaved(); },
      });
    } else {
      post(route('control-room.roster.bundles'), {
        onSuccess: () => { toast({ title: 'Bundle created' }); onSaved(); },
      });
    }
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Bundle' : 'New Bundle'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.name} onChange={(e) => setData('name', e.target.value)} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Reliever</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.reliever_guard_id as any} onChange={(e) => setData('reliever_guard_id', Number(e.target.value))}>
              <option value="">Select reliever</option>
              {relievers.map((r) => (
                <option key={r.id} value={r.id}>{r.name} {r.employee_id ? `(${r.employee_id})` : ''}</option>
              ))}
            </select>
            {errors.reliever_guard_id && <p className="text-xs text-red-600 mt-1">{errors.reliever_guard_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Sites (max 6)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-auto border rounded p-2 dark:border-gray-800">
              {sites.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={(data.site_ids as any[]).includes(s.id)} onChange={() => toggleSite(s.id)} />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
            {errors.site_ids && <p className="text-xs text-red-600 mt-1">{errors.site_ids}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Selected order</label>
            <div className="space-y-2">
              {(data.site_ids as any[]).map((sid) => {
                const s = sites.find((x) => x.id === sid);
                if (!s) return null;
                return (
                  <div key={sid} className="flex items-center justify-between text-sm border rounded p-2 dark:border-gray-800">
                    <div>{s.name}</div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800" onClick={() => moveSite(sid, -1)}>↑</button>
                      <button type="button" className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800" onClick={() => moveSite(sid, 1)}>↓</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || !data.name || !data.reliever_guard_id || !(data.site_ids || []).length} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">{processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // make Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function RosterWeekly() {
  const { auth, initial_week_start, zones = [], supervisors = [] } = (usePage().props as any);
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState<Date>(() => initial_week_start ? new Date(initial_week_start) : startOfWeekMonday(new Date()));
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [supervisorId, setSupervisorId] = useState<number | ''>('');
  const [guardTypeFilter, setGuardTypeFilter] = useState<string>('');
  const [reuseInfo, setReuseInfo] = useState<any | null>(null);
  const [lastReuseToastKey, setLastReuseToastKey] = useState<string>('');

  const hasRelieversInScope = useMemo(() => {
    return !!data?.relievers?.length;
  }, [data]);

  const hasRelieverAssignments = useMemo(() => {
    if (!data?.relievers?.length) return false;
    return data.relievers.some((r) => r.sites && Object.keys(r.sites).length > 0);
  }, [data]);

  const hasStandbyInScope = useMemo(() => {
    return !!data?.guards?.some((g) => (g.guard_type || 'permanent') === 'standby');
  }, [data]);

  const ensureReuse = async (params: { start: string; zone_id?: number; supervisor_id?: number; force?: boolean }) => {
    try {
      const token = getCsrfToken();
      const res = await fetch(route('control-room.roster.weekly.reuse'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'X-CSRF-TOKEN': token } : {}),
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) return;
      const json = await res.json();
      setReuseInfo(json);
      if (json?.reused) {
        const key = `${params.start}-${params.zone_id || ''}-${params.supervisor_id || ''}-${json.source_week_start || ''}`;
        if (key !== lastReuseToastKey) {
          toast({
            title: 'Reused last roster',
            description: json.source_week_start ? `Copied ${json.copied || 0} reliever assignments from week of ${json.source_week_start}.` : 'Copied reliever assignments from the last saved week.',
          });
          setLastReuseToastKey(key);
        }
      }
    } catch {
      return;
    }
  };

  const load = async (overrides?: { weekStart?: Date; zoneId?: number | ''; supervisorId?: number | ''; forceReuse?: boolean }) => {
    setLoading(true);
    try {
      const ws = overrides?.weekStart ?? weekStart;
      const zid = overrides?.zoneId ?? zoneId;
      const sid = overrides?.supervisorId ?? supervisorId;

      setReuseInfo(null);

      const params: any = { start: formatYmd(ws) };
      if (zid) params.zone_id = zid;
      if (sid) params.supervisor_id = sid;

      const currentWeekStart = startOfWeekMonday(new Date());
      const shouldAutoReuse = ws.getTime() >= currentWeekStart.getTime();
      if (overrides?.forceReuse) {
        await ensureReuse({ ...params, force: true });
      } else if (shouldAutoReuse) {
        await ensureReuse(params);
      }

      const url = route('control-room.roster.weekly.data', params);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        setData(json as WeeklyData);
      }
    } finally {
      setLoading(false);
    }
  };

  const reuseOverwrite = async () => {
    if (!hasRelieversInScope) {
      toast({ title: 'No relievers in this scope', description: 'Change filters (zone/supervisor) to a scope that has relievers.' });
      return;
    }
    const ok = confirm('Reuse last saved reliever roster for this week and overwrite current reliever assignments?');
    if (!ok) return;
    await load({ forceReuse: true });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.getTime()]);

  const prevWeek = () => setWeekStart((d) => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return startOfWeekMonday(nd); });
  const nextWeek = () => setWeekStart((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return startOfWeekMonday(nd); });
  const thisWeek = () => setWeekStart(startOfWeekMonday(new Date()));

  return (
    <ControlRoomLayout title="Weekly Roster" user={auth?.user as any}>
      <Head title="Weekly Roster" />
      <div className="space-y-4">
        <div className="space-y-3">
          <PageHeader
            title="Weekly Roster"
            description="Show guard off-days and reliever sites for each day."
            actions={(
              <>
                <Link href={route('control-room.shifts.index')} className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-coin-700 text-white hover:bg-coin-600 text-sm">View Guard Shifts</Link>
                <button onClick={prevWeek} className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                <button onClick={thisWeek} className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">This Week</button>
                <button onClick={nextWeek} className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
              </>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 sm:min-w-[70px]">Zone</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={zoneId as any} onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">All zones</option>
                {zones.map((z: any) => (<option key={z.id} value={z.id}>{z.name}</option>))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 sm:min-w-[90px]">Supervisor</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={supervisorId as any} onChange={(e) => setSupervisorId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">All supervisors</option>
                {supervisors.map((s: any) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:justify-end">
              <button onClick={() => load()} className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-coin-700 text-white hover:bg-coin-600">Apply</button>
              <button
                onClick={() => {
                  setZoneId('');
                  setSupervisorId('');
                  setGuardTypeFilter('');
                  load({ zoneId: '', supervisorId: '' });
                }}
                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300 sm:min-w-[90px]">Guard Type</label>
            <select
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 sm:max-w-xs"
              value={guardTypeFilter}
              onChange={(e) => setGuardTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              <option value="permanent">Standard</option>
              <option value="standby">Standby</option>
              <option value="reliever">Reliever</option>
            </select>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-gray-700 dark:text-gray-200">
              {!hasRelieversInScope
                ? 'Relievers not found for the selected zone/supervisor.'
                : (hasRelieverAssignments ? 'Reliever roster is saved for this week.' : 'Reliever roster not saved for this week yet.')}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <button
                type="button"
                onClick={reuseOverwrite}
                disabled={loading || !hasRelieversInScope}
                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reuse Last (Overwrite)
              </button>
            </div>
          </div>
          {hasRelieversInScope && reuseInfo?.reused && reuseInfo?.source_week_start ? (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Reused from week starting {reuseInfo.source_week_start}.</div>
          ) : null}
        </div>

        {loading && (
          <EmptyState
            title="Loading roster"
            description="Fetching weekly roster data…"
            size="sm"
            contentClassName="py-2"
          />
        )}

        {data && (
          <div className="space-y-8">
            <GenerateShiftsPanel
              weekStart={weekStart}
              zoneId={zoneId}
              supervisorId={supervisorId}
            />
            {(!guardTypeFilter || guardTypeFilter === 'permanent') && (
              <GuardsTable data={data} onRefresh={load} />
            )}
            {(!guardTypeFilter || guardTypeFilter === 'standby') && (
              hasStandbyInScope
                ? <StandbyTable data={data} onRefresh={load} />
                : (guardTypeFilter === 'standby' ? (
                  <EmptyState
                    title="No standby guards"
                    description="Change zone/supervisor filters to a scope that has standby guards."
                    size="sm"
                    variant="card"
                  />
                ) : null)
            )}
            {(!guardTypeFilter || guardTypeFilter === 'reliever') && (
              data.relievers?.length
                ? <RelieversTable data={data} onRefresh={load} />
                : (guardTypeFilter === 'reliever' ? (
                  <EmptyState
                    title="No relievers found"
                    description="Change zone/supervisor filters to a scope that has relievers."
                    size="sm"
                    variant="card"
                  />
                ) : null)
            )}
            <BundlesSection
              weekStart={weekStart}
              zoneId={zoneId}
              supervisorId={supervisorId}
              relievers={(data.guards || []).filter((g: any) => (g.guard_type || 'permanent') === 'reliever')}
              sites={data.sites}
            />
          </div>
        )}
      </div>
    </ControlRoomLayout>
  );
}

function GuardsTable({ data, onRefresh }: { data: WeeklyData; onRefresh: () => void }) {
  const dayLabels = useMemo(() => data.days.map((d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })), [data.days]);
  const [offModal, setOffModal] = useState<{ open: boolean; guardId?: number; date?: string }>({ open: false });
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [bulkOffOpen, setBulkOffOpen] = useState(false);

  const toggleSel = (id: number) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const selectedIds = Object.entries(selected).filter(([_, v]) => !!v).map(([k]) => Number(k));

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assigned Guards</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">Click a day to add off-day</div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">Select guards then bulk mark OFF</div>
        <button disabled={!selectedIds.length} onClick={() => setBulkOffOpen(true)} className={`w-full sm:w-auto px-3 py-1.5 rounded-md text-white ${selectedIds.length ? 'bg-coin-700 hover:bg-coin-600' : 'bg-gray-400 cursor-not-allowed'}`}>Bulk Off-day</button>
      </div>

      <div className="md:hidden space-y-2">
        {data.guards.filter(g => ((g.guard_type || 'permanent') === 'permanent')).map((g) => (
          <div key={g.id} className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="flex items-start justify-between gap-3">
              <label className="inline-flex items-start gap-2">
                <input className="mt-1 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSel(g.id)} />
                <span className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                    {g.name} {g.employee_id ? <span className="text-xs text-gray-500">({g.employee_id})</span> : null}
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">Permanent</span>
                  </div>
                </span>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.days.map((d, idx) => {
                const off = !!g.off?.[d];
                const site = g.sites?.[d];
                return (
                  <button
                    key={d}
                    type="button"
                    className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md border text-sm ${off ? 'bg-gray-800 text-gray-100 border-gray-700' : site ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'}`}
                    onClick={() => setOffModal({ open: true, guardId: g.id, date: d })}
                    title="Add off-day"
                  >
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dayLabels[idx]}</span>
                    <span className="font-semibold truncate">{off ? 'OFF' : (site ? site.name : '—')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border dark:border-gray-800 rounded-md">
        <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Guard</th>
              {dayLabels.map((lbl, idx) => (
                <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-900 bg-white dark:bg-gray-900">
            {data.guards.filter(g => ((g.guard_type || 'permanent') === 'permanent')).map((g) => (
              <tr key={g.id}>
                <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                  <label className="inline-flex items-center gap-2">
                    <input className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSel(g.id)} />
                    <span className="inline-flex items-center gap-2">
                      <span>{g.name} {g.employee_id ? <span className="text-xs text-gray-500">({g.employee_id})</span> : null}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">Permanent</span>
                    </span>
                  </label>
                </td>
                {data.days.map((d) => {
                  const off = !!g.off?.[d];
                  const site = g.sites?.[d];
                  return (
                    <td key={d} className="px-3 py-2 text-sm">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs ${off ? 'bg-gray-800 text-gray-100 border-gray-700' : site ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800'}`}
                        onClick={() => setOffModal({ open: true, guardId: g.id, date: d })}
                        title="Add off-day"
                      >
                        {off ? 'OFF' : (site ? site.name : '—')}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddOffDayModal
        open={offModal.open}
        onClose={() => setOffModal({ open: false })}
        guardId={offModal.guardId}
        date={offModal.date}
        onSaved={() => { setOffModal({ open: false }); onRefresh(); }}
      />

      <BulkOffModal
        open={bulkOffOpen}
        onClose={() => setBulkOffOpen(false)}
        guardIds={selectedIds}
        onSaved={() => { setBulkOffOpen(false); onRefresh(); }}
      />
    </div>
  );
}

function RelieversTable({ data, onRefresh }: { data: WeeklyData; onRefresh: () => void }) {
  const dayLabels = useMemo(() => data.days.map((d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })), [data.days]);
  const [relModal, setRelModal] = useState<{ open: boolean; guardId?: number; date?: string; siteId?: number }>( { open: false } );
  const [bulkRel, setBulkRel] = useState<{ open: boolean; guardId?: number }>({ open: false });

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Relievers</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">Click a day to assign a site</div>
      </div>
      <div className="md:hidden space-y-2">
        {data.relievers.map((r) => (
          <div key={r.id} className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                  {r.name} {r.employee_id ? <span className="text-xs text-gray-500">({r.employee_id})</span> : null}
                </div>
                <button type="button" className="mt-2 px-2 py-1 text-xs rounded-md bg-coin-700 text-white hover:bg-coin-600" onClick={() => setBulkRel({ open: true, guardId: r.id })}>Bulk Assign Week</button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.days.map((d, idx) => {
                const site = r.sites?.[d];
                return (
                  <button
                    key={d}
                    type="button"
                    className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md border text-sm ${site ? 'bg-coin-700 text-white border-coin-800' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800'}`}
                    onClick={() => setRelModal({ open: true, guardId: r.id, date: d, siteId: site?.id })}
                    title="Assign site"
                  >
                    <span className={`text-xs font-medium ${site ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{dayLabels[idx]}</span>
                    <span className="font-semibold truncate">{site ? site.name : 'Assign'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border dark:border-gray-800 rounded-md">
        <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Reliever</th>
              {dayLabels.map((lbl, idx) => (
                <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-900 bg-white dark:bg-gray-900">
            {data.relievers.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <span>{r.name} {r.employee_id ? <span className="text-xs text-gray-500">({r.employee_id})</span> : null}</span>
                    <button type="button" className="px-2 py-1 text-xs rounded-md bg-coin-700 text-white hover:bg-coin-600" onClick={() => setBulkRel({ open: true, guardId: r.id })}>Bulk Assign Week</button>
                  </div>
                </td>
                {data.days.map((d) => {
                  const site = r.sites?.[d];
                  return (
                    <td key={d} className="px-3 py-2 text-sm">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs ${site ? 'bg-coin-700 text-white border-coin-800' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800'}`}
                        onClick={() => setRelModal({ open: true, guardId: r.id, date: d, siteId: site?.id })}
                        title="Assign site"
                      >
                        {site ? site.name : 'Assign'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssignReliefModal
        open={relModal.open}
        onClose={() => setRelModal({ open: false })}
        guardId={relModal.guardId}
        date={relModal.date}
        initialSiteId={relModal.siteId}
        sites={data.sites}
        onSaved={() => { setRelModal({ open: false }); onRefresh(); }}
      />

      <BulkReliefModal
        open={bulkRel.open}
        onClose={() => setBulkRel({ open: false })}
        guardId={bulkRel.guardId}
        days={data.days}
        initialMap={(() => {
          const r = data.relievers.find(x => x.id === bulkRel.guardId);
          return r?.sites || {};
        })()}
        sites={data.sites}
        activeSites={data.active_sites || []}
        onSaved={() => { setBulkRel({ open: false }); onRefresh(); }}
      />
    </div>
  );
}

function AddOffDayModal({ open, onClose, guardId, date, onSaved }: { open: boolean; onClose: () => void; guardId?: number; date?: string; onSaved: () => void }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ guard_id: number | string; start_date: string; end_date?: string; reason?: string }>({
    guard_id: guardId ?? ('' as any),
    start_date: date ?? '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    setData('guard_id', guardId ?? ('' as any));
    setData('start_date', date ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardId, date]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.roster.off-days.store'), {
      onSuccess: () => { reset(); onSaved(); },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="sm">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Off Day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
            {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Reason (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.reason || ''} onChange={(e) => setData('reason', e.target.value)} />
            {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || !data.start_date} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">{processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function AssignReliefModal({ open, onClose, guardId, date, initialSiteId, sites, onSaved }: { open: boolean; onClose: () => void; guardId?: number; date?: string; initialSiteId?: number; sites: Site[]; onSaved: () => void }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ guard_id: number | string; client_site_id: number | string; date: string; notes?: string }>({
    guard_id: guardId ?? ('' as any),
    client_site_id: initialSiteId ?? ('' as any),
    date: date ?? '',
    notes: '',
  });

  useEffect(() => {
    setData('guard_id', guardId ?? ('' as any));
    setData('client_site_id', initialSiteId ?? ('' as any));
    setData('date', date ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardId, date, initialSiteId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.roster.relief.assign'), {
      onSuccess: () => { reset(); onSaved(); },
    });
  };

  const clearAssignment = () => {
    setData('guard_id', (guardId ?? '') as any);
    setData('date', date ?? '');
    post(route('control-room.roster.relief.delete'), {
      preserveScroll: true,
      onSuccess: () => { reset(); onSaved(); },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="sm">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Reliever</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Site</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.client_site_id as any} onChange={(e) => setData('client_site_id', Number(e.target.value))}>
              <option value="">Select a site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.client_site_id && <p className="text-xs text-red-600 mt-1">{errors.client_site_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Notes (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.notes || ''} onChange={(e) => setData('notes', e.target.value)} />
            {errors.notes && <p className="text-xs text-red-600 mt-1">{errors.notes}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            {initialSiteId ? (
              <button type="button" onClick={clearAssignment} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Clear</button>
            ) : null}
            <button type="submit" disabled={processing || !data.client_site_id || !data.date} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">{processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function BulkOffModal({ open, onClose, guardIds, onSaved }: { open: boolean; onClose: () => void; guardIds: number[]; onSaved: () => void }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ guard_ids: number[]; date: string; reason?: string }>({
    guard_ids: guardIds,
    date: '',
    reason: '',
  });

  useEffect(() => { setData('guard_ids', guardIds); }, [guardIds]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.roster.off-days.bulk'), {
      onSuccess: () => { reset(); onSaved(); },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="sm">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Off-day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
            {errors?.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Reason (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.reason || ''} onChange={(e) => setData('reason', e.target.value)} />
            {errors?.reason && <p className="text-xs text-red-600 mt-1">{errors.reason}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || !data.date || !guardIds.length} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">{processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function BulkReliefModal({ open, onClose, guardId, days, initialMap, sites, activeSites, onSaved }: { open: boolean; onClose: () => void; guardId?: number; days: DayKey[]; initialMap: Record<DayKey, Site | null>; sites: Site[]; activeSites: Site[]; onSaved: () => void }) {
  const { data, setData, post, processing, reset } = useForm<{ guard_id: number | string; day_site_map: Record<DayKey, number | ''> }>({
    guard_id: guardId ?? ('' as any),
    day_site_map: days.reduce((acc: any, d) => { acc[d] = initialMap?.[d]?.id || ''; return acc; }, {} as Record<DayKey, number | ''>),
  });
  const [onlyActive, setOnlyActive] = useState(true);

  useEffect(() => {
    setData('guard_id', guardId ?? ('' as any));
    setData('day_site_map', days.reduce((acc: any, d) => { acc[d] = initialMap?.[d]?.id || ''; return acc; }, {} as Record<DayKey, number | ''>));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardId]);

  const list = onlyActive ? activeSites : sites;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.roster.relief.assign-bulk'), {
      onSuccess: () => { reset(); onSaved(); },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Assign Reliever</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> <span className="text-sm">Only show active sites this week</span></label>
          {days.map((d) => (
            <div key={d} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">{new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
              <div className="sm:col-span-2">
                <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.day_site_map[d] as any} onChange={(e) => setData('day_site_map', { ...data.day_site_map, [d]: e.target.value ? Number(e.target.value) : '' })}>
                  <option value="">—</option>
                  {list.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || !guardId} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">{processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
