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
  assets_handovers_outstanding?: number;
};

export default function useCounters(pollMs: number = 30000) {
  const [counters, setCounters] = useState<Counters>({});
  const timer = useRef<number | null>(null);

  async function fetchCounters() {
    try {
      const res = await fetch('/counters', { credentials: 'same-origin' });
      if (!res.ok) return;
      const json = await res.json();
      setCounters(json || {});
    } catch {}
  }

  useEffect(() => {
    fetchCounters();
    // @ts-ignore
    timer.current = window.setInterval(fetchCounters, pollMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [pollMs]);

  return { counters, refresh: fetchCounters };
}
