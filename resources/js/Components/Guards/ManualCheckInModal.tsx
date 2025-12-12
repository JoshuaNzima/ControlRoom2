import React from 'react';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';

type Site = { id: number; name: string; client_name: string };

export default function ManualCheckInModal({
  open,
  guardId,
  zones = [],
  onClose,
  onSuccess,
}: {
  open: boolean;
  guardId: number | null;
  zones: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [zoneId, setZoneId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [sites, setSites] = React.useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = React.useState<number | ''>('');
  const [time, setTime] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);
  const [reasonCode, setReasonCode] = React.useState<string>('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [assignedSiteId, setAssignedSiteId] = React.useState<number | null>(null);
  const [assignedSiteLabel, setAssignedSiteLabel] = React.useState<string>('');
  const [backdate, setBackdate] = React.useState<boolean>(false);
  const [backdateReason, setBackdateReason] = React.useState<string>('');

  const loadSites = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (zoneId) params.set('zone_id', zoneId);
      const url = `${route('control-room.clients.sites.json')}?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data: Site[] = await res.json();
      setSites(data);
    } catch {}
    finally { setLoading(false); }
  }, [search, zoneId]);

  React.useEffect(() => {
    if (open) {
      loadSites();
      setSelectedSite('');
      setTime('');
      setNotes('');
      setErrors({});
      setReasonCode('');
      setBackdate(false);
      setBackdateReason('');
      // Fetch guard to determine current assignment restriction
      if (guardId) {
        const url = route('control-room.guards.json', { guard: guardId });
        fetch(url, { headers: { Accept: 'application/json' } })
          .then(r => r.ok ? r.json() : Promise.reject())
          .then((g) => {
            const today = new Date().toISOString().slice(0,10);
            const current = Array.isArray(g?.assignments) ? g.assignments.find((a: any) => a?.is_active && (!a?.end_date || a.end_date >= today)) : null;
            const site = current?.site;
            if (site?.id) {
              setAssignedSiteId(Number(site.id));
              setAssignedSiteLabel(`${site?.client?.name || 'Client'} • ${site?.name || 'Site'}`);
              setSelectedSite(Number(site.id));
            } else {
              setAssignedSiteId(null);
              setAssignedSiteLabel('');
            }
          })
          .catch(() => { setAssignedSiteId(null); setAssignedSiteLabel(''); });
      } else {
        setAssignedSiteId(null);
        setAssignedSiteLabel('');
      }
    }
  }, [open, loadSites]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardId || !selectedSite) return;
    setSubmitting(true);
    router.post(route('control-room.attendance.check-in'), {
      guard_id: guardId,
      client_site_id: selectedSite,
      time: time || undefined,
      notes: notes || undefined,
      reason_code: reasonCode || undefined,
      backdate: backdate ? 1 : 0,
      backdate_reason: backdate ? (backdateReason || undefined) : undefined,
    }, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => { setErrors({}); onSuccess(); onClose(); },
      onError: (errs: any) => {
        const e: Record<string, string> = {};
        Object.entries(errs || {}).forEach(([k, v]) => { e[String(k)] = String(v); });
        setErrors(e);
      },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <form onSubmit={submit} className="p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Check-In</h3>
        {errors.guard_id && (
          <div className="text-sm text-red-600">{errors.guard_id}</div>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-300">Fallback check-in when a supervisor/sergeant cannot. This action is logged.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Site or Client</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadSites())}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
              placeholder="e.g. Capital City Mall"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="">All zones</option>
              {zones.map(z => (<option key={z.id} value={z.id}>{z.name}</option>))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Select Site</span>
            <button type="button" onClick={loadSites} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{loading ? 'Loading...' : 'Refresh'}</button>
          </div>
          {!!assignedSiteId && (
            <div className="mb-2 text-xs text-coin-700 dark:text-coin-400">Restricted to current assignment: {assignedSiteLabel}</div>
          )}
          <div className="max-h-56 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
            {sites.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">{loading ? 'Loading...' : 'No sites found'}</div>
            ) : (
              <ul>
                {sites.map(s => (
                  <li key={s.id}>
                    <label className={`flex items-center gap-3 px-3 py-2 border-b last:border-0 border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${assignedSiteId && s.id !== assignedSiteId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input type="radio" name="site" value={s.id} checked={selectedSite === s.id}
                        onChange={() => setSelectedSite(s.id)} disabled={!!assignedSiteId && s.id !== assignedSiteId} />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.client_name}</div>
                        <div className="text-xs text-gray-500">{s.name}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.client_site_id && <div className="mt-2 text-xs text-red-600">{errors.client_site_id}</div>}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={backdate}
              onChange={(e) => setBackdate(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-700"
            />
            <span>Mark for yesterday (backdate up to 1 day)</span>
          </label>
          {errors.backdate && <div className="text-xs text-red-600">{errors.backdate}</div>}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use this if the sergeant reaches site after midnight but is confirming the previous day's shift. Backdating is only allowed for yesterday and within the configured cutoff time.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Backdate Reason (optional)</label>
            <input
              value={backdateReason}
              onChange={(e) => setBackdateReason(e.target.value)}
              disabled={!backdate}
              placeholder="e.g. Arrived after 00:30, network outage, etc."
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason Code (optional)</label>
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
          >
            <option value="">Select...</option>
            <option value="overtime">Overtime</option>
            <option value="supervisor_unavailable">Supervisor unavailable</option>
            <option value="gps_issue">GPS issue</option>
            <option value="network_outage">Network outage</option>
            <option value="device_failure">Device failure</option>
            <option value="emergency">Emergency</option>
            <option value="other">Other</option>
          </select>
          {errors.reason_code && <div className="mt-2 text-xs text-red-600">{errors.reason_code}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time (optional)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason or context"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">Cancel</button>
          <button type="submit" disabled={!selectedSite || !guardId || submitting} className="px-4 py-2 rounded-md bg-coin-700 hover:bg-coin-800 text-white disabled:opacity-50">{submitting ? 'Checking in...' : 'Check In'}</button>
        </div>
      </form>
    </Modal>
  );
}
