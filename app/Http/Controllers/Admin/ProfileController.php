<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get pending and recent commissions
        $pendingCommissions = Commission::where('user_id', $user->id)
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'source', 'client_id', 'amount', 'status', 'created_at']);

        $recentCommissions = Commission::where('user_id', $user->id)
            ->whereIn('status', ['claimed', 'rejected'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'source', 'client_id', 'amount', 'status', 'claimed_at', 'created_at']);

        $totalClaimed = Commission::where('user_id', $user->id)
            ->where('status', 'claimed')
            ->sum('amount');

        // Get incentives (simplified - could be from incentive table)
        $currentIncentive = null; // Could query from incentives table
        $incentiveHistory = []; // Could query from incentives table
        $ytdTotal = 0;

        // Get stats
        $stats = [
            'total_commissions' => $pendingCommissions->count() + $recentCommissions->count(),
            'total_incentives' => $ytdTotal,
            'active_clients' => Client::where('status', 'active')->count(),
        ];

        return Inertia::render('Admin/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_path ? asset('storage/' . ltrim($user->avatar_path, '/')) : null,
                'role' => $user->roles->first()?->name ?? 'admin',
                'created_at' => $user->created_at->toISOString(),
            ],
            'commissions' => [
                'pending' => $pendingCommissions,
                'recent' => $recentCommissions,
                'total_claimed' => $totalClaimed,
            ],
            'incentives' => [
                'current' => $currentIncentive,
                'history' => $incentiveHistory,
                'ytd_total' => $ytdTotal,
            ],
            'stats' => $stats,
        ]);
    }
}
