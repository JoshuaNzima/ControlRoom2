import React, { useState } from 'react';
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
  phone?: string | null;
  status?: string;
}

interface LoyaltySummary {
  total_points: number;
  available_points: number;
  redeemed_points: number;
  pending_points: number;
  current_tier: { name: string; multiplier: number } | null;
  next_tier: { name: string; min_points: number } | null;
  points_to_next_tier: number | null;
  progress_percent: number;
  last_earned_at: string | null;
  last_redeemed_at: string | null;
}

interface Transaction {
  id: number;
  type: string;
  type_label: string;
  type_color: string;
  points: number;
  balance_before: number;
  balance_after: number;
  reason: string;
  status: string;
  created_at: string;
  created_at_relative: string;
}

interface Redemption {
  id: number;
  status: string;
  points_used: number;
  value_received: number | null;
  created_at: string;
  reward: {
    name: string;
  };
  approvedBy?: {
    name: string;
  } | null;
}

interface Props {
  client: Client;
  summary: LoyaltySummary;
  transactions: Transaction[];
  redemptions: {
    data: Redemption[];
    links?: any[];
    meta?: any;
  };
}

export default function ClientDetails({ client, summary, transactions, redemptions }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const handleApprove = (redemptionId: number) => {
    if (busyId !== null) return;

    setBusyId(redemptionId);

    router.post(
      route('finance.loyalty.approve', redemptionId),
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setBusyId(null);
          setRejectingId(null);
          setRejectReason('');
          router.reload();
        },
        onError: () => {
          setBusyId(null);
        },
      },
    );
  };

  const handleRejectSubmit = (redemptionId: number) => {
    if (busyId !== null) return;
    if (!rejectReason.trim()) return;

    setBusyId(redemptionId);

    router.post(
      route('finance.loyalty.reject', redemptionId),
      { reason: rejectReason },
      {
        preserveScroll: true,
        onSuccess: () => {
          setBusyId(null);
          setRejectingId(null);
          setRejectReason('');
          router.reload();
        },
        onError: () => {
          setBusyId(null);
        },
      },
    );
  };

  return (
    <AuthenticatedLayout header="Client Loyalty Details">
      <Head title={`${client.name} Loyalty`} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{client.name}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {client.email}{client.phone ? ` • ${client.phone}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={route('finance.loyalty.dashboard')}>
                <IconMapper name="ArrowLeft" size={16} className="mr-2" />
                Back
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={route('finance.loyalty.export')}>
                <IconMapper name="Download" size={16} className="mr-2" />
                Export Report
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Available Points</p>
              <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                {Math.floor(summary.available_points)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.floor(summary.total_points)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Redeemed</p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                {Math.floor(summary.redeemed_points)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Tier</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.current_tier?.name || 'Bronze'}
              </p>
            </CardContent>
          </Card>
        </div>

        {summary.next_tier && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tier Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {summary.current_tier?.name || 'Bronze'} → {summary.next_tier.name}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {summary.points_to_next_tier} points to next tier
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-3 rounded-full bg-amber-500" style={{ width: `${Math.min(100, summary.progress_percent)}%` }} />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(summary.progress_percent)}% complete
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transactions.length ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className={transaction.type_color}>{transaction.type_label}</Badge>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {transaction.points > 0 ? '+' : ''}{transaction.points.toFixed(0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{transaction.created_at_relative}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{transaction.reason}</p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Balance: {transaction.balance_before.toFixed(0)} → {transaction.balance_after.toFixed(0)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No transactions found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Redemptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {redemptions.data.length ? (
                redemptions.data.map((redemption) => (
                  <div key={redemption.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{redemption.reward?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {redemption.points_used} points • {redemption.status}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">{redemption.status}</Badge>

                        {redemption.status === 'pending' && (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={busyId !== null}
                              onClick={() => handleApprove(redemption.id)}
                            >
                              Approve
                            </Button>

                            {rejectingId === redemption.id ? (
                              <>
                                <input
                                  className="w-full sm:w-72 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Reason for rejection (required)"
                                  maxLength={500}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId !== redemption.id || !rejectReason.trim()}
                                  onClick={() => handleRejectSubmit(redemption.id)}
                                >
                                  Submit Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={busyId !== null}
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId !== null}
                                onClick={() => {
                                  setRejectingId(redemption.id);
                                  setRejectReason('');
                                }}
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No redemptions found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
