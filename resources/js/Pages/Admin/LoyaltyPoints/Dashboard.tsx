import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import IconMapper from '@/Components/IconMapper';
import AdminLayout from '@/Layouts/AdminLayout';

interface LoyaltyClient {
  id: number;
  name: string;
  email: string;
  loyaltyPoints?: {
    total_points: number;
    available_points: number;
    redeemed_points: number;
  };
}

interface LoyaltyRule {
  id: number;
  name: string;
  type: string;
  points_per_unit: number;
  unit_description: string;
  description?: string | null;
  is_active: boolean;
  priority?: number | null;
}

interface LoyaltyTier {
  id: number;
  name: string;
  level: number;
  min_points: number;
  max_points?: number | null;
  multiplier: number;
  benefits?: string[] | null;
  color?: string | null;
  icon?: string | null;
  is_active: boolean;
}

interface LoyaltyReward {
  id: number;
  name: string;
  description?: string | null;
  type: string;
  points_required: number;
  value?: number | null;
  unit?: string | null;
  quantity_available?: number | null;
  quantity_redeemed?: number | null;
  is_limited: boolean;
  requires_approval: boolean;
  is_active: boolean;
  valid_until?: string | null;
}

interface Stats {
  total_clients: number;
  total_points_distributed: number;
  total_points_redeemed: number;
  pending_redemptions: number;
}

interface Props {
  clients?: {
    data: LoyaltyClient[];
    links?: any[];
    meta?: any;
  };
  rules?: LoyaltyRule[];
  tiers?: LoyaltyTier[];
  rewards?: LoyaltyReward[];
  stats?: Stats;
}

function MetricCard({
  title,
  value,
  icon,
  tone,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: string;
  tone: string;
  subtitle?: string;
}) {
  return (
    <Card className={`border-2 ${tone}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-white/70 p-2 shadow-sm dark:bg-gray-950/70">
            <IconMapper name={icon} size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoyaltyDashboard({ clients, rules = [], tiers = [], rewards = [], stats }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'tiers' | 'rewards'>('overview');

  const totalAvailablePoints = useMemo(
    () => clients?.data?.reduce((sum, client) => sum + (client.loyaltyPoints?.available_points || 0), 0) || 0,
    [clients]
  );

  return (
    <AdminLayout title="Loyalty Program">
      <Head title="Loyalty Program" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-700 p-3 text-white shadow-lg shadow-red-950/20">
                <IconMapper name="Gift" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty Program</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage rewards, tiers, earning rules, and client balances.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={route('admin.loyalty.rules')}>
                <IconMapper name="Settings" size={16} className="mr-2" />
                Rules
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={route('admin.loyalty.tiers')}>
                <IconMapper name="BarChart3" size={16} className="mr-2" />
                Tiers
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={route('admin.loyalty.rewards')}>
                <IconMapper name="Gift" size={16} className="mr-2" />
                Rewards
              </Link>
            </Button>
            <Button asChild>
              <Link href={route('admin.loyalty.export')}>
                <IconMapper name="Download" size={16} className="mr-2" />
                Export CSV
              </Link>
            </Button>
          </div>
        </div>

        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Clients"
              value={stats.total_clients}
              icon="Users"
              tone="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
            />
            <MetricCard
              title="Points Distributed"
              value={Math.floor(stats.total_points_distributed).toLocaleString()}
              icon="ArrowUpRight"
              tone="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
            />
            <MetricCard
              title="Points Redeemed"
              value={Math.floor(stats.total_points_redeemed).toLocaleString()}
              icon="ArrowDownLeft"
              tone="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
            />
            <MetricCard
              title="Pending Approvals"
              value={stats.pending_redemptions}
              icon="Clock3"
              tone="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Client Balances</CardTitle>
                    <Badge variant="outline">
                      {clients?.data?.length || 0} clients
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {clients?.data?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px]">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Client</th>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Available</th>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Total</th>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Redeemed</th>
                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clients.data.map((client) => (
                            <tr key={client.id} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="px-3 py-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">{client.name}</p>
                                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{client.email}</p>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                                {Math.floor(client.loyaltyPoints?.available_points || 0)}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                                {Math.floor(client.loyaltyPoints?.total_points || 0)}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                                {Math.floor(client.loyaltyPoints?.redeemed_points || 0)}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <Button asChild size="sm" variant="outline">
                                  <Link href={route('finance.loyalty.client', client.id)}>
                                    <IconMapper name="Eye" size={16} />
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      No client loyalty balances available.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Client Points</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.floor(totalAvailablePoints).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Rules</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{rules.length}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Rewards</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{rewards.length}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Tiers</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{tiers.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="mt-6 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {rules.length ? (
                rules.map((rule) => (
                  <Card key={rule.id} className="border-2 border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <Badge className={rule.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Type:</span> {rule.type}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Points per unit:</span> {Number(rule.points_per_unit).toFixed(0)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Unit:</span> {rule.unit_description}
                      </p>
                      {rule.description && <p className="text-gray-600 dark:text-gray-400">{rule.description}</p>}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="lg:col-span-2">
                  <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                    No loyalty rules configured.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tiers" className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tiers.length ? (
                tiers.map((tier) => (
                  <Card key={tier.id} className="border-2 border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        <Badge className={tier.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'}>
                          Level {tier.level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Range</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {Number(tier.min_points).toFixed(0)} - {tier.max_points ? Number(tier.max_points).toFixed(0) : '∞'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Multiplier</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{Number(tier.multiplier).toFixed(2)}x</p>
                      </div>
                      {Array.isArray(tier.benefits) && tier.benefits.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Benefits</p>
                          <ul className="space-y-1">
                            {tier.benefits.map((benefit) => (
                              <li key={benefit} className="text-sm text-gray-600 dark:text-gray-400">
                                • {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="md:col-span-2 xl:col-span-4">
                  <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                    No loyalty tiers configured.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rewards.length ? (
                rewards.map((reward) => (
                  <Card key={reward.id} className="border-2 border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <Badge className={reward.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'}>
                          {reward.points_required} pts
                        </Badge>
                      </div>
                      {reward.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Type:</span> {reward.type}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Value:</span>{' '}
                        {reward.value !== null && reward.value !== undefined ? `${reward.value} ${reward.unit || ''}`.trim() : '—'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Limited:</span> {reward.is_limited ? 'Yes' : 'No'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Approval:</span> {reward.requires_approval ? 'Required' : 'Not required'}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="md:col-span-2 xl:col-span-3">
                  <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                    No loyalty rewards configured.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
