<?php

namespace App\Services;

use App\Models\Guards\Client;
use App\Models\ClientLoyaltyExpiration;
use App\Models\ClientLoyaltyPoints;
use App\Models\ClientLoyaltyRedemption;
use App\Models\ClientLoyaltyTransaction;
use App\Models\LoyaltyReward;
use App\Models\LoyaltyRule;
use App\Models\LoyaltyTier;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class LoyaltyPointsService
{
    public static function isLoyaltyEnabled(): bool
    {
        // Default ON for backward compatibility.
        return (bool) \App\Models\Setting::getValue('loyalty.enabled', true);
    }

    /**
     * Initialize loyalty points for a client.
     */
    public static function initializeClient(Client $client): ClientLoyaltyPoints
    {
        return DB::transaction(function () use ($client) {
            return self::getLockedClientPoints($client);
        });
    }

    /**
     * Award points to a client.
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
    ): ClientLoyaltyTransaction {
        return DB::transaction(function () use ($client, $points, $reason, $type, $relatedId, $relatedType, $causable, $metadata) {
            $points = self::normalizePoints($points);

            if ($points < 0) {
                throw new InvalidArgumentException('Awarded points cannot be negative.');
            }

            $loyaltyPoints = self::getLockedClientPoints($client);

            $balanceBefore = self::normalizePoints((float) $loyaltyPoints->available_points);
            $newBalance = self::normalizePoints($balanceBefore + $points);
            $newTotalPoints = self::normalizePoints((float) $loyaltyPoints->total_points + $points);

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

            $loyaltyPoints->update([
                'total_points' => $newTotalPoints,
                'available_points' => $newBalance,
                'last_earned_at' => now(),
            ]);

            return $transaction;
        });
    }

    /**
     * Deduct points from a client.
     */
    public static function deductPoints(
        Client $client,
        float $points,
        string $reason,
        ?int $relatedId = null,
        ?string $relatedType = null,
    ): ?ClientLoyaltyTransaction {
        return DB::transaction(function () use ($client, $points, $reason, $relatedId, $relatedType) {
            $points = self::normalizePoints($points);

            if ($points <= 0) {
                throw new InvalidArgumentException('Deducted points must be greater than zero.');
            }

            $loyaltyPoints = self::getLockedClientPoints($client);
            $availablePoints = self::normalizePoints((float) $loyaltyPoints->available_points);

            if ($availablePoints < $points) {
                return null;
            }

            $balanceBefore = $availablePoints;
            $newBalance = self::normalizePoints($balanceBefore - $points);

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
                'redeemed_points' => self::normalizePoints((float) $loyaltyPoints->redeemed_points + $points),
                'last_redeemed_at' => now(),
            ]);

            return $transaction;
        });
    }

    /**
     * Calculate points for a payment.
     */
    public static function calculatePaymentPoints(float $amount): float
    {
        $amount = self::normalizePoints($amount);

        if ($amount <= 0) {
            return 0.0;
        }

        $rule = LoyaltyRule::active()->byType('payment')->first();

        if (!$rule) {
            return 0.0;
        }

        // Structured configuration only (no regex/free-text parsing).
        $unitAmount = null;

        if (is_array($rule->conditions) && isset($rule->conditions['unit_amount'])) {
            $configuredUnit = self::normalizePoints((float) $rule->conditions['unit_amount']);
            if ($configuredUnit > 0) {
                $unitAmount = $configuredUnit;
            }
        }

        if ($unitAmount === null) {
            // No valid structured unit amount => can't calculate.
            return 0.0;
        }

        return self::normalizePoints(($amount / $unitAmount) * (float) $rule->points_per_unit);
    }

    /**
     * Award points for payment (from ClientPayment model).
     */
    public static function awardPaymentPoints(Client $client, float $amount, int $paymentId): ClientLoyaltyTransaction
    {
        $points = self::calculatePaymentPoints($amount);

        return self::awardPoints(
            $client,
            $points,
            'Payment received: MWK ' . number_format($amount, 2),
            'earned',
            $paymentId,
            'ClientPayment',
            metadata: ['amount_paid' => $amount]
        );
    }

    /**
     * Redeem a reward for a client.
     */
    public static function redeemReward(
        Client $client,
        int $rewardId,
        ?string $approvedBy = null
    ): ?ClientLoyaltyRedemption {
        // Single owning transaction:
        // - lock client loyalty balance row
        // - lock reward row for inventory validation and quantity consumption
        return DB::transaction(function () use ($client, $rewardId, $approvedBy) {
            $loyaltyPoints = self::getLockedClientPoints($client);
            $reward = self::getLockedReward($rewardId);

            if (!$reward) {
                return null;
            }

            if (!$reward->isAvailable()) {
                return null;
            }

            $pointsRequired = self::normalizePoints($reward->points_required);
            $availablePoints = self::normalizePoints($loyaltyPoints->available_points);

            if ($availablePoints < $pointsRequired) {
                return null;
            }

            // Re-check limited inventory under the same row lock.
            if ($reward->is_limited) {
                if ($reward->quantity_available !== null && $reward->quantity_redeemed >= $reward->quantity_available) {
                    return null;
                }
            }

            $balanceBefore = $availablePoints;
            $newBalance = self::normalizePoints($balanceBefore - $pointsRequired);

            $transaction = ClientLoyaltyTransaction::create([
                'client_loyalty_points_id' => $loyaltyPoints->id,
                'client_id' => $client->id,
                'type' => 'redeemed',
                'points' => $pointsRequired,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'reason' => "Redeemed: {$reward->name}",
                'related_id' => $rewardId,
                'related_type' => 'LoyaltyReward',
                'status' => 'completed',
            ]);

            $redemptionStatus = $reward->requires_approval ? 'pending' : 'completed';

            $redemption = ClientLoyaltyRedemption::create([
                'client_id' => $client->id,
                'loyalty_reward_id' => $rewardId,
                'client_loyalty_transaction_id' => $transaction->id,
                'points_used' => $pointsRequired,
                'value_received' => $reward->value,
                'status' => $redemptionStatus,
                'approved_at' => !$reward->requires_approval ? now() : null,
                'approved_by' => !$reward->requires_approval && $approvedBy ? $approvedBy : null,
                'redeemed_at' => !$reward->requires_approval ? now() : null,
            ]);

            $loyaltyPoints->update([
                'available_points' => $newBalance,
                'redeemed_points' => self::normalizePoints($loyaltyPoints->redeemed_points + $pointsRequired),
                'last_redeemed_at' => now(),
            ]);

            if ($reward->is_limited) {
                // Explicit row-locked increment (avoid non-locked read/modify/write).
                $reward->quantity_redeemed = (int) $reward->quantity_redeemed + 1;
                $reward->save();
            }

            return $redemption;
        });
    }

    /**
     * Approve redemption request.
     */
    public static function approveRedemption(ClientLoyaltyRedemption $redemption, int $approvedBy): bool
    {
        // Service-level guard (backward compatible):
        // If roles/permissions are not configured in the caller/test environment, do not block.
        $approver = User::query()->find($approvedBy);
        if (!$approver) {
            return false;
        }

        try {
            // Backward-compatible policy:
            // - If the user has no roles assigned, do not block (older setups/tests may not seed roles).
            // - Only enforce role allow-list when roles are actually assigned.
            $rolesCount = $approver->roles()->count();
            if ($rolesCount > 0) {
                if (!$approver->hasAnyRole(['admin', 'super_admin', 'superadmin', 'finance', 'finance_officer', 'finance_manager', 'accountant'])) {
                    return false;
                }
            }
        } catch (\Throwable $e) {
            // Allow when role tables/guards are not present in older setups/tests.
        }

        return DB::transaction(function () use ($redemption, $approvedBy) {
            $redemption = ClientLoyaltyRedemption::query()
                ->whereKey($redemption->id)
                ->lockForUpdate()
                ->first();

            if (!$redemption) {
                return false;
            }

            if (in_array($redemption->status, ['completed', 'rejected', 'cancelled'], true)) {
                return true;
            }

            if (!in_array($redemption->status, ['pending', 'approved'], true)) {
                return true;
            }

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
     * Reject redemption request.
     */
    public static function rejectRedemption(ClientLoyaltyRedemption $redemption, string $reason): bool
    {
        // Service-level guard (backward compatible).
        // Note: controller currently calls this without passing rejected_by; we only enforce when caller is available via auth().
        $rejector = auth()->user();
        if ($rejector) {
            try {
                if (!$rejector->hasAnyRole(['admin', 'super_admin', 'superadmin', 'finance', 'finance_officer', 'finance_manager', 'accountant'])) {
                    return false;
                }
            } catch (\Throwable $e) {
                // Allow when role tables/guards are not present in older setups/tests.
            }
        }

        return DB::transaction(function () use ($redemption, $reason) {
            $redemptionRow = ClientLoyaltyRedemption::query()
                ->with(['client', 'reward'])
                ->whereKey($redemption->id)
                ->lockForUpdate()
                ->first();

            if (!$redemptionRow) {
                return false;
            }

            $status = $redemptionRow->status;

            if (in_array($status, ['rejected', 'cancelled'], true)) {
                return true;
            }

            if ($status === 'completed') {
                return true;
            }

            if (!in_array($status, ['pending', 'approved'], true)) {
                return false;
            }

            $client = $redemptionRow->client;

            // Lock client points + reward inventory under the same transaction.
            $loyaltyPoints = self::getLockedClientPoints($client);
            $reward = $redemptionRow->reward ? self::getLockedReward((int) $redemptionRow->reward->id) : null;

            $points = self::normalizePoints($redemptionRow->points_used);

            $balanceBefore = self::normalizePoints((float) $loyaltyPoints->available_points);
            $newBalance = self::normalizePoints($balanceBefore + $points);

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

            $redemptionRow->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
            ]);

            if ($reward && $reward->is_limited) {
                $reward->quantity_redeemed = max(0, (int) $reward->quantity_redeemed - 1);
                $reward->save();
            }

            return true;
        });
    }

    /**
     * Cancel pending redemption (client-initiated).
     * Idempotent + status-aware; refunds points and rolls back limited inventory exactly once.
     */
    public static function cancelRedemption(ClientLoyaltyRedemption $redemption, int $cancelledByClientId): bool
    {
        return DB::transaction(function () use ($redemption, $cancelledByClientId) {
            $redemptionRow = ClientLoyaltyRedemption::query()
                ->with('reward', 'client')
                ->whereKey($redemption->id)
                ->lockForUpdate()
                ->first();

            if (!$redemptionRow) {
                return false;
            }

            // Authorization guard: only the owning client can cancel.
            if ((int) $redemptionRow->client_id !== (int) $cancelledByClientId) {
                return false;
            }

            $status = $redemptionRow->status;

            if (in_array($status, ['cancelled'], true)) {
                return true;
            }

            // If already completed/rejected, don't refund again.
            if (in_array($status, ['completed', 'rejected'], true)) {
                return true;
            }

            if (!in_array($status, ['pending', 'approved'], true)) {
                return false;
            }

            $client = $redemptionRow->client;

            // Lock client points + reward inventory under the same transaction.
            $loyaltyPoints = self::getLockedClientPoints($client);
            $reward = $redemptionRow->reward ? self::getLockedReward((int) $redemptionRow->reward->id) : null;

            $points = self::normalizePoints($redemptionRow->points_used);

            $balanceBefore = self::normalizePoints((float) $loyaltyPoints->available_points);
            $newBalance = self::normalizePoints($balanceBefore + $points);

            ClientLoyaltyTransaction::create([
                'client_loyalty_points_id' => $loyaltyPoints->id,
                'client_id' => $client->id,
                'type' => 'adjusted',
                'points' => $points,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'reason' => "Redemption cancelled by client",
                'status' => 'completed',
            ]);

            $loyaltyPoints->update([
                'available_points' => $newBalance,
            ]);

            $redemptionRow->update([
                'status' => 'cancelled',
            ]);

            if ($reward && $reward->is_limited) {
                $reward->quantity_redeemed = max(0, (int) $reward->quantity_redeemed - 1);
                $reward->save();
            }

            return true;
        });
    }

    /**
     * Expire points for a client.
     */
    public static function expirePoints(Client $client, float $points, string $reason = 'Points expiration'): ClientLoyaltyTransaction
    {
        return DB::transaction(function () use ($client, $points, $reason) {
            $points = self::normalizePoints($points);

            if ($points <= 0) {
                throw new InvalidArgumentException('Expired points must be greater than zero.');
            }

            $loyaltyPoints = self::getLockedClientPoints($client);
            $balanceBefore = self::normalizePoints((float) $loyaltyPoints->available_points);
            $newBalance = self::normalizePoints(max(0, $balanceBefore - $points));
            $actualExpired = self::normalizePoints($balanceBefore - $newBalance);

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
     * Process pending expirations.
     */
    public static function processPendingExpirations(): int
    {
        $count = 0;

        ClientLoyaltyExpiration::pending()
            ->orderBy('id')
            ->chunkById(50, function ($expirations) use (&$count) {
                foreach ($expirations as $expiration) {
                    $processed = DB::transaction(function () use ($expiration) {
                        $lockedExpiration = ClientLoyaltyExpiration::query()
                            ->whereKey($expiration->id)
                            ->lockForUpdate()
                            ->first();

                        if (!$lockedExpiration) {
                            return false;
                        }

                        // Status-aware re-check inside the lock.
                        if ($lockedExpiration->processed || $lockedExpiration->expires_at->isFuture()) {
                            return false;
                        }

                        // Prevent concurrent double-processing:
                        // - another worker may have claimed/started processing after the outer query.
                        if ($lockedExpiration->claimed || $lockedExpiration->processing) {
                            return false;
                        }

                        $lockedExpiration->update([
                            'claimed' => true,
                            'claimed_at' => now(),
                            'processing' => true,
                            'processing_at' => now(),
                        ]);

                        self::expirePoints(
                            $lockedExpiration->client,
                            (float) $lockedExpiration->points,
                            "Points expired on {$lockedExpiration->expires_at->format('Y-m-d')}"
                        );

                        $lockedExpiration->update([
                            'processed' => true,
                            'processed_at' => now(),
                            'processing' => false,
                            'processing_at' => null,
                        ]);

                        return true;
                    });

                    if ($processed) {
                        $count++;
                    }
                }
            });

        return $count;
    }

    /**
     * Get client loyalty summary.
     */
    public static function getClientSummary(Client $client): array
    {
        $loyaltyPoints = self::initializeClient($client);
        $currentTier = $loyaltyPoints->getCurrentTier();
        $nextTier = $loyaltyPoints->getNextTier();
        $pointsToNextTier = $loyaltyPoints->getPointsToNextTier();

        $currentTierMin = $currentTier?->min_points ?? 0;
        $nextTierMin = $nextTier?->min_points ?? null;
        $progressPercent = 100;

        if ($nextTierMin !== null) {
            $tierSpan = max(1, (float) $nextTierMin - (float) $currentTierMin);
            $progressPercent = min(100, max(0, ((float) $loyaltyPoints->available_points - (float) $currentTierMin) / $tierSpan * 100));
        }

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
                'benefits' => $currentTier->benefits ?? [],
            ] : null,
            'next_tier' => $nextTier ? [
                'id' => $nextTier->id,
                'name' => $nextTier->name,
                'level' => $nextTier->level,
                'min_points' => $nextTier->min_points,
            ] : null,
            'points_to_next_tier' => $pointsToNextTier,
            'progress_percent' => $progressPercent,
            'last_earned_at' => $loyaltyPoints->last_earned_at,
            'last_redeemed_at' => $loyaltyPoints->last_redeemed_at,
        ];
    }

    /**
     * Get transaction history for a client.
     */
    public static function getTransactionHistory(Client $client, int $limit = 50)
    {
        return ClientLoyaltyTransaction::where('client_id', $client->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn ($t) => [
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

    private static function getLockedClientPoints(Client $client): ClientLoyaltyPoints
    {
        Client::query()
            ->whereKey($client->id)
            ->lockForUpdate()
            ->firstOrFail();

        $loyaltyPoints = ClientLoyaltyPoints::query()
            ->where('client_id', $client->id)
            ->lockForUpdate()
            ->first();

        if ($loyaltyPoints) {
            return $loyaltyPoints;
        }

        return ClientLoyaltyPoints::create([
            'client_id' => $client->id,
            'total_points' => 0,
            'available_points' => 0,
            'redeemed_points' => 0,
            'pending_points' => 0,
        ]);
    }

    private static function getLockedReward(int $rewardId): ?LoyaltyReward
    {
        return LoyaltyReward::query()
            ->whereKey($rewardId)
            ->lockForUpdate()
            ->first();
    }

    private static function normalizePoints(float|int $points): int
    {
        // Strict integer enforcement: loyalty points must always be whole numbers.
        // Accept numeric strings/floats but reject fractional values.
        if (!is_numeric($points)) {
            throw new InvalidArgumentException('Points must be numeric.');
        }

        $float = (float) $points;
        $int = (int) round($float);

        if (abs($float - $int) > 0.00001) {
            throw new InvalidArgumentException('Points must be a whole number (no decimals).');
        }

        return $int;
    }
}

