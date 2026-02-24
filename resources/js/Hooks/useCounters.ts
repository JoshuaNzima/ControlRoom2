import { useEffect, useRef, useState } from 'react';

export type Counters = {
  notifications_unread?: number;
  requisitions_my_open?: number;
  requisitions_needs_revision?: number;
  requisitions_pending_admin?: number;
  requisitions_pending_disbursement?: number;
  requisition_batches_pending_ack?: number;
  finance_approvals_pending?: number;
  finance_expenses_pending_mine?: number;
  budgets_my_open?: number;
  budgets_needs_revision?: number;
  budgets_pending_admin?: number;
  budgets_pending_release?: number;
  control_tickets_open?: number;
  control_incidents_open?: number;
  control_flags_pending?: number;
  control_downs_active?: number;
  alerts_active?: number;

  downs_open?: number;
  downs_escalated?: number;
  downs_resolved_today?: number;
  attendance_absent_today?: number;
  attendance_covered_today?: number;
  attendance_checked_in_today?: number;
  deployments_today?: number;

  assets_handovers_outstanding?: number;
};

let sharedCounters: Counters = {};
let listeners = new Set<(counters: Counters) => void>();
let sharedTimer: number | null = null;
let sharedPollMs = 30000;
let inFlight: Promise<void> | null = null;

async function fetchAndBroadcast() {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch('/counters', { credentials: 'same-origin' });
      if (!res.ok) return;
      const json = await res.json();
      sharedCounters = (json || {}) as Counters;
      listeners.forEach((fn) => fn(sharedCounters));
    } catch {
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

function ensureTimer(pollMs: number) {
  if (typeof window === 'undefined') return;

  if (sharedTimer && sharedPollMs === pollMs) return;
  if (sharedTimer) window.clearInterval(sharedTimer);
  sharedPollMs = pollMs;
  sharedTimer = window.setInterval(fetchAndBroadcast, pollMs);
}

export default function useCounters(pollMs: number = 30000) {
  const [counters, setCounters] = useState<Counters>(sharedCounters);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    listeners.add(setCounters);
    setCounters(sharedCounters);

    ensureTimer(pollMs);
    if (typeof window !== 'undefined' && timer.current === null) {
      timer.current = 1;
      fetchAndBroadcast();
    }

    return () => {
      listeners.delete(setCounters);
      if (listeners.size === 0 && sharedTimer) {
        window.clearInterval(sharedTimer);
        sharedTimer = null;
      }
    };
  }, [pollMs]);

  return { counters, refresh: fetchAndBroadcast };
}
