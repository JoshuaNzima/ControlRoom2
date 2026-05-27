<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\ClientLoyaltyRedemption;
use App\Services\LoyaltyPointsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoyaltyPointsController extends Controller
{
    /**
     * Dashboard - Finance overview
     */
    public function dashboard()
    {
        $this->authorize('viewReports', new \App\Models\ClientLoyaltyPoints());

        $clients = Client::active()->with('loyaltyPoints')->paginate(20);

        $stats = [
            'total_clients' => Client::count(),
            'total_points_distributed' => \App\Models\ClientLoyaltyPoints::sum('total_points'),
            'total_points_redeemed' => \App\Models\ClientLoyaltyPoints::sum('redeemed_points'),
            'pending_redemptions' => ClientLoyaltyRedemption::pending()->count(),
            'total_point_value' => \App\Models\ClientLoyaltyPoints::sum('total_points') * 0.01, // Assuming 0.01 MWK per point
        ];

        return Inertia::render('Finance/Loyalty/Dashboard', [
            'clients' => $clients,
            'stats' => $stats,
        ]);
    }

    /**
     * Client loyalty details
     */
    public function clientDetails(Client $client)
    {
        $this->authorize('viewReports', new \App\Models\ClientLoyaltyPoints());

        $summary = LoyaltyPointsService::getClientSummary($client);
        $transactions = LoyaltyPointsService::getTransactionHistory($client, 50);
        $redemptions = ClientLoyaltyRedemption::where('client_id', $client->id)
            ->with('reward', 'approvedBy')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Finance/Loyalty/ClientDetails', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'status' => $client->status,
            ],
            'summary' => $summary,
            'transactions' => $transactions,
            'redemptions' => $redemptions,
        ]);
    }

    /**
     * Pending redemptions approval
     */
    public function pendingRedemptions(Request $request)
    {
        $this->authorize('approveRedemptions', new \App\Models\ClientLoyaltyPoints());

        $query = ClientLoyaltyRedemption::where('status', 'pending')
            ->with('client', 'reward', 'approvedBy')
            ->orderBy('created_at', 'desc');

        if ($request->filled('sort')) {
            $query = $query->orderBy($request->sort['field'], $request->sort['direction']);
        }

        $redemptions = $query->paginate(20);

        return Inertia::render('Finance/Loyalty/PendingRedemptions', [
            'redemptions' => $redemptions,
        ]);
    }

    /**
     * Approve redemption
     */
    public function approveRedemption(ClientLoyaltyRedemption $redemption)
    {
        $this->authorize('approveRedemptions', new \App\Models\ClientLoyaltyPoints());

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
        $this->authorize('approveRedemptions', new \App\Models\ClientLoyaltyPoints());

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
     * Export loyalty report
     */
    public function exportReport()
    {
        $this->authorize('viewReports', new \App\Models\ClientLoyaltyPoints());

        $clients = Client::active()->with('loyaltyPoints')->get();

        $csvData = "Client Name,Email,Phone,Total Points,Available Points,Redeemed Points,Current Tier,Last Earned,Last Redeemed\n";

        foreach ($clients as $client) {
            $summary = LoyaltyPointsService::getClientSummary($client);
            $tier = $summary['current_tier']['name'] ?? 'None';
            $lastEarned = $summary['last_earned_at'] ? date('Y-m-d', strtotime($summary['last_earned_at'])) : 'N/A';
            $lastRedeemed = $summary['last_redeemed_at'] ? date('Y-m-d', strtotime($summary['last_redeemed_at'])) : 'N/A';

            $csvData .= "\"{$client->name}\",\"{$client->email}\",\"{$client->phone}\",{$summary['total_points']},{$summary['available_points']},{$summary['redeemed_points']},\"{$tier}\",\"{$lastEarned}\",\"{$lastRedeemed}\"\n";
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="loyalty_report_' . date('Y-m-d') . '.csv"');
    }
}
