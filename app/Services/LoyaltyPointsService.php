<?php

namespace App\Services;

use App\Models\Guards\Client;
use App\Models\ClientLoyaltyPoints;
use App\Models\ClientLoyaltyTransaction;
use App\Models\ClientLoyaltyRedemption;
use App\Models\ClientLoyaltyExpiration;
use App\Models\LoyaltyReward;
use App\Models\LoyaltyRule;
use App\Models\LoyaltyTier;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class LoyaltyPointsService
{
    /**
     * Initialize loyalty points for a client
     */
    public static function initializeClient(Client $client): ClientLoyaltyPoints
    {
        return ClientLoyaltyPoints::firstOrCreate(
            ['client_id' => $client->id],
            [
                'total_points' => 0,
                'available_points' => 0,
                'redeemed_points' => 0,
                'pending_points' => 0,
            ]
        );
    }

    /**
     * Award points to a client
     */
    public static function awardPoints(
        Client $client,
        float $points,
        string $reason,
        string $type = 'earned',
        ?int $relatedId = null,
        ?string $relatedType = null,
        ?Model $causable = null,
        array $metadata = [],
    ): ClientLoyaltyTransaction
    {
        return DB::transaction(function () use ($client, $points, $reason, $type, $relatedId, $relatedType, $causable, $metadata) {
            $loyaltyPoints = self::initializeClient($client);

            // Store balances for transaction record
            $balanceBefore = $loyaltyPoints->available_points;
            $newBalance = $balanceBefore + $points;

            // Create transaction
            $transaction = ClientLoyaltyTransaction::create([
                'client_loyalty_points_id' => $loyaltyPoints->id,
                'client_id' => $client->id,
                'type' => $type,
                'points' => $points,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'reason' => $reason,
                'related_id' => $relatedId,
                'related_type' => $relatedType,
                'causable_id' => $causable?->id,
                'causable_type' => $causable ? $causable::class : null,
                'metadata' => $metadata,
                'status' => 'completed',
            ]);

            // Update loyalty points
            $loyaltyPoints->update([
                'total_points' => $loyaltyPoints->total_points + $points,
                'available_points' => $newBalance,
                'last_earned_at' => now(),
            ]);

            return $transaction;
        });
    }

    /**
     * Deduct points from a client
     */
    public static function deductPoints(
        Client $client,
        float $points,
        string $reason,
        ?int $relatedId = null,
        ?string $relatedType = null,
    ): ?ClientLoyaltyTransaction
    {
        return DB::transaction(function () use ($client, $points, $reason, $relatedId, $relatedType) {
            $loyaltyPoints = self::initializeClient($client);

            // Check if client has enough points
            if ($loyaltyPoints->available_points < $points) {
                return null; // Insufficient points
            }

            $balanceBefore = $loyaltyPoints->available_points;
            $newBalance = $balanceBefore - $points;

            $transaction = ClientLoyaltyTransaction::create([
                'client_loyalty_points_id' => $loyaltyPoints->id,
                'client_id' => $client->id,
                'type' => 'redeemed',
                'points' => $points,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'reason' => $reason,
                'related_id' => $relatedId,
                'related_type' => $relatedType,
                'status' => 'completed',
            ]);

            $loyaltyPoints->update([
                'available_points' => $newBalance,
                'redeemed_points' => $loyaltyPoints->redeemed_points + $points,
                'last_redeemed_at' => now(),
            ]);

            return $transaction;
        });
    }

    /**
     * Calculate points for a payment
     */
    public static function calculatePaymentPoints(float $amount): float
    {
        $rule = LoyaltyRule::active()->byType('payment')->first();
        
        if (!$rule) {
            return 0;
        }

        // Extract unit value from description like "per MWK 1000"
        preg_match('/(\d+)/', $rule->unit_description, $matches);
        $unitAmount = isset($matches[1]) ? (int)$matches[1] : 1000;

        return ($amount / $unitAmount) * $rule->points_per_unit;
    }

    /**
     * Award points for payment (from ClientPayment model)
     */
    public static function awardPaymentPoints(Client $client, float $amount, int $paymentId): ClientLoyaltyTransaction
    {
        $points = self::calculatePaymentPoints($amount);

        return self::awardPoints(
            $client,
            $points,
            "Payment received: MWK " . number_format($amount, 2),
            'earned',
            $paymentId,
            'ClientPayment',
            metadata: ['amount_paid' => $amount]
        );
    }

    /**
     * Redeem a reward for a client
     */
    public static function redeemReward(
        Client $client,
        int $rewardId,
        ?string $approvedBy = null
    ): ?ClientLoyaltyRedemption
    {
        return DB::transaction(function () use ($client, $rewardId, $approvedBy) {
            $reward = LoyaltyReward::find($rewardId);
            if (!$reward || !$reward->isAvailable()) {
                return null; // Reward not available
            }

            $loyaltyPoints = self::initializeClient($client);
            if ($loyaltyPoints->available_points < $reward->points_required) {
                return null; // Insufficient points
            }

            // Deduct points
            $transaction = self::deductPoints(
                $client,
                $reward->points_required,
                "Redeemed: {$reward->name}",
                $rewardId,
                'LoyaltyReward'
            );

            if (!$transaction) {
                return null;
            }

            // Create redemption record
            $redemption = ClientLoyaltyRedemption::create([
                'client_id' => $client->id,
                'loyalty_reward_id' => $rewardId,
                'client_loyalty_transaction_id' => $transaction->id,
                'points_used' => $reward->points_required,
                'value_received' => $reward->value,
                'status' => $reward->requires_approval ? 'pending' : 'completed',
                'redeemed_at' => $reward->requires_approval ? null : now(),
            ]);

            // Update reward quantity
            if ($reward->is_limited) {
                $reward->increment('quantity_redeemed');
            }

            return $redemption;
        });
    }

    /**
     * Approve redemption request
     */
    public static function approveRedemption(ClientLoyaltyRedemption $redemption, int $approvedBy): bool
    {
        return DB::transaction(function () use ($redemption, $approvedBy) {
            $redemption->update([
                'status' => 'completed',
                'approved_at' => now(),
                'approved_by' => $approvedBy,
                'redeemed_at' => now(),
            ]);

            return true;
        });
    }

    /**
     * Reject redemption request
     */
    public static function rejectRedemption(ClientLoyaltyRedemption $redemption, string $reason): bool
    {
        return DB::transaction(function () use ($redemption, $reason) {
            // Refund points
            $client = $redemption->client;
            $points = $redemption->points_used;

            $loyaltyPoints = self::initializeClient($client);
            $balanceBefore = $loyaltyPoints->available_points;
            $newBalance = $balanceBefore + $points;

            ClientLoyaltyTransaction::create([
                'client_loyalty_points_id' => $loyaltyPoints->id,
                'client_id' => $client->id,
                'type' => 'adjusted',
                'points' => $points,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'reason' => "Redemption rejected: {$reason}",
                'status' => 'completed',
            ]);

            $loyaltyPoints->update([
                'available_points' => $newBalance,
            ]);

            // Update redemption status
            $redemption->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
            ]);

            // Refund reward quantity if limited
            if ($redemption->reward && $redemption->reward->is_limited) {
                $redemption->reward->decrement('quantity_redeemed');
            }

            return true;
        });
    }

    /**
     * Expire points for a client
     */
    public static function expirePoints(Client $client, float $points, string $reason = 'Points expiration'): ClientLoyaltyTransaction
    {
        return DB::transaction(function () use ($client, $points, $reason) {
            $loyaltyPoints = self::initializeClient($client);

            $balanceBefore = $loyaltyPoints->available_points;
            $newBalance = max(0, $balanceBefore - $points);
            $actualExpired = $balanceBefore - $newBalance;

            $transaction = ClientLoyaltyTransaction::create([
                'client_loyalty_points_id' => $loyaltyPoints->id,
                'client_id' => $client->id,
                'type' => 'expired',
                'points' => $actualExpired,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'reason' => $reason,
                'status' => 'completed',
            ]);

            $loyaltyPoints->update([
                'available_points' => $newBalance,
            ]);

            return $transaction;
        });
    }

    /**
     * Process pending expirations
     */
    public static function processPendingExpirations(): int
    {
        $count = 0;
        ClientLoyaltyExpiration::pending()->chunk(50, function ($expirations) use (&$count) {
            foreach ($expirations as $expiration) {
                self::expirePoints(
                    $expiration->client,
                    $expiration->points,
                    "Points expired on {$expiration->expires_at->format('Y-m-d')}"
                );

                $expiration->update([
                    'processed' => true,
                    'processed_at' => now(),
                ]);

                $count++;
            }
        });

        return $count;
    }

    /**
     * Get client loyalty summary
     */
    public static function getClientSummary(Client $client): array
    {
        $loyaltyPoints = self::initializeClient($client);
        $currentTier = $loyaltyPoints->getCurrentTier();
        $nextTier = $loyaltyPoints->getNextTier();
        $pointsToNextTier = $loyaltyPoints->getPointsToNextTier();

        return [
            'total_points' => $loyaltyPoints->total_points,
            'available_points' => $loyaltyPoints->available_points,
            'redeemed_points' => $loyaltyPoints->redeemed_points,
            'pending_points' => $loyaltyPoints->pending_points,
            'current_tier' => $currentTier ? [
                'id' => $currentTier->id,
                'name' => $currentTier->name,
                'level' => $currentTier->level,
                'multiplier' => $currentTier->multiplier,
                'color' => $currentTier->color,
                'icon' => $currentTier->icon,
            ] : null,
            'next_tier' => $nextTier ? [
                'id' => $nextTier->id,
                'name' => $nextTier->name,
                'level' => $nextTier->level,
                'min_points' => $nextTier->min_points,
            ] : null,
            'points_to_next_tier' => $pointsToNextTier,
            'progress_percent' => $nextTier ? min(100, (($loyaltyPoints->available_points - ($currentTier->min_points ?? 0)) / max(1, ($nextTier->min_points ?? 1) - ($currentTier->min_points ?? 0))) * 100) : 100,
            'last_earned_at' => $loyaltyPoints->last_earned_at,
            'last_redeemed_at' => $loyaltyPoints->last_redeemed_at,
        ];
    }

    /**
     * Get transaction history for client
     */
    public static function getTransactionHistory(Client $client, int $limit = 50)
    {
        return ClientLoyaltyTransaction::where('client_id', $client->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'type_label' => $t->getTypeLabel(),
                'type_color' => $t->getTypeColor(),
                'points' => $t->points,
                'balance_before' => $t->balance_before,
                'balance_after' => $t->balance_after,
                'reason' => $t->reason,
                'status' => $t->status,
                'created_at' => $t->created_at->format('Y-m-d H:i:s'),
                'created_at_relative' => $t->created_at->diffForHumans(),
            ]);
    }
}
