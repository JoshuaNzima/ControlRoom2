<?php

namespace App\Http\Controllers\Supervisor;

use App\Http\Controllers\Controller;
use App\Models\Incentive;
use App\Models\ClientSiteSupervisor;
use App\Models\Guard;
use App\Models\Down;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSergeant = $user->hasRole('sergeant');

        // Get current incentive
        $currentIncentive = Incentive::where('user_id', $user->id)
            ->where('month', now()->format('Y-m'))
            ->first();

        // Get incentive history
        $incentiveHistory = Incentive::where('user_id', $user->id)
            ->orderByDesc('month')
            ->limit(12)
            ->get(['id', 'month', 'base_amount', 'penalties', 'final_amount', 'status']);

        $ytdTotal = Incentive::where('user_id', $user->id)
            ->whereYear('month', now()->year)
            ->sum('final_amount');

        // Get assignments
        $assignments = ClientSiteSupervisor::where('supervisor_id', $user->id)
            ->with('site.client')
            ->where('is_active', true)
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'site_name' => $assignment->site?->name ?? 'Unknown',
                    'client_name' => $assignment->site?->client?->name ?? 'Unknown',
                    'shift' => $assignment->shift ?? 'Day',
                    'status' => 'active',
                ];
            });

        // Get guard stats
        $guardIds = \DB::table('guard_assignments')
            ->where('supervisor_id', $user->id)
            ->pluck('guard_id');

        $stats = [
            'total_guards' => $guardIds->count(),
            'active_guards' => Guard::whereIn('id', $guardIds)->where('status', 'active')->count(),
            'on_duty' => Guard::whereIn('id', $guardIds)->whereHas('shifts', function ($q) {
                $q->whereDate('shift_date', today());
            })->count(),
            'issues_today' => Down::whereDate('created_at', today())
                ->whereIn('site_id', $assignments->pluck('id'))
                ->count(),
        ];

        return Inertia::render('Supervisor/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_path ? asset('storage/' . ltrim($user->avatar_path, '/')) : null,
                'role' => $isSergeant ? 'sergeant' : 'supervisor',
                'created_at' => $user->created_at->toISOString(),
            ],
            'incentives' => [
                'current' => $currentIncentive ? [
                    'id' => $currentIncentive->id,
                    'month' => $currentIncentive->month,
                    'base_amount' => $currentIncentive->base_amount,
                    'penalties' => $currentIncentive->penalties,
                    'final_amount' => $currentIncentive->final_amount,
                    'status' => $currentIncentive->status,
                    'unresolved_downs' => $currentIncentive->unresolved_downs ?? 0,
                ] : null,
                'history' => $incentiveHistory,
                'ytd_total' => $ytdTotal,
            ],
            'assignments' => $assignments,
            'stats' => $stats,
            'isSergeant' => $isSergeant,
        ]);
    }
}
