<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\LoyaltyReward;
use App\Models\ClientLoyaltyRedemption;
use App\Services\LoyaltyPointsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoyaltyPointsController extends Controller
{
    private function loyaltyEnabledOrAbort(): void
    {
        if (!LoyaltyPointsService::isLoyaltyEnabled()) {
            abort(403, 'Loyalty program is currently disabled');
        }
    }

    /**
     * Dashboard - View own loyalty points
     */
    public function dashboard()
    {
        $this->loyaltyEnabledOrAbort();

        $client = auth()->user()->client;

        if (!$client) {
            abort(403, 'Client not found');
        }

        $this->authorize('viewSummary', $client);

        $summary = LoyaltyPointsService::getClientSummary($client);
        $transactions = LoyaltyPointsService::getTransactionHistory($client, 20);
        $availableRewards = LoyaltyReward::available()->ordered()->get();
        $pendingRedemptions = ClientLoyaltyRedemption::where('client_id', $client->id)
            ->with('reward', 'approvedBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Client/Loyalty/Dashboard', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
            ],
            'loyaltyEnabled' => LoyaltyPointsService::isLoyaltyEnabled(),
            'summary' => $summary,
            'transactions' => $transactions,
            'availableRewards' => $availableRewards,
            'pendingRedemptions' => $pendingRedemptions,
        ]);
    }

    /**
     * Get client's loyalty summary (API)
     */
    public function getSummary()
    {
        $this->loyaltyEnabledOrAbort();

        $client = auth()->user()->client;

        if (!$client) {
            return response()->json(['error' => 'Not authenticated as client'], 401);
        }

        $this->authorize('viewSummary', $client);

        $summary = LoyaltyPointsService::getClientSummary($client);
        $transactions = LoyaltyPointsService::getTransactionHistory($client, 10);

        return response()->json([
            'summary' => $summary,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Get available rewards
     */
    public function getRewards()
    {
        $this->loyaltyEnabledOrAbort();

        $client = auth()->user()->client;

        if (!$client) {
            return response()->json(['error' => 'Not authenticated as client'], 401);
        }

        $loyaltyPoints = LoyaltyPointsService::initializeClient($client);
        $rewards = LoyaltyReward::available()->ordered()->get();

        return response()->json([
            'available_points' => $loyaltyPoints->available_points,
            'rewards' => $rewards->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'description' => $r->description,
                'type' => $r->type,
                'points_required' => $r->points_required,
                'value' => $r->value,
                'unit' => $r->unit,
                'can_redeem' => $loyaltyPoints->available_points >= $r->points_required && $r->isAvailable(),
                'remaining_quantity' => $r->getRemainingQuantity(),
                'requires_approval' => $r->requires_approval,
            ]),
        ]);
    }

    /**
     * Request reward redemption
     */
    public function requestRedemption(Request $request)
    {
        $this->loyaltyEnabledOrAbort();

        $client = auth()->user()->client;

        if (!$client) {
            return response()->json(['error' => 'Not authenticated as client'], 401);
        }

        $this->authorize('redeem', $client);

        $validated = $request->validate([
            'reward_id' => 'required|exists:loyalty_rewards,id',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $redemption = LoyaltyPointsService::redeemReward($client, $validated['reward_id']);

            if (!$redemption) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to redeem reward. You may not have enough points or the reward may be unavailable.',
                ], 422);
            }

            // Store notes if provided
            if ($request->filled('notes')) {
                $redemption->update([
                    'metadata' => array_merge($redemption->metadata ?? [], ['client_notes' => $validated['notes']]),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $redemption->reward->requires_approval
                    ? 'Redemption request submitted and awaiting approval'
                    : 'Reward redeemed successfully!',
                'redemption' => $redemption,
                'requires_approval' => $redemption->reward->requires_approval,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * View redemption requests
     */
    public function redemptions()
    {
        $this->loyaltyEnabledOrAbort();

        $client = auth()->user()->client;

        if (!$client) {
            abort(403, 'Client not found');
        }

        $this->authorize('viewSummary', $client);

        $redemptions = ClientLoyaltyRedemption::where('client_id', $client->id)
            ->with('reward', 'approvedBy')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Client/Loyalty/Redemptions', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
            ],
            'loyaltyEnabled' => LoyaltyPointsService::isLoyaltyEnabled(),
            'redemptions' => $redemptions,
        ]);
    }

    /**
     * Cancel pending redemption
     */
    public function cancelRedemption(ClientLoyaltyRedemption $redemption)
    {
        $this->loyaltyEnabledOrAbort();

        $client = auth()->user()->client;

        if (!$client || $redemption->client_id !== $client->id) {
            abort(403, 'Unauthorized');
        }

        if ($redemption->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending redemptions can be cancelled',
            ], 422);
        }

        try {
            $cancelled = LoyaltyPointsService::cancelRedemption($redemption, auth()->id());

            if (!$cancelled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to cancel redemption (already processed or invalid state).',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Redemption cancelled and points refunded',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
