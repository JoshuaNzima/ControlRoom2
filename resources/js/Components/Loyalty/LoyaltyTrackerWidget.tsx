import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface LoyaltyTier {
  id: number;
  name: string;
  level: number;
  min_points: number;
  color: string;
  icon?: string;
  multiplier: number;
}

interface LoyaltySummary {
  total_points: number;
  available_points: number;
  redeemed_points: number;
  pending_points: number;
  current_tier: LoyaltyTier | null;
  next_tier: LoyaltyTier | null;
  points_to_next_tier: number | null;
  progress_percent: number;
  last_earned_at: string | null;
  last_redeemed_at: string | null;
}

interface LoyaltyTrackerWidgetProps {
  clientId: number;
  compact?: boolean;
  onViewDetails?: () => void;
}

export default function LoyaltyTrackerWidget({
  clientId,
  compact = false,
  onViewDetails,
}: LoyaltyTrackerWidgetProps) {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchSummary = async () => {
      try {
        const isClientPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/client');
        const summaryUrl = isClientPortal
          ? route('client.loyalty.api.summary')
          : route('admin.loyalty.client-summary', clientId);

        const res = await fetch(summaryUrl, {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        const data = await res.json();
        setSummary(data.summary);
      } catch (error) {
        console.error('Failed to load loyalty summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [clientId]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-32">
          <IconMapper name="Loader2" size={32} className="animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">Unable to load loyalty information</p>
      </Card>
    );
  }

  if (compact) {
    // Compact view for sidebars
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <IconMapper name="Gift" size={16} className="text-amber-500" />
            Loyalty Points
          </h3>
          {summary.current_tier && (
            <Badge className={`${summary.current_tier.color} text-white text-xs`}>
              {summary.current_tier.name}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {Math.floor(summary.available_points)}
            </p>
            <p className="text-xs text-gray-500">Available Points</p>
          </div>

          {summary.next_tier && (
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-xs text-gray-600">Progress to {summary.next_tier.name}</p>
                <p className="text-xs font-semibold text-gray-600">
                  {summary.points_to_next_tier} points
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${summary.progress_percent}%` }}
                />
              </div>
            </div>
          )}

          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Full view
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IconMapper name="Gift" size={20} className="text-amber-500" />
            Loyalty Program
          </CardTitle>
          {summary.current_tier && (
            <Badge className={`${summary.current_tier.color} text-white`}>
              {summary.current_tier.icon && <IconMapper name={summary.current_tier.icon} size={14} className="mr-1" />}
              {summary.current_tier.name} Tier
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Points Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {Math.floor(summary.available_points)}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.floor(summary.total_points)}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">Redeemed</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.floor(summary.redeemed_points)}
            </p>
          </div>
        </div>

        {/* Tier Progress */}
        {summary.next_tier && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Tier Progress</p>
              <p className="text-xs text-gray-500">
                {summary.points_to_next_tier} points to {summary.next_tier.name}
              </p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summary.progress_percent)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{summary.current_tier?.name ?? 'Base'}</span>
              <span>{summary.next_tier.name}</span>
            </div>
          </div>
        )}

        {/* Last Activity */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {summary.last_earned_at && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500">Last Earned</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {new Date(summary.last_earned_at).toLocaleDateString()}
              </p>
            </div>
          )}
          {summary.last_redeemed_at && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500">Last Redeemed</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {new Date(summary.last_redeemed_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Tier Benefits */}
        {summary.current_tier && (
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-100 dark:border-amber-900">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">
              {summary.current_tier.name} Benefits
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-400">
              Earn {summary.current_tier.multiplier}x points on all activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
