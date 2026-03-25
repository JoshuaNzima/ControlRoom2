<?php

namespace App\Http\Controllers;

use App\Models\IncentiveProfile;
use App\Models\IncentiveRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncentiveDashboardController extends Controller
{
    // Summary for dashboards
    public function summary(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $stats = [
            'total_supervisors' => User::role('supervisor')->count(),
            'total_sergeants' => User::role('sergeant')->count(),
            'active_profiles' => IncentiveProfile::where('is_active', true)->count(),
            'pending_count' => IncentiveRecord::forPeriod($year, $month)->where('status', 'pending')->count(),
            'approved_count' => IncentiveRecord::forPeriod($year, $month)->where('status', 'approved')->count(),
            'paid_count' => IncentiveRecord::forPeriod($year, $month)->where('status', 'paid')->count(),
            'total_paid_amount' => IncentiveRecord::forPeriod($year, $month)->where('status', 'paid')->sum('final_amount'),
            'pending_amount' => IncentiveRecord::forPeriod($year, $month)->where('status', 'pending')->sum('final_amount'),
            'by_role' => [
                'supervisor' => IncentiveRecord::forPeriod($year, $month)
                    ->whereHas('user.roles', fn($q) => $q->where('name', 'supervisor'))
                    ->sum('final_amount'),
                'sergeant' => IncentiveRecord::forPeriod($year, $month)
                    ->whereHas('user.roles', fn($q) => $q->where('name', 'sergeant'))
                    ->sum('final_amount'),
            ],
        ];

        return response()->json(['stats' => $stats, 'period' => ['year' => $year, 'month' => $month]]);
    }

    // Quick calculate for current period
    public function quickCalculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        // Delegate to Admin\IncentiveController logic
        $controller = new \App\Http\Controllers\Admin\IncentiveController();
        $response = $controller->calculate(new Request($validated));

        return response()->json(['success' => true, 'message' => 'Incentives calculated']);
    }
}
