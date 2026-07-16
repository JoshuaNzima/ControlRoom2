import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';

interface Client {
  id: number;
  name: string;
  email: string;
}

interface Reward {
  name: string;
}

interface ApprovedBy {
  name: string;
}

interface Redemption {
  id: number;
  status: string;
  points_used: number;
  value_received: number | null;
  created_at: string;
  client: Client;
  reward: Reward;
  approvedBy?: ApprovedBy | null;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Props {
  redemptions: {
    data: Redemption[];
    links?: PaginationLink[];
    meta?: Record<string, unknown>;
  };
}

function statusTone(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'approved':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300';
  }
}

export default function PendingRedemptions({ redemptions }: Props) {
  const total = redemptions.data.length;
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const pendingRedemptionIds = useMemo(() => new Set(redemptions.data.map((r) => r.id)), [redemptions.data]);

  const handleApprove = (redemption: Redemption) => {
    if (!pendingRedemptionIds.has(redemption.id)) return;

    setNotice(null);
    setBusyId(redemption.id);

    router.post(
      route('finance.loyalty.approve', redemption.id),
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setBusyId(null);
          setRejectingId(null);
          setRejectReason('');
          setNotice({ type: 'success', message: 'Redemption approved' });
          router.reload({ only: ['redemptions'] });
        },
        onError: (errors: any) => {
          setBusyId(null);
          setNotice({ type: 'error', message: errors?.message || 'Unable to approve redemption' });
        },
      },
    );
  };

  const handleRejectSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!rejectingId) return;
    if (!rejectReason.trim()) return;

    setNotice(null);
    setBusyId(rejectingId);

    router.post(
      route('finance.loyalty.reject', rejectingId),
      { reason: rejectReason },
      {
        preserveScroll: true,
        onSuccess: () => {
          setBusyId(null);
          setRejectingId(null);
          setRejectReason('');
          setNotice({ type: 'success', message: 'Redemption rejected' });
          router.reload({ only: ['redemptions'] });
        },
        onError: (errors: any) => {
          setBusyId(null);
          setNotice({ type: 'error', message: errors?.message || 'Unable to reject redemption' });
        },
      },
    );
  };

  return (
    <AuthenticatedLayout header="Pending Redemptions">
      <Head title="Pending Redemptions" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {notice && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              notice.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {notice.message}
          </div>
        )}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              <IconMapper name="Clock3" size={32} className="text-amber-500" />
              Pending Redemptions
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review and approve client loyalty redemption requests.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={route('finance.loyalty.dashboard')}>
                <IconMapper name="ArrowLeft" size={16} className="mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href={route('finance.loyalty.export')}>
                <IconMapper name="Download" size={16} className="mr-2" />
                Export Report
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">Awaiting Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Quick Action</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Open a client record to review history
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {redemptions.data.length ? (
              <div className="space-y-4">
                {redemptions.data.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {redemption.client?.name || 'Unknown Client'}
                          </p>
                          <Badge className={statusTone(redemption.status)}>{redemption.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {redemption.reward?.name || 'Unknown reward'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Requested on {new Date(redemption.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-lg bg-amber-50 px-4 py-2 text-center dark:bg-amber-950/20">
                          <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Points</p>
                          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                            {Number(redemption.points_used).toFixed(0)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-4 py-2 text-center dark:bg-gray-900">
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Value</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {redemption.value_received !== null && redemption.value_received !== undefined
                              ? Number(redemption.value_received).toLocaleString()
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" asChild variant="outline">
                        <Link href={route('finance.loyalty.client', redemption.client.id)}>View Client</Link>
                      </Button>

                      {redemption.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={busyId !== null || rejectingId !== null}
                            onClick={() => handleApprove(redemption)}
                          >
                            Approve
                          </Button>

                          {rejectingId === redemption.id ? (
                            <form onSubmit={handleRejectSubmit} className="flex w-full flex-wrap gap-2">
                              <input
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection (required)"
                                maxLength={500}
                              />
                              <Button size="sm" type="submit" disabled={busyId !== redemption.id || !rejectReason.trim()}>
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                type="button"
                                variant="outline"
                                disabled={busyId !== null}
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason('');
                                }}
                              >
                                Cancel
                              </Button>
                            </form>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId !== null || rejectingId !== null}
                              onClick={() => {
                                setRejectingId(redemption.id);
                                setRejectReason('');
                              }}
                            >
                              Reject
                            </Button>
                          )}
                        </>
                      )}

                      {redemption.approvedBy && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Reviewed by {redemption.approvedBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No pending redemptions found.
              </div>
            )}

            {redemptions.links && redemptions.links.length > 1 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {redemptions.links.map((link, index) => (
                  <Button
                    key={index}
                    asChild
                    size="sm"
                    variant={link.active ? 'default' : 'outline'}
                    disabled={!link.url}
                  >
                    <Link href={link.url || '#' } dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
