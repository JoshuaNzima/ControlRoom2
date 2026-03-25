import React, { useState, useCallback, useRef, useEffect } from 'react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import EmptyState from '@/Components/ui/empty-state';
import { formatDistanceToNow } from '@/Components/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';

// Types
type DownStatus = 'open' | 'escalated' | 'resolved' | 'absconding';
type DownType = 'guard_absent' | 'site_unmanned' | 'other';

type Down = {
  id: number;
  title: string;
  type: DownType;
  status: DownStatus;
  description?: string;
  escalation_level: number;
  reporter?: { id: number; name: string };
  client?: { id: number; name: string };
  client_site?: { id: number; name: string };
  guard_relation?: { id: number; name: string; employee_id?: string; status?: string };
  created_at: string;
};

type PageProps = {
  auth: { user?: { name?: string } };
  downs: {
    data: Down[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    meta?: { current_page: number; last_page: number; total?: number };
  };
  stats?: {
    total?: number;
    open?: number;
    escalated?: number;
    resolved?: number;
    absconding?: number;
  };
};

// Status Config
const statusConfig: Record<DownStatus, { color: string; icon: string; label: string; bg: string }> = {
  open: {
    color: 'text-blue-400',
    icon: 'AlertCircle',
    label: 'Open',
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
  escalated: {
    color: 'text-amber-400',
    icon: 'TrendingUp',
    label: 'Escalated',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  resolved: {
    color: 'text-emerald-400',
    icon: 'CheckCircle',
    label: 'Resolved',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  absconding: {
    color: 'text-purple-400',
    icon: 'ShieldAlert',
    label: 'Absconding',
    bg: 'bg-purple-500/10 border-purple-500/30',
  },
};

const typeConfig: Record<DownType, { label: string; color: string }> = {
  guard_absent: { label: 'Guard Absent', color: 'text-orange-400' },
  site_unmanned: { label: 'Site Unmanned', color: 'text-red-400' },
  other: { label: 'Other', color: 'text-gray-400' },
};

// Simple Mobile Actions Dropdown
function MobileActionsDropdown({
  down,
  onEscalate,
  onResolve,
  onAbscond,
}: {
  down: Down;
  onEscalate: (id: number) => void;
  onResolve: (id: number) => void;
  onAbscond: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="w-full border-slate-600 text-slate-300"
      >
        <IconMapper name="MoreVertical" size={14} className="mr-1" />
        Actions
      </Button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg overflow-hidden z-50">
          <button
            onClick={() => { onEscalate(down.id); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 flex items-center"
          >
            <IconMapper name="TrendingUp" size={14} className="mr-2" />
            Escalate
          </button>
          <button
            onClick={() => { onResolve(down.id); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 flex items-center"
          >
            <IconMapper name="CheckCircle" size={14} className="mr-2" />
            Resolve
          </button>
          {down.status !== 'absconding' && (
            <button
              onClick={() => { onAbscond(down.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-purple-400 hover:bg-purple-500/10 flex items-center"
            >
              <IconMapper name="ShieldAlert" size={14} className="mr-2" />
              Abscond
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Down Card Component
function DownCard({
  down,
  onEscalate,
  onResolve,
  onAbscond,
  onViewGuard,
}: {
  down: Down;
  onEscalate: (id: number) => void;
  onResolve: (id: number) => void;
  onAbscond: (id: number) => void;
  onViewGuard: (id: number) => void;
}) {
  const status = statusConfig[down.status] || statusConfig.open;
  const type = typeConfig[down.type] || typeConfig.other;
  const isResolved = down.status === 'resolved';

  return (
    <Card className={`overflow-hidden border ${status.bg} hover:shadow-lg transition-all`}>
      <div className="p-4">
        {/* Header: Status + Type + Time */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${status.color} border-current text-xs`}>
              <IconMapper name={status.icon} size={12} className="mr-1" />
              {status.label}
              {down.escalation_level > 0 && ` • L${down.escalation_level}`}
            </Badge>
            <span className={`text-xs font-medium ${type.color}`}>{type.label}</span>
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {formatDistanceToNow(down.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">
          {down.title}
        </h3>

        {/* Location/Client Info - Collapsed on mobile */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 flex-wrap">
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

        {/* Description - Truncated */}
        {down.description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
            {down.description}
          </p>
        )}

        {/* Guard Link */}
        {down.guard_relation?.id && (
          <button
            onClick={() => onViewGuard(down.guard_relation!.id)}
            className="text-xs flex items-center gap-1 text-slate-300 hover:text-white mb-3 transition-colors"
          >
            <IconMapper name="Shield" size={12} />
            {down.guard_relation.name}
            {down.guard_relation.employee_id && ` (${down.guard_relation.employee_id})`}
          </button>
        )}

        {/* Actions */}
        {!isResolved && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
            {/* Mobile: Dropdown Menu */}
            <div className="sm:hidden flex-1">
              <MobileActionsDropdown
                down={down}
                onEscalate={onEscalate}
                onResolve={onResolve}
                onAbscond={onAbscond}
              />
            </div>

            {/* Desktop: Individual Buttons */}
            <div className="hidden sm:flex items-center gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEscalate(down.id)}
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              >
                <IconMapper name="TrendingUp" size={14} className="mr-1" />
                Escalate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(down.id)}
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              >
                <IconMapper name="CheckCircle" size={14} className="mr-1" />
                Resolve
              </Button>
              {down.status !== 'absconding' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAbscond(down.id)}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  <IconMapper name="ShieldAlert" size={14} className="mr-1" />
                  Abscond
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Report Down Form
function ReportDownForm({ onSuccess }: { onSuccess: () => void }) {
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
  const [siteResults, setSiteResults] = useState<Array<{ id: number; name: string; client_name: string }>>([]);
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
        <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => setData('title', e.target.value)}
          className="w-full rounded-md border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          placeholder="Brief description of the issue"
          required
        />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
        <select
          value={data.type}
          onChange={(e) => setData('type', e.target.value as DownType)}
          className="w-full rounded-md border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
        >
          <option value="site_unmanned">Site Unmanned</option>
          <option value="guard_absent">Guard Absent</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => setData('description', e.target.value)}
          rows={3}
          className="w-full rounded-md border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          placeholder="Additional details..."
        />
      </div>

      {/* Site Search */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Link Site</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={siteSearch}
            onChange={(e) => setSiteSearch(e.target.value)}
            placeholder="Search site or client..."
            className="flex-1 rounded-md border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={loadSites} disabled={loadingSites}>
            {loadingSites ? '...' : 'Search'}
          </Button>
        </div>
        {selectedSiteName && (
          <p className="text-xs text-slate-400 mt-1">Selected: {selectedSiteName}</p>
        )}
        {siteResults.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto rounded border border-slate-700 bg-slate-800">
            {siteResults.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setData('client_site_id', String(s.id));
                  setSelectedSiteName(`${s.client_name} • ${s.name}`);
                  setSiteResults([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm"
              >
                <div className="text-slate-200">{s.client_name}</div>
                <div className="text-slate-400 text-xs">{s.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guard Search */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Link Guard</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={guardSearch}
            onChange={(e) => setGuardSearch(e.target.value)}
            placeholder="Search guard name or ID..."
            className="flex-1 rounded-md border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={loadGuards} disabled={loadingGuards}>
            {loadingGuards ? '...' : 'Search'}
          </Button>
        </div>
        {selectedGuardName && (
          <p className="text-xs text-slate-400 mt-1">Selected: {selectedGuardName}</p>
        )}
        {guardResults.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto rounded border border-slate-700 bg-slate-800">
            {guardResults.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setData('guard_id', String(g.id));
                  setSelectedGuardName(`${g.name}${g.employee_id ? ` • ${g.employee_id}` : ''}`);
                  setGuardResults([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm"
              >
                <div className="text-slate-200">{g.name}</div>
                {g.employee_id && <div className="text-slate-400 text-xs">{g.employee_id}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Flag Guard */}
      <div className="border-t border-slate-700 pt-4">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={data.flag_guard}
            onChange={(e) => setData('flag_guard', e.target.checked)}
            className="rounded border-slate-600"
          />
          Flag involved guard
        </label>

        {data.flag_guard && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={data.flag_reason}
              onChange={(e) => setData('flag_reason', e.target.value)}
              placeholder="Flag reason"
              className="w-full rounded-md border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
            />
            <textarea
              value={data.flag_details}
              onChange={(e) => setData('flag_details', e.target.value)}
              placeholder="Additional details"
              rows={2}
              className="w-full rounded-md border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={processing}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
      >
        {processing ? 'Reporting...' : 'Report Down'}
      </Button>
    </form>
  );
}

// Guard Details Modal
function GuardDetailsModal({
  guardId,
  isOpen,
  onClose,
}: {
  guardId: number | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [guard, setGuard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (guardId && isOpen) {
      setLoading(true);
      fetch(route('control-room.guards.json', guardId), {
        headers: { Accept: 'application/json' },
      })
        .then((res) => res.json())
        .then((data) => setGuard(data))
        .catch(() => setGuard({ error: 'Failed to load' }))
        .finally(() => setLoading(false));
    }
  }, [guardId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Guard Details</DialogTitle>
        </DialogHeader>
        {loading && <p className="text-slate-400">Loading...</p>}
        {!loading && guard?.error && <p className="text-red-400">{guard.error}</p>}
        {!loading && guard && !guard.error && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Name</span>
                <p className="text-white font-medium">{guard.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Employee ID</span>
                <p className="text-white font-medium">{guard.employee_id}</p>
              </div>
              <div>
                <span className="text-slate-400">Phone</span>
                <p className="text-white">{guard.phone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400">Status</span>
                <p className="text-white">{guard.status || '—'}</p>
              </div>
            </div>

            {Array.isArray(guard.assignments) && guard.assignments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Assignments</h4>
                <div className="space-y-2">
                  {guard.assignments.map((a: any) => (
                    <div
                      key={a.id}
                      className="p-2 rounded bg-slate-700/50 text-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="text-slate-200">
                          {a.site?.client?.name || 'Client'} • {a.site?.name || 'Site'}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {a.start_date}
                          {a.end_date && ` → ${a.end_date}`}
                        </div>
                      </div>
                      <Badge
                        className={
                          a.is_active
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-600 text-slate-400'
                        }
                      >
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

// Main Component
export default function DownsIndex() {
  const { auth, downs: downsProp, stats: serverStats } = usePage().props as any;
  const downs = downsProp?.data ? downsProp : { data: [] };
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleEscalate = (id: number) => {
    router.post(route('control-room.downs.escalate', id));
  };

  const handleResolve = (id: number) => {
    // The resolve route uses resolveWithIncentive which requires resolution_type
    router.post(route('control-room.downs.resolve', id), {
      resolution_type: 'control_room_resolved',
    });
  };

  const handleAbscond = (id: number) => {
    router.post(route('control-room.downs.abscond', id));
  };

  // Use server stats (accurate across all pages) with fallback to client-side counting
  const downsData = downs?.data || [];
  const stats = [
    {
      label: 'Open',
      value: serverStats?.open ?? downsData.filter((d: any) => d.status === 'open').length,
      color: 'bg-blue-500',
      icon: 'AlertCircle',
    },
    {
      label: 'Escalated',
      value: serverStats?.escalated ?? downsData.filter((d: any) => d.status === 'escalated').length,
      color: 'bg-amber-500',
      icon: 'TrendingUp',
    },
    {
      label: 'Resolved',
      value: serverStats?.resolved ?? downsData.filter((d: any) => d.status === 'resolved').length,
      color: 'bg-emerald-500',
      icon: 'CheckCircle',
    },
    {
      label: 'Absconding',
      value: serverStats?.absconding ?? downsData.filter((d: any) => d.status === 'absconding').length,
      color: 'bg-purple-500',
      icon: 'ShieldAlert',
    },
  ];

  return (
    <ControlRoomLayout title="Downs Management" user={auth?.user as any}>
      <Head title="Downs Management" />

      <div className="min-h-screen bg-slate-950 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <IconMapper name="AlertTriangle" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Downs</h1>
                  <p className="text-red-100 text-sm">Report & resolve coverage issues</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-red-200">Active</p>
                <p className="text-2xl font-bold">
                  {downsData.filter((d: any) => d.status !== 'resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                  <IconMapper name={stat.icon} size={16} className="text-white" />
                </div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Report Button - Mobile Optimized */}
          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-base sm:text-sm sm:py-2">
                <IconMapper name="Plus" size={18} className="mr-2" />
                Report New Down
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Report a Down</DialogTitle>
              </DialogHeader>
              <ReportDownForm onSuccess={() => setIsReportOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* Downs List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Active Downs
              <Badge variant="outline" className="text-slate-400">
                {downsData.length}
              </Badge>
            </h2>

            {downsData.length === 0 ? (
              <EmptyState
                title="No downs to display"
                description="All clear! New downs will appear here."
                size="sm"
              />
            ) : (
              <div className="space-y-3">
                {downsData.map((down: any) => (
                  <DownCard
                    key={down.id}
                    down={down}
                    onEscalate={handleEscalate}
                    onResolve={handleResolve}
                    onAbscond={handleAbscond}
                    onViewGuard={setSelectedGuardId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {(downs as any)?.links && (downs as any).meta?.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-slate-400">
                Page {downs?.meta?.current_page} of {downs?.meta?.last_page}
              </p>
              <div className="flex gap-1">
                {(downs as any).links
                  ?.filter((l: any) => l.url)
                  .map((l: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => router.get(l.url, {}, { preserveScroll: true })}
                      className={`px-3 py-1.5 rounded text-sm ${
                        l.active
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guard Details Modal */}
      <GuardDetailsModal
        guardId={selectedGuardId}
        isOpen={!!selectedGuardId}
        onClose={() => setSelectedGuardId(null)}
      />
    </ControlRoomLayout>
  );
}
