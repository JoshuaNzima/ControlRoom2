import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import IconMapper from '@/Components/IconMapper';
import ClientLayout from '@/Layouts/ClientLayout';

interface LoyaltySummary {
  total_points: number;
  available_points: number;
  redeemed_points: number;
  pending_points: number;
  current_tier: any;
  next_tier: any;
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

interface Reward {
  id: number;
  name: string;
  description: string;
  type: string;
  points_required: number;
  value: number;
  unit: string;
  quantity_available: number | null;
  quantity_redeemed: number;
  is_limited: boolean;
  requires_approval: boolean;
  is_active: boolean;
}

interface Redemption {
  id: number;
  status: string;
  points_used: number;
  value_received: number | null;
  created_at: string;
  reward: Reward;
  approved_by: any;
}

interface Props {
  client: { id: number; name: string };
  summary: LoyaltySummary;
  transactions: Transaction[];
  availableRewards: Reward[];
  pendingRedemptions: Redemption[];
}

export default function LoyaltyDashboard({
  client,
  summary,
  transactions,
  availableRewards,
  pendingRedemptions,
}: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [redemptionNotes, setRedemptionNotes] = useState('');

  const handleRedeemReward = async (rewardId: number) => {
    setRedeeming(rewardId);
    try {
      const res = await fetch(route('client.loyalty.request-redemption'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          reward_id: rewardId,
          notes: redemptionNotes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Failed to redeem reward');
        return;
      }

      const data = await res.json();
      alert(data.message);
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing redemption');
    } finally {
      setRedeeming(null);
      setRedemptionNotes('');
    }
  };

  return (
    <ClientLayout title="Loyalty Points">
      <Head title="Loyalty Points" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            <IconMapper name="Gift" size={32} className="text-amber-500" />
            Your Loyalty Points
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Earn points from payments and redeem them for exclusive rewards
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
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
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold">{summary.current_tier?.name || 'Bronze'}</span>
                {summary.current_tier?.icon && (
                  <IconMapper name={summary.current_tier.icon} size={24} className="text-amber-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {summary.next_tier && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tier Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {summary.current_tier?.name || 'Bronze'} → {summary.next_tier.name}
                </span>
                <span className="text-sm text-gray-600">
                  {summary.points_to_next_tier} points to next tier
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, summary.progress_percent)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(summary.progress_percent)}% complete
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rewards">
              Available Rewards
              {availableRewards.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {availableRewards.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">
              Transaction History
              {transactions.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {transactions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {summary.current_tier && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your {summary.current_tier.name} Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Earn {summary.current_tier.multiplier}x points on all activities
                    </p>
                    {Array.isArray(summary.current_tier.benefits) && (
                      <ul className="space-y-1">
                        {summary.current_tier.benefits.map((benefit: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-amber-500">✓</span> {benefit}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingRedemptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Redemptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRedemptions.map((redemption) => (
                      <div
                        key={redemption.id}
                        className="rounded border border-yellow-100 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950/20"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {redemption.reward?.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {redemption.points_used} points • Pending approval
                            </p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="mt-4 space-y-4">
            {availableRewards.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <p>No rewards available at this time</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {availableRewards.map((reward) => {
                  const canRedeem = summary.available_points >= reward.points_required;
                  const isLimited = reward.is_limited && reward.quantity_available !== null;
                  const remaining = reward.quantity_available ? reward.quantity_available - reward.quantity_redeemed : null;

                  return (
                    <Card key={reward.id} className={canRedeem ? 'border-green-200 dark:border-green-900' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{reward.name}</CardTitle>
                          <Badge
                            className={
                              canRedeem
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
                            }
                          >
                            {reward.points_required} pts
                          </Badge>
                        </div>
                        {reward.description && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="rounded bg-gray-50 p-3 dark:bg-gray-900">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Value</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {reward.value} {reward.unit}
                          </p>
                        </div>

                        {isLimited && remaining !== null && (
                          <div className="rounded border border-orange-100 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/20">
                            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                              Only {remaining} remaining
                            </p>
                          </div>
                        )}

                        {reward.requires_approval && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <IconMapper name="Clock" size={14} className="mr-1 inline" />
                            Requires approval
                          </div>
                        )}

                        <Button
                          className="w-full"
                          disabled={!canRedeem || redeeming === reward.id}
                          onClick={() => handleRedeemReward(reward.id)}
                        >
                          {redeeming === reward.id ? (
                            <>
                              <IconMapper name="Loader2" size={16} className="mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <IconMapper name="Gift" size={16} className="mr-2" />
                              Redeem
                            </>
                          )}
                        </Button>

                        {!canRedeem && (
                          <p className="text-center text-xs text-red-600 dark:text-red-400">
                            Need {reward.points_required - Math.floor(summary.available_points)} more points
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <p>No transactions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={transaction.type_color}>{transaction.type_label}</Badge>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {transaction.points > 0 ? '+' : ''}
                          {transaction.points.toFixed(0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.created_at_relative}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{transaction.reason}</p>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Balance: {transaction.balance_before.toFixed(0)} → {transaction.balance_after.toFixed(0)}
                      </span>
                      <span className="capitalize">{transaction.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
