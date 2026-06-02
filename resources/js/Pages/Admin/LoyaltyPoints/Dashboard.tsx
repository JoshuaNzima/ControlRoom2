import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface LoyaltyRule {
  id: number;
  name: string;
  type: string;
  points_per_unit: number;
  unit_description: string;
  is_active: boolean;
}

interface LoyaltyTier {
  id: number;
  name: string;
  level: number;
  min_points: number;
  max_points: number | null;
  multiplier: number;
  color?: string | null;
  icon?: string | null;
  is_active: boolean;
}

interface LoyaltyReward {
  id: number;
  name: string;
  description: string | null;
  type: string;
  points_required: number;
  value: number | null;
  unit: string | null;
  quantity_available: number | null;
  is_limited: boolean;
  requires_approval: boolean;
  is_active: boolean;
}

interface LoyaltyPoints {
  total_points: number;
  available_points: number;
  redeemed_points: number;
  pending_points: number;
}

interface ClientRow {
  id: number;
  name: string;
  email: string | null;
  status: string;
  loyaltyPoints?: LoyaltyPoints | null;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Props {
  clients: {
    data: ClientRow[];
    links: PaginationLink[];
    meta?: {
      last_page?: number;
    };
  };
  rules: LoyaltyRule[];
  tiers: LoyaltyTier[];
  rewards: LoyaltyReward[];
  stats: {
    total_clients: number;
    total_points_distributed: number;
    total_points_redeemed: number;
    pending_redemptions: number;
  };
}

export default function Dashboard({ clients, rules, tiers, rewards, stats }: Props) {
  const [awardClientId, setAwardClientId] = useState<string>(clients.data[0]?.id ? String(clients.data[0].id) : '');
  const [awardPoints, setAwardPoints] = useState<string>('');
  const [awardReason, setAwardReason] = useState<string>('');
  const [awardType, setAwardType] = useState<'earned' | 'bonus'>('bonus');

  const [redeemClientId, setRedeemClientId] = useState<string>(clients.data[0]?.id ? String(clients.data[0].id) : '');
  const [redeemRewardId, setRedeemRewardId] = useState<string>(rewards[0]?.id ? String(rewards[0].id) : '');

  const topClients = useMemo(() => {
    return [...clients.data]
      .filter((client) => client.loyaltyPoints)
      .sort((a, b) => (b.loyaltyPoints?.available_points ?? 0) - (a.loyaltyPoints?.available_points ?? 0))
      .slice(0, 8);
  }, [clients.data]);

  const handleAwardPoints = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!awardClientId || !awardPoints || !awardReason) return;

    router.post(
      route('admin.loyalty.award-points', Number(awardClientId)),
      {
        points: Number(awardPoints),
        reason: awardReason,
        type: awardType,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setAwardPoints('');
          setAwardReason('');
        },
      },
    );
  };

  const handleRedeemReward = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!redeemClientId || !redeemRewardId) return;

    router.post(
      route('admin.loyalty.redeem', Number(redeemClientId)),
      {
        reward_id: Number(redeemRewardId),
      },
      {
        preserveScroll: true,
      },
    );
  };

  return (
    <AdminLayout title="Loyalty Management">
      <Head title="Loyalty Management" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <IconMapper name="Gift" size={26} />
                </span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty Management</h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage points, tiers, rules, rewards, and client redemptions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={route('admin.loyalty.rules')}>
                  <IconMapper name="Settings2" size={16} className="mr-2" />
                  Rules
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={route('admin.loyalty.tiers')}>
                  <IconMapper name="Award" size={16} className="mr-2" />
                  Tiers
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={route('admin.loyalty.rewards')}>
                  <IconMapper name="Ticket" size={16} className="mr-2" />
                  Rewards
                </Link>
              </Button>
              <Button asChild>
                <Link href={route('admin.loyalty.export')}>
                  <IconMapper name="Download" size={16} className="mr-2" />
                  Export Report
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total_clients}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Points Distributed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {Math.floor(stats.total_points_distributed).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Points Redeemed</p>
              <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                {Math.floor(stats.total_points_redeemed).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Redemptions</p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{stats.pending_redemptions}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Manual Point Awards</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAwardPoints}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Client</span>
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      value={awardClientId}
                      onChange={(event) => setAwardClientId(event.target.value)}
                    >
                      {clients.data.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</span>
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      value={awardType}
                      onChange={(event) => setAwardType(event.target.value as 'earned' | 'bonus')}
                    >
                      <option value="bonus">Bonus</option>
                      <option value="earned">Earned</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={awardPoints}
                      onChange={(event) => setAwardPoints(event.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      placeholder="500"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason</span>
                    <input
                      type="text"
                      value={awardReason}
                      onChange={(event) => setAwardReason(event.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      placeholder="Bonus for contract renewal"
                    />
                  </label>
                </div>

                <Button type="submit" className="w-full">
                  Award Points
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Reward Redemption</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleRedeemReward}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Client</span>
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      value={redeemClientId}
                      onChange={(event) => setRedeemClientId(event.target.value)}
                    >
                      {clients.data.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reward</span>
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      value={redeemRewardId}
                      onChange={(event) => setRedeemRewardId(event.target.value)}
                    >
                      {rewards.map((reward) => (
                        <option key={reward.id} value={reward.id}>
                          {reward.name} — {reward.points_required} pts
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={rewards.length === 0}>
                  Redeem Reward
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Client</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Available</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                          No loyalty balances found yet.
                        </td>
                      </tr>
                    ) : (
                      topClients.map((client) => (
                        <tr key={client.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{client.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{client.email || 'No email'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              {Math.floor(client.loyaltyPoints?.available_points ?? 0)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                            {Math.floor(client.loyaltyPoints?.total_points ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button asChild size="sm" variant="outline">
                              <Link href={route('finance.loyalty.client', client.id)}>View</Link>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Program Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Rules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{rules.length}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tiers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tiers.length}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Rewards</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{rewards.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Quick Links</p>
                <div className="mt-3 space-y-2">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href={route('admin.loyalty.rules')}>Manage Rules</Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href={route('admin.loyalty.tiers')}>Manage Tiers</Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href={route('admin.loyalty.rewards')}>Manage Rewards</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
