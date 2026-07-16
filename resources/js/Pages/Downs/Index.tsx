import React, { useState, useCallback } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import EmptyState from '@/Components/ui/empty-state';
import { formatDistanceToNow } from '@/Components/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DownMode = 'admin' | 'control-room' | 'zone-commander';

type DownStatus = 'open' | 'escalated' | 'resolved' | 'absconding';
type DownType = 'guard_absent' | 'site_unmanned' | 'other';

interface Down {
  id: number;
  title: string;
  type: DownType;
  status: DownStatus;
  description?: string;
  escalation_level: number;
  created_at: string;
  reporter?: { id: number; name: string };
  client?: { id: number; name: string };
  client_site?: { id: number; name: string; client_name?: string };
  guard_relation?: { id: number; name: string; employee_id?: string; status?: string };
  guard?: { id: number; name: string; employee_id: string };
}

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  site_id: number | null;
  site_name: string;
  client_name: string;
}

interface SiteResult {
  id: number;
  name: string;
  client_name: string;
}

interface Stats {
  open: number;
  escalated: number;
  resolved: number;
  absconding?: number;
}

interface PageProps {
  auth: { user?: any };
  downs: {
    data: Down[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    meta?: { current_page: number; last_page: number; total?: number };
  };
  stats?: Stats;
  guards?: Guard[];
  sites?: any[];
  mode: DownMode;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusConfig: Record<DownStatus, { color: string; icon: string; label: string; bg: string }> = {
  open: { color: 'text-blue-400', icon: 'AlertCircle', label: 'Open', bg: 'bg-blue-500/10 border-blue-500/30' },
  escalated: { color: 'text-amber-400', icon: 'TrendingUp', label: 'Escalated', bg: 'bg-amber-500/10 border-amber-500/30' },
  resolved: { color: 'text-emerald-400', icon: 'CheckCircle', label: 'Resolved', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  absconding: { color: 'text-purple-400', icon: 'ShieldAlert', label: 'Absconding', bg: 'bg-purple-500/10 border-purple-500/30' },
};

const typeConfig: Record<DownType, { label: string; color: string }> = {
  guard_absent: { label: 'Guard Absent', color: 'text-orange-400' },
  site_unmanned: { label: 'Site Unmanned', color: 'text-red-400' },
  other: { label: 'Other', color: 'text-gray-400' },
};

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guard Details Modal
// ---------------------------------------------------------------------------

function GuardDetailsModal({
  guardId,
  isOpen,
  onClose,
  routeName,
}: {
  guardId: number | null;
  isOpen: boolean;
  onClose: () => void;
  routeName: string;
}) {
  const [guard, setGuard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (guardId && isOpen) {
      setLoading(true);
      fetch(route(routeName, guardId), { headers: { Accept: 'application/json' } })
        .then((res) => res.json())
        .then((data) => setGuard(data))
        .catch(() => setGuard({ error: 'Failed to load' }))
        .finally(() => setLoading(false));
    }
  }, [guardId, isOpen, routeName]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 max-w-md">
        <DialogHeader>
          <DialogTitle>Guard Details</DialogTitle>
        </DialogHeader>
        {loading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
        {!loading && guard?.error && <p className="text-red-500">{guard.error}</p>}
        {!loading && guard && !guard.error && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <p className="font-medium">{guard.name}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Employee ID</span>
                <p className="font-medium">{guard.employee_id}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Phone</span>
                <p className="font-medium">{guard.phone || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <p className="font-medium">{guard.status || '—'}</p>
              </div>
            </div>

            {Array.isArray(guard.assignments) && guard.assignments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assignments</h4>
                <div className="space-y-2">
                  {guard.assignments.map((a: any) => (
                    <div key={a.id} className="p-2 rounded bg-gray-50 dark:bg-gray-700/50 text-sm flex items-center justify-between">
                      <div>
                        <div className="text-gray-900 dark:text-gray-200">
                          {a.site?.client?.name || 'Client'} • {a.site?.name || 'Site'}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                          {a.start_date}
                          {a.end_date && ` → ${a.end_date}`}
                        </div>
                      </div>
                      <Badge className={a.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400'}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Report Down: Admin Form (embedded)
// ---------------------------------------------------------------------------

function AdminReportForm() {
  const { data, setData, post, processing, reset } = useForm({
    title: '',
    type: 'site_unmanned' as DownType,
    description: '',
    client_id: '',
    client_site_id: '',
    guard_id: '',
    flag_guard: false as boolean,
    flag_reason: '',
    flag_details: '',
  });

  const [siteSearch, setSiteSearch] = useState('');
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteName, setSelectedSiteName] = useState('');
  const [guardSearch, setGuardSearch] = useState('');
  const [guardResults, setGuardResults] = useState<Array<{ id: number; name: string; employee_id?: string }>>([]);
  const [loadingGuards, setLoadingGuards] = useState(false);
  const [selectedGuardName, setSelectedGuardName] = useState('');

  const loadSites = useCallback(async () => {
    try {
      setLoadingSites(true);
      const params = new URLSearchParams();
      if (siteSearch) params.set('search', siteSearch);
      const url = `${route('admin.clients.sites.json')}?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const list = await res.json();
      setSiteResults(Array.isArray(list) ? list : []);
    } catch {
      setSiteResults([]);
    } finally {
      setLoadingSites(false);
    }
  }, [siteSearch]);

  const loadGuards = useCallback(async () => {
    try {
      setLoadingGuards(true);
      const params = new URLSearchParams();
      if (guardSearch) params.set('q', guardSearch);
      const url = `${route('admin.guards.search')}?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const list = await res.json();
      setGuardResults(Array.isArray(list) ? list : []);
    } catch {
      setGuardResults([]);
    } finally {
      setLoadingGuards(false);
    }
  }, [guardSearch]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('admin.downs.store'), {
      onSuccess: () => {
        reset();
        setSelectedSiteName('');
        setSelectedGuardName('');
      },
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
        <input
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          value={data.title}
          onChange={(e) => setData('title', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          value={data.type}
          onChange={(e) => setData('type', e.target.value as DownType)}
        >
          <option value="guard_absent">Guard absent</option>
          <option value="site_unmanned">Site unmanned</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          rows={3}
          value={data.description}
          onChange={(e) => setData('description', e.target.value)}
        />
      </div>

      {/* Site Search */}
      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Site</label>
            <input
              value={siteSearch}
              onChange={(e) => setSiteSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadSites())}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Search site or client name"
            />
          </div>
          <Button type="button" variant="outline" onClick={loadSites} disabled={loadingSites}>
            {loadingSites ? '…' : 'Search'}
          </Button>
        </div>
        {selectedSiteName && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Selected: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSiteName}</span>
          </div>
        )}
        {siteResults.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
            {siteResults.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setData('client_site_id', String(s.id));
                  setSelectedSiteName(`${s.client_name} • ${s.name}`);
                  setSiteResults([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{s.client_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{s.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guard Search */}
      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Guard</label>
            <input
              value={guardSearch}
              onChange={(e) => setGuardSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadGuards())}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Search guard name or employee ID"
            />
          </div>
          <Button type="button" variant="outline" onClick={loadGuards} disabled={loadingGuards}>
            {loadingGuards ? '…' : 'Search'}
          </Button>
        </div>
        {selectedGuardName && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Selected: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedGuardName}</span>
          </div>
        )}
        {guardResults.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
            {guardResults.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setData('guard_id', String(g.id));
                  setSelectedGuardName(`${g.name}${g.employee_id ? ' • ' + g.employee_id : ''}`);
                  setGuardResults([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
                {g.employee_id && <div className="text-xs text-gray-500 dark:text-gray-400">{g.employee_id}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={processing}>
          Report
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Report Down: Control Room Dialog Form
// ---------------------------------------------------------------------------

function ControlRoomReportForm({ onSuccess }: { onSuccess: () => void }) {
  const { data, setData, post, processing, reset, errors } = useForm({
    title: '',
    type: 'site_unmanned' as DownType,
    description: '',
    client_id: '',
    client_site_id: '',
    guard_id: '',
    flag_guard: false,
    flag_reason: '',
    flag_details: '',
  });

  const [siteSearch, setSiteSearch] = useState('');
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteName, setSelectedSiteName] = useState('');
  const [guardSearch, setGuardSearch] = useState('');
  const [guardResults, setGuardResults] = useState<Array<{ id: number; name: string; employee_id?: string }>>([]);
  const [loadingGuards, setLoadingGuards] = useState(false);
  const [selectedGuardName, setSelectedGuardName] = useState('');

  const loadSites = useCallback(async () => {
    if (!siteSearch.trim()) return;
    try {
      setLoadingSites(true);
      const params = new URLSearchParams({ search: siteSearch });
      const res = await fetch(`${route('control-room.clients.sites.json')}?${params}`, {
        headers: { Accept: 'application/json' },
      });
      const list = await res.json();
      setSiteResults(Array.isArray(list) ? list : []);
    } catch {
      setSiteResults([]);
    } finally {
      setLoadingSites(false);
    }
  }, [siteSearch]);

  const loadGuards = useCallback(async () => {
    if (!guardSearch.trim()) return;
    try {
      setLoadingGuards(true);
      const params = new URLSearchParams({ q: guardSearch });
      const res = await fetch(`${route('control-room.guards.search')}?${params}`, {
        headers: { Accept: 'application/json' },
      });
      const list = await res.json();
      setGuardResults(Array.isArray(list) ? list : []);
    } catch {
      setGuardResults([]);
    } finally {
      setLoadingGuards(false);
    }
  }, [guardSearch]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.downs.store'), {
      onSuccess: () => {
        reset();
        setSelectedSiteName('');
        setSelectedGuardName('');
        setSiteResults([]);
        setGuardResults([]);
        onSuccess();
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => setData('title', e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          required
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
        <select
          value={data.type}
          onChange={(e) => setData('type', e.target.value as DownType)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
        >
          <option value="site_unmanned">Site Unmanned</option>
          <option value="guard_absent">Guard Absent</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => setData('description', e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
        />
      </div>

      {/* Site Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link Site</label>
        <div className="flex gap-2">
          <input
            value={siteSearch}
            onChange={(e) => setSiteSearch(e.target.value)}
            placeholder="Search site or client..."
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={loadSites} disabled={loadingSites}>
            {loadingSites ? '…' : 'Search'}
          </Button>
        </div>
        {selectedSiteName && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Selected: {selectedSiteName}</p>}
        {siteResults.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
            {siteResults.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setData('client_site_id', String(s.id));
                  setSelectedSiteName(`${s.client_name} • ${s.name}`);
                  setSiteResults([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                <div className="text-gray-900 dark:text-gray-200">{s.client_name}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">{s.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guard Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link Guard</label>
        <div className="flex gap-2">
          <input
            value={guardSearch}
            onChange={(e) => setGuardSearch(e.target.value)}
            placeholder="Search guard name or ID..."
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={loadGuards} disabled={loadingGuards}>
            {loadingGuards ? '…' : 'Search'}
          </Button>
        </div>
        {selectedGuardName && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Selected: {selectedGuardName}</p>}
        {guardResults.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
            {guardResults.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setData('guard_id', String(g.id));
                  setSelectedGuardName(`${g.name}${g.employee_id ? ` • ${g.employee_id}` : ''}`);
                  setGuardResults([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                <div className="text-gray-900 dark:text-gray-200">{g.name}</div>
                {g.employee_id && <div className="text-gray-500 dark:text-gray-400 text-xs">{g.employee_id}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={data.flag_guard}
            onChange={(e) => setData('flag_guard', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-700"
          />
          Flag involved guard
        </label>
        {data.flag_guard && (
          <div className="mt-3 space-y-3">
            <input
              value={data.flag_reason}
              onChange={(e) => setData('flag_reason', e.target.value)}
              placeholder="Flag reason"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            />
            <textarea
              value={data.flag_details}
              onChange={(e) => setData('flag_details', e.target.value)}
              placeholder="Additional details"
              rows={2}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <Button type="submit" disabled={processing} className="w-full bg-red-600 hover:bg-red-700 text-white">
        {processing ? 'Reporting...' : 'Report Down'}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Report Down: Zone Commander Modal
// ---------------------------------------------------------------------------

function ZoneCommanderReportForm({ onSuccess }: { onSuccess: () => void }) {
  const guards: Guard[] = (usePage().props as any).guards || [];

  const [type, setType] = useState<DownType>('guard_absent');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [siteSearch, setSiteSearch] = useState('');
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedSiteLabel, setSelectedSiteLabel] = useState('');
  const [guardSearch, setGuardSearch] = useState('');
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null);
  const [selectedGuardLabel, setSelectedGuardLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredGuards = React.useMemo(() => {
    const q = guardSearch.trim().toLowerCase();
    if (!q) return guards;
    return guards.filter((g) => {
      return (
        g.name.toLowerCase().includes(q) ||
        g.employee_id.toLowerCase().includes(q) ||
        g.site_name.toLowerCase().includes(q) ||
        g.client_name.toLowerCase().includes(q)
      );
    });
  }, [guards, guardSearch]);

  const loadSites = useCallback(async () => {
    try {
      setLoadingSites(true);
      const params = new URLSearchParams();
      if (siteSearch) params.set('search', siteSearch);
      const qs = params.toString();
      const url = qs ? `${route('zone.sites.json')}?${qs}` : route('zone.sites.json');
      const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      if (!res.ok) { setSiteResults([]); return; }
      const json = await res.json();
      setSiteResults(Array.isArray(json) ? json : []);
    } catch {
      setSiteResults([]);
    } finally {
      setLoadingSites(false);
    }
  }, [siteSearch]);

  const canSubmit = !!selectedSiteId && (type !== 'guard_absent' || !!selectedGuardId);

  const submit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    router.post(
      route('zone.downs.store'),
      {
        client_site_id: selectedSiteId,
        type,
        guard_id: type === 'guard_absent' ? selectedGuardId : null,
        title: title || undefined,
        description: description || undefined,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSubmitting(false);
          onSuccess();
        },
        onError: () => setSubmitting(false),
      }
    );
  };

  const resetForm = () => {
    setType('guard_absent');
    setTitle('');
    setDescription('');
    setSiteSearch('');
    setSiteResults([]);
    setSelectedSiteId(null);
    setSelectedSiteLabel('');
    setGuardSearch('');
    setSelectedGuardId(null);
    setSelectedGuardLabel('');
  };

  // Reset when type changes away from guard_absent
  React.useEffect(() => {
    if (type !== 'guard_absent') {
      setSelectedGuardId(null);
      setSelectedGuardLabel('');
    }
  }, [type]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DownType)}
          className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="guard_absent">Guard absent</option>
          <option value="site_unmanned">Site unmanned</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Site Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site</label>
        <div className="mt-1 flex gap-2">
          <input
            value={siteSearch}
            onChange={(e) => setSiteSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); loadSites(); } }}
            placeholder="Search site or client name"
            className="flex-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
          <Button variant="outline" onClick={loadSites} disabled={loadingSites}>
            {loadingSites ? '…' : 'Search'}
          </Button>
        </div>
        {selectedSiteLabel && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Selected: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSiteLabel}</span>
          </div>
        )}
        {siteResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
            {siteResults.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSiteId(s.id);
                  setSelectedSiteLabel(`${s.client_name} • ${s.name}`);
                  setSiteResults([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{s.client_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{s.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guard Search (only when type is guard_absent) */}
      {type === 'guard_absent' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Absent Guard</label>
          <div className="mt-1">
            <input
              value={guardSearch}
              onChange={(e) => setGuardSearch(e.target.value)}
              placeholder="Search guard name, employee ID, site"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          {selectedGuardLabel && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Selected: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedGuardLabel}</span>
            </div>
          )}
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
            {filteredGuards.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No guards found</div>
            ) : (
              filteredGuards.slice(0, 150).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGuardId(g.id);
                    setSelectedGuardLabel(`${g.name}${g.employee_id ? ' • ' + g.employee_id : ''}`);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{g.client_name} • {g.site_name}{g.employee_id ? ` • ${g.employee_id}` : ''}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Auto-generated if empty"
          className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          placeholder="Add context (e.g. no show, phone unreachable, etc.)"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => { resetForm(); onSuccess(); }}>Cancel</Button>
        <Button onClick={submit} disabled={!canSubmit || submitting}>
          {submitting ? 'Reporting...' : 'Report Down'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deploy Cover Modal (Control Room & Zone Commander)
// ---------------------------------------------------------------------------

function DeployCoverModal({
  down,
  guards,
  isOpen,
  onClose,
  routePrefix,
}: {
  down: Down | null;
  guards: Guard[];
  isOpen: boolean;
  onClose: () => void;
  routePrefix: string;
}) {
  const [coverSearch, setCoverSearch] = useState('');
  const [coverGuardId, setCoverGuardId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredCoverGuards = React.useMemo(() => {
    const q = coverSearch.trim().toLowerCase();
    if (!q) return guards;
    return guards.filter((g) => {
      return (
        g.name.toLowerCase().includes(q) ||
        g.employee_id.toLowerCase().includes(q) ||
        g.site_name.toLowerCase().includes(q) ||
        g.client_name.toLowerCase().includes(q)
      );
    });
  }, [guards, coverSearch]);

  const deployCover = () => {
    if (!down?.client_site?.id || !coverGuardId) return;
    setSubmitting(true);
    router.post(
      route(`${routePrefix}.guards.assign-site`),
      { guard_id: coverGuardId, client_site_id: down.client_site.id },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSubmitting(false);
          onClose();
        },
        onError: () => setSubmitting(false),
      }
    );
  };

  React.useEffect(() => {
    if (isOpen) {
      setCoverSearch('');
      setCoverGuardId(null);
    }
  }, [isOpen]);

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="xl">
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Deploy Coverage</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Deploy a guard to cover the downed site.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="mt-4 space-y-4">
          {down?.client_site && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-sm font-medium">Target Site</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {down.client_site.client_name ? `${down.client_site.client_name} • ` : ''}{down.client_site.name}
              </div>
              {down.guard_relation && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Absent: {down.guard_relation.name}{down.guard_relation.employee_id ? ` • ${down.guard_relation.employee_id}` : ''}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cover Guard</label>
            <input
              value={coverSearch}
              onChange={(e) => setCoverSearch(e.target.value)}
              placeholder="Search guard"
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              {filteredCoverGuards.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No guards found</div>
              ) : (
                filteredCoverGuards
                  .filter((g) => (down?.guard_relation?.id ? g.id !== down.guard_relation.id : true))
                  .slice(0, 200)
                  .map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setCoverGuardId(g.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm ${coverGuardId === g.id ? 'bg-coin-50 dark:bg-gray-800' : ''}`}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{g.client_name} • {g.site_name}{g.employee_id ? ` • ${g.employee_id}` : ''}</div>
                    </button>
                  ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={deployCover} disabled={!down?.client_site?.id || !coverGuardId || submitting}>
              {submitting ? 'Deploying...' : 'Deploy'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Down Card (Control Room style)
// ---------------------------------------------------------------------------

function DownCard({
  down,
  onEscalate,
  onResolve,
  onAbscond,
  onViewGuard,
  onDeployCover,
  showAbscond,
  showDeployCover,
}: {
  down: Down;
  onEscalate: (id: number) => void;
  onResolve: (id: number) => void;
  onAbscond?: (id: number) => void;
  onViewGuard: (id: number) => void;
  onDeployCover?: (down: Down) => void;
  showAbscond: boolean;
  showDeployCover: boolean;
}) {
  const status = statusConfig[down.status] || statusConfig.open;
  const type = typeConfig[down.type] || typeConfig.other;
  const isResolved = down.status === 'resolved';

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${status.color} border-current text-xs`}>
              {status.label}
              {down.escalation_level > 0 && ` • L${down.escalation_level}`}
            </Badge>
            <span className={`text-xs font-medium ${type.color}`}>{type.label}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {down.created_at ? formatDistanceToNow(down.created_at) : ''}
          </span>
        </div>

        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
          {down.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
          {down.client && (
            <span className="flex items-center gap-1">
              <IconMapper name="Building" size={12} />
              {down.client.name}
            </span>
          )}
          {down.client_site && (
            <span className="flex items-center gap-1">
              <IconMapper name="MapPin" size={12} />
              {down.client_site.name}
            </span>
          )}
          {down.reporter && (
            <span className="flex items-center gap-1">
              <IconMapper name="User" size={12} />
              {down.reporter.name}
            </span>
          )}
        </div>

        {down.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{down.description}</p>
        )}

        {(down.guard_relation?.id || down.guard?.id) && (
          <button
            onClick={() => onViewGuard(down.guard_relation?.id || down.guard!.id)}
            className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
          >
            <IconMapper name="Shield" size={12} />
            {down.guard_relation?.name || down.guard?.name}
            {down.guard_relation?.employee_id && ` (${down.guard_relation.employee_id})`}
          </button>
        )}

        {!isResolved && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {showDeployCover && onDeployCover && (
              <Button variant="outline" size="sm" onClick={() => onDeployCover(down)}>
                <IconMapper name="Users" size={14} className="mr-1" />
                Cover
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onEscalate(down.id)}>
              <IconMapper name="TrendingUp" size={14} className="mr-1" />
              Escalate
            </Button>
            <Button variant="outline" size="sm" onClick={() => onResolve(down.id)}>
              <IconMapper name="CheckCircle" size={14} className="mr-1" />
              Resolve
            </Button>
            {showAbscond && onAbscond && down.status !== 'absconding' && (
              <Button variant="outline" size="sm" onClick={() => onAbscond(down.id)}>
                <IconMapper name="ShieldAlert" size={14} className="mr-1" />
                Abscond
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DownsIndex() {
  const pageProps: any = usePage().props;
  const mode = pageProps.mode as DownMode;
  const auth = pageProps.auth;
  const downsProp = pageProps.downs || { data: [] };
  const serverStats: Stats | undefined = pageProps.stats;
  const guards: Guard[] = pageProps.guards || [];
  const downsData = downsProp.data || [];

  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null);
  const [deployCoverDown, setDeployCoverDown] = useState<Down | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // ---- Route name helpers ----
  const routePrefix = mode === 'zone-commander' ? 'zone' : mode === 'control-room' ? 'control-room' : 'admin';
  const guardJsonRoute = mode === 'zone-commander' ? 'guards.json' : `${routePrefix}.guards.json`;

  // ---- Actions ----
  const handleEscalate = (id: number) => {
    router.post(route(`${routePrefix}.downs.escalate`, id));
  };

  const handleResolve = (id: number) => {
    if (mode === 'control-room') {
      router.post(route(`control-room.downs.resolve`, id), { resolution_type: 'control_room_resolved' });
    } else {
      router.post(route(`${routePrefix}.downs.resolve`, id));
    }
  };

  const handleAbscond = (id: number) => {
    router.post(route(`${routePrefix}.downs.abscond`, id));
  };

  // ---- Stats ----
  const stats = [
    { label: 'Open', value: serverStats?.open ?? downsData.filter((d: any) => d.status === 'open').length, color: 'bg-blue-500', icon: 'AlertCircle' },
    { label: 'Escalated', value: serverStats?.escalated ?? downsData.filter((d: any) => d.status === 'escalated').length, color: 'bg-amber-500', icon: 'TrendingUp' },
    { label: 'Resolved', value: serverStats?.resolved ?? downsData.filter((d: any) => d.status === 'resolved').length, color: 'bg-emerald-500', icon: 'CheckCircle' },
  ];
  if (mode !== 'zone-commander') {
    stats.push({
      label: 'Absconding',
      value: serverStats?.absconding ?? downsData.filter((d: any) => d.status === 'absconding').length,
      color: 'bg-purple-500',
      icon: 'ShieldAlert',
    });
  }

  // ---- Render ----
  const pageTitle = mode === 'zone-commander' ? 'Zone Downs' : 'Downs Management';

  return (
    <>
      <Head title={pageTitle} />

      <AuthenticatedLayout header={pageTitle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <IconMapper name="AlertTriangle" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{pageTitle}</h1>
                  <p className="text-red-100 text-sm">Report, track, and resolve coverage downs</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-red-200">Active</p>
                <p className="text-2xl font-bold">{downsData.filter((d: any) => d.status !== 'resolved').length}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} icon={<IconMapper name={stat.icon} size={16} className="text-white" />} label={stat.label} value={stat.value} color={stat.color} />
            ))}
          </div>

          {/* Admin: Action Tiles */}
          {mode === 'admin' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a href="#report-form" className="block">
                <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:shadow-xl">
                  <div className="inline-flex p-2.5 rounded-lg bg-red-600 text-white shadow-md"><IconMapper name="Plus" size={18} /></div>
                  <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 text-sm">Report Down</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Log new incident</p>
                </div>
              </a>
              <button onClick={() => router.reload()} className="block">
                <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:shadow-xl text-left w-full h-full">
                  <div className="inline-flex p-2.5 rounded-lg bg-emerald-600 text-white shadow-md"><IconMapper name="RefreshCw" size={18} /></div>
                  <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 text-sm">Refresh</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Reload data</p>
                </div>
              </button>
            </div>
          )}

          {/* Control Room / Zone Commander: Report Button */}
          {(mode === 'control-room' || mode === 'zone-commander') && (
            <Button
              onClick={() => {
                if (mode === 'control-room') setIsReportOpen(true);
                else setReportModalOpen(true);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
            >
              <IconMapper name="Plus" size={18} className="mr-2" />
              Report New Down
            </Button>
          )}

          {/* Admin: Report Form (embedded left column) + Downs list (right column) */}
          {mode === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 p-6" id="report-form">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Report a Down</h2>
                <AdminReportForm />
              </Card>

              <Card className="lg:col-span-2 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Open Downs</h2>
                <div className="divide-y dark:divide-gray-700">
                  {downsData.map((d: Down) => (
                    <div key={d.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {d.title}{' '}
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-gray-700 dark:text-gray-100">{d.type.replace('_', ' ')}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-2">
                          Status: {d.status}{d.escalation_level ? ` • Escalation ${d.escalation_level}` : ''}
                          {(d.guard_relation?.id || d.guard?.id) && (
                            <>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setSelectedGuardId(d.guard_relation?.id || d.guard!.id)}
                                className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                              >
                                View Guard {(d.guard_relation || d.guard)?.employee_id ? `(${(d.guard_relation || d.guard)!.employee_id})` : ''}
                              </button>
                            </>
                          )}
                        </div>
                        {d.description && <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{d.description}</div>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {d.status !== 'resolved' && <Button variant="outline" size="sm" onClick={() => handleEscalate(d.id)}>Escalate</Button>}
                        {d.status !== 'resolved' && <Button variant="outline" size="sm" onClick={() => handleResolve(d.id)}>Resolve</Button>}
                        {d.status !== 'resolved' && d.status !== 'absconding' && <Button variant="outline" size="sm" onClick={() => handleAbscond(d.id)}>Abscond</Button>}
                      </div>
                    </div>
                  ))}
                  {downsData.length === 0 && (
                    <EmptyState title="No open downs" description="You're clear right now. New downs will appear here." size="sm" contentClassName="py-6" />
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Control Room / Zone Commander: Downs list as cards */}
          {(mode === 'control-room' || mode === 'zone-commander') && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Active Downs
                <Badge variant="outline" className="text-gray-500 dark:text-gray-400">{downsData.length}</Badge>
              </h2>

              {downsData.length === 0 ? (
                <EmptyState title="No downs to display" description="All clear! New downs will appear here." size="sm" />
              ) : (
                <div className="space-y-3">
                  {downsData.map((down: Down) => (
                    <DownCard
                      key={down.id}
                      down={down}
                      onEscalate={handleEscalate}
                      onResolve={handleResolve}
                      onAbscond={handleAbscond}
                      onViewGuard={setSelectedGuardId}
                      onDeployCover={setDeployCoverDown}
                      showAbscond={mode !== 'zone-commander'}
                      showDeployCover={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination (Control Room) */}
          {mode === 'control-room' && downsProp?.links && downsProp?.meta?.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {downsProp?.meta?.current_page} of {downsProp?.meta?.last_page}
              </p>
              <div className="flex gap-1">
                {(downsProp as any).links
                  ?.filter((l: any) => l.url)
                  .map((l: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => router.get(l.url, {}, { preserveScroll: true })}
                      className={`px-3 py-1.5 rounded text-sm ${
                        l.active
                          ? 'bg-red-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                      dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </AuthenticatedLayout>

      {/* Control Room Report Dialog */}
      {mode === 'control-room' && (
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report a Down</DialogTitle>
            </DialogHeader>
            <ControlRoomReportForm onSuccess={() => setIsReportOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Zone Commander Report Modal */}
      {mode === 'zone-commander' && (
        <Modal show={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Report Down</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Log an issue and notify coverage action.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>Close</Button>
            </div>
            <div className="mt-4">
              <ZoneCommanderReportForm onSuccess={() => setReportModalOpen(false)} />
            </div>
          </div>
        </Modal>
      )}

      {/* Guard Details Modal */}
      <GuardDetailsModal
        guardId={selectedGuardId}
        isOpen={!!selectedGuardId}
        onClose={() => setSelectedGuardId(null)}
        routeName={guardJsonRoute}
      />

      {/* Deploy Cover Modal */}
      <DeployCoverModal
        down={deployCoverDown}
        guards={guards}
        isOpen={!!deployCoverDown}
        onClose={() => setDeployCoverDown(null)}
        routePrefix={routePrefix}
      />
    </>
  );
}
