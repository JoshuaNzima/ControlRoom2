import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

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
  sort_order?: number | null;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedRewards {
  data: LoyaltyReward[];
  links: PaginationLink[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
}

interface Props {
  rewards: PaginatedRewards;
}

function RewardBadge({
  active,
  tone,
  label,
}: {
  active: boolean;
  tone: 'green' | 'amber' | 'blue' | 'gray';
  label: string;
}) {
  const styles: Record<typeof tone, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
  };

  return <Badge className={active ? styles[tone] : styles.gray}>{label}</Badge>;
}

export default function Rewards({ rewards }: Props) {
  const hasRewards = rewards.data.length > 0;
  const totalRewards = rewards.meta?.total ?? rewards.data.length;

  return (
    <AuthenticatedLayout header="Loyalty Rewards">
      <Head title="Loyalty Rewards" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty Rewards</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review the available redemption catalog and manage reward eligibility.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={route('admin.loyalty.dashboard')}>
                <IconMapper name="ArrowLeft" size={16} className="mr-2" />
                Back
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={route('admin.loyalty.rewards')}>
                <IconMapper name="RefreshCw" size={16} className="mr-2" />
                Refresh
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Rewards</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{totalRewards}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Rewards</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {rewards.data.filter((reward) => reward.is_active).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Limited Offers</p>
              <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                {rewards.data.filter((reward) => reward.is_limited).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Reward Catalog</CardTitle>
              <Badge variant="outline">{totalRewards} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {hasRewards ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rewards.data.map((reward) => {
                  const remainingQuantity =
                    reward.quantity_available !== null && reward.quantity_available !== undefined
                      ? Math.max(0, reward.quantity_available - (reward.quantity_redeemed ?? 0))
                      : null;

                  return (
                    <div
                      key={reward.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {reward.name}
                          </h2>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {reward.type.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <RewardBadge
                          active={reward.is_active}
                          tone="green"
                          label={reward.is_active ? 'Active' : 'Inactive'}
                        />
                      </div>

                      {reward.description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
                          <p className="text-xs text-amber-700 dark:text-amber-300">Points Required</p>
                          <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                            {Number(reward.points_required).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
                          <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                            {reward.value !== null && reward.value !== undefined
                              ? `${Number(reward.value).toLocaleString()} ${reward.unit || ''}`.trim()
                              : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <RewardBadge
                          active={reward.is_limited}
                          tone="amber"
                          label={reward.is_limited ? 'Limited' : 'Unlimited'}
                        />
                        <RewardBadge
                          active={reward.requires_approval}
                          tone="blue"
                          label={reward.requires_approval ? 'Approval required' : 'Auto redeem'}
                        />
                        <RewardBadge
                          active={!!reward.valid_until}
                          tone="gray"
                          label={reward.valid_until ? 'Timed offer' : 'No expiry'}
                        />
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">Remaining:</span>{' '}
                          {remainingQuantity !== null ? remainingQuantity.toLocaleString() : 'Unlimited'}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">Redeemed:</span>{' '}
                          {Number(reward.quantity_redeemed ?? 0).toLocaleString()}
                        </p>
                        {reward.valid_until && (
                          <p>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Valid until:</span>{' '}
                            {new Date(reward.valid_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No loyalty rewards configured.
              </div>
            )}

            {rewards.links?.length > 3 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {rewards.links.map((link, index) => {
                  const label = link.label.replace(/&laquo;|&raquo;/g, '').trim();

                  if (!link.url) {
                    return (
                      <Button key={index} variant="outline" size="sm" disabled>
                        {label || '...'}
                      </Button>
                    );
                  }

                  return (
                    <Button key={index} asChild variant={link.active ? 'default' : 'outline'} size="sm">
                      <Link href={link.url}>{label || '...'}</Link>
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
