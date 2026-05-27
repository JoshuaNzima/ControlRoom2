<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\ClientLoyaltyPoints;
use App\Models\ClientLoyaltyRedemption;
use App\Models\LoyaltyRule;
use App\Models\LoyaltyTier;
use App\Models\LoyaltyReward;
use App\Services\LoyaltyPointsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoyaltyPointsController extends Controller
{
    /**
     * Dashboard / Overview page
     */
    public function dashboard()
    {
        $clients = Client::active()->with('loyaltyPoints')->paginate(20);
        $rules = LoyaltyRule::all();
        $tiers = LoyaltyTier::ordered()->get();
        $rewards = LoyaltyReward::available()->ordered()->get();

        $stats = [
            'total_clients' => Client::count(),
            'total_points_distributed' => ClientLoyaltyPoints::sum('total_points'),
            'total_points_redeemed' => ClientLoyaltyPoints::sum('redeemed_points'),
            'pending_redemptions' => ClientLoyaltyRedemption::pending()->count(),
        ];

        return Inertia::render('Admin/LoyaltyPoints/Dashboard', [
            'clients' => $clients,
            'rules' => $rules,
            'tiers' => $tiers,
            'rewards' => $rewards,
            'stats' => $stats,
        ]);
    }

    /**
     * Get client loyalty details
     */
    public function clientSummary(Client $client)
    {
        $summary = LoyaltyPointsService::getClientSummary($client);
        $transactions = LoyaltyPointsService::getTransactionHistory($client, 20);
        $pendingRedemptions = ClientLoyaltyRedemption::where('client_id', $client->id)
            ->where('status', 'pending')
            ->with('reward', 'approvedBy')
            ->get();

        return response()->json([
            'summary' => $summary,
            'transactions' => $transactions,
            'pending_redemptions' => $pendingRedemptions,
        ]);
    }

    /**
     * Manage loyalty rules
     */
    public function rules()
    {
        $rules = LoyaltyRule::all();

        return Inertia::render('Admin/LoyaltyPoints/Rules', [
            'rules' => $rules,
        ]);
    }

    /**
     * Store/Update loyalty rule
     */
    public function storeRule(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:loyalty_rules,id',
            'name' => 'required|string|max:255',
            'type' => 'required|in:payment,service,referral,contract_length',
            'points_per_unit' => 'required|numeric|min:0',
            'unit_description' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'priority' => 'nullable|integer',
        ]);

        if ($request->id) {
            $rule = LoyaltyRule::find($request->id);
            $rule->update($validated);
        } else {
            LoyaltyRule::create($validated);
        }

        return back()->with('success', 'Loyalty rule saved successfully');
    }

    /**
     * Manage loyalty tiers
     */
    public function tiers()
    {
        $tiers = LoyaltyTier::ordered()->get();

        return Inertia::render('Admin/LoyaltyPoints/Tiers', [
            'tiers' => $tiers,
        ]);
    }

    /**
     * Store/Update loyalty tier
     */
    public function storeTier(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:loyalty_tiers,id',
            'name' => 'required|string|max:255',
            'level' => 'required|integer|unique:loyalty_tiers,level,' . ($request->id ?? 0),
            'min_points' => 'required|numeric|min:0',
            'max_points' => 'nullable|numeric|gte:min_points',
            'multiplier' => 'nullable|numeric|min:0.5|max:10',
            'benefits' => 'nullable|array',
            'color' => 'nullable|string',
            'icon' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($request->id) {
            $tier = LoyaltyTier::find($request->id);
            $tier->update($validated);
        } else {
            LoyaltyTier::create($validated);
        }

        return back()->with('success', 'Loyalty tier saved successfully');
    }

    /**
     * Manage loyalty rewards
     */
    public function rewards()
    {
        $rewards = LoyaltyReward::ordered()->paginate(20);

        return Inertia::render('Admin/LoyaltyPoints/Rewards', [
            'rewards' => $rewards,
        ]);
    }

    /**
     * Store/Update reward
     */
    public function storeReward(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:loyalty_rewards,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:discount,service,credit,voucher,custom',
            'points_required' => 'required|numeric|min:0',
            'value' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'quantity_available' => 'nullable|integer|min:1',
            'is_limited' => 'boolean',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'terms' => 'nullable|array',
            'requires_approval' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        if ($request->id) {
            $reward = LoyaltyReward::find($request->id);
            $reward->update($validated);
        } else {
            LoyaltyReward::create($validated);
        }

        return back()->with('success', 'Reward saved successfully');
    }

    /**
     * Award manual points to client
     */
    public function awardPoints(Request $request, Client $client)
    {
        $validated = $request->validate([
            'points' => 'required|numeric|min:0',
            'reason' => 'required|string|max:500',
            'type' => 'in:earned,bonus',
        ]);

        try {
            $transaction = LoyaltyPointsService::awardPoints(
                $client,
                $validated['points'],
                $validated['reason'],
                $validated['type'] ?? 'bonus',
                causable: auth()->user(),
            );

            return response()->json([
                'success' => true,
                'message' => 'Points awarded successfully',
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Redeem reward for client
     */
    public function redeemReward(Request $request, Client $client)
    {
        $validated = $request->validate([
            'reward_id' => 'required|exists:loyalty_rewards,id',
        ]);

        try {
            $redemption = LoyaltyPointsService::redeemReward(
                $client,
                $validated['reward_id'],
            );

            if (!$redemption) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to redeem reward. Insufficient points or reward unavailable.',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Reward redeemed successfully',
                'redemption' => $redemption,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve redemption
     */
    public function approveRedemption(ClientLoyaltyRedemption $redemption)
    {
        try {
            LoyaltyPointsService::approveRedemption($redemption, auth()->id());

            return response()->json([
                'success' => true,
                'message' => 'Redemption approved',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject redemption
     */
    public function rejectRedemption(Request $request, ClientLoyaltyRedemption $redemption)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            LoyaltyPointsService::rejectRedemption($redemption, $validated['reason']);

            return response()->json([
                'success' => true,
                'message' => 'Redemption rejected and points refunded',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export report
     */
    public function exportReport(Request $request)
    {
        $clients = Client::active()->with('loyaltyPoints')->get();

        $csvData = "Client Name,Email,Total Points,Available Points,Redeemed Points,Current Tier\n";

        foreach ($clients as $client) {
            $summary = LoyaltyPointsService::getClientSummary($client);
            $tier = $summary['current_tier']['name'] ?? 'None';

            $csvData .= "\"{$client->name}\",\"{$client->email}\",{$summary['total_points']},{$summary['available_points']},{$summary['redeemed_points']},\"{$tier}\"\n";
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="loyalty_report_' . date('Y-m-d') . '.csv"');
    }
}
