<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IncentiveProfile;
use App\Models\IncentiveRecord;
use App\Models\IncentiveDownPenalty;
use App\Models\Down;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class IncentiveController extends Controller
{
    // Admin: List all incentive records
    public function index(Request $request): Response
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $query = IncentiveRecord::with(['user', 'approver', 'payer', 'downPenalties.down'])
            ->where('year', $year)
            ->where('month', $month)
            ->orderBy('final_amount', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $records = $query->paginate(20)->withQueryString();

        // Stats for the period
        $stats = [
            'total_base' => IncentiveRecord::where('year', $year)->where('month', $month)->sum('base_amount'),
            'total_penalties' => IncentiveRecord::where('year', $year)->where('month', $month)->sum('total_penalties'),
            'total_final' => IncentiveRecord::where('year', $year)->where('month', $month)->sum('final_amount'),
            'pending_count' => IncentiveRecord::where('year', $year)->where('month', $month)->where('status', 'pending')->count(),
            'paid_count' => IncentiveRecord::where('year', $year)->where('month', $month)->where('status', 'paid')->count(),
        ];

        return Inertia::render('Admin/Incentives/Index', [
            'records' => $records,
            'stats' => $stats,
            'filters' => [
                'year' => $year,
                'month' => $month,
                'status' => $request->status ?? 'all',
            ],
        ]);
    }

    // Admin: Manage incentive profiles
    public function profiles(): Response
    {
        $profiles = IncentiveProfile::all();

        return Inertia::render('Admin/Incentives/Profiles', [
            'profiles' => $profiles,
        ]);
    }

    // Admin: Update incentive profile
    public function updateProfile(Request $request, IncentiveProfile $profile)
    {
        $validated = $request->validate([
            'base_amount' => 'required|numeric|min:0',
            'penalty_per_unresolved_down' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $profile->update($validated);

        return back()->with('success', 'Incentive profile updated');
    }

    // Admin: Calculate incentives for a period
    public function calculate(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year = $validated['year'];
        $month = $validated['month'];

        // Get all supervisors and sergeants
        $users = User::whereHas('roles', function($q) {
            $q->whereIn('name', ['supervisor', 'sergeant']);
        })->get();

        $created = 0;
        $updated = 0;

        foreach ($users as $user) {
            $role = $user->hasRole('supervisor') ? 'supervisor' : 'sergeant';
            $profile = IncentiveProfile::getActiveForRole($role);

            if (!$profile) {
                continue;
            }

            // Get or create incentive record
            $record = IncentiveRecord::firstOrNew([
                'user_id' => $user->id,
                'year' => $year,
                'month' => $month,
            ]);

            $isNew = !$record->exists;

            $record->base_amount = $profile->base_amount;
            $record->status = $record->status ?? 'pending';

            // Calculate unresolved downs for this user
            $downInfo = $this->calculateDownPenalties($user, $year, $month, $profile->penalty_per_unresolved_down);

            $record->unresolved_down_count = $downInfo['count'];
            $record->total_penalties = $downInfo['total_penalty'];
            $record->final_amount = max(0, $record->base_amount - $record->total_penalties);

            $record->save();

            // Save down penalty records
            foreach ($downInfo['penalties'] as $penalty) {
                IncentiveDownPenalty::updateOrCreate(
                    [
                        'incentive_record_id' => $record->id,
                        'down_id' => $penalty['down_id'],
                    ],
                    [
                        'penalty_amount' => $penalty['penalty_amount'],
                        'resolution_type' => $penalty['resolution_type'],
                        'resolved_by' => $penalty['resolved_by'],
                        'resolved_at' => $penalty['resolved_at'],
                        'counts_against_incentive' => $penalty['counts_against_incentive'],
                    ]
                );
            }

            if ($isNew) {
                $created++;
            } else {
                $updated++;
            }
        }

        return back()->with('success', "Created {$created} and updated {$updated} incentive records");
    }

    // Calculate down penalties for a user
    private function calculateDownPenalties(User $user, int $year, int $month, float $penaltyPerDown): array
    {
        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        // Get downs that were open during this month
        $downs = Down::where(function($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->orWhere(function($q) use ($startOfMonth, $endOfMonth) {
                        $q->where('created_at', '<=', $endOfMonth)
                          ->whereNull('resolved_at');
                    });
            })
            ->where(function($query) use ($user) {
                // For supervisors: downs under their guards
                if ($user->hasRole('supervisor')) {
                    $query->whereHas('guard', function($q) use ($user) {
                        $q->where('supervisor_id', $user->id);
                    });
                }
                // For sergeants: downs in their zone
                elseif ($user->hasRole('sergeant') && $user->zone_id) {
                    $query->whereHas('guard', function($q) use ($user) {
                        $q->where('zone_id', $user->zone_id);
                    });
                }
            })
            ->with(['guard', 'resolutions'])
            ->get();

        $penalties = [];
        $totalPenalty = 0;
        $count = 0;

        foreach ($downs as $down) {
            $resolutionInfo = $this->getDownResolutionInfo($down);

            // Only count if not resolved by zone commander
            $countsAgainstIncentive = !$resolutionInfo['is_zone_commander_resolution'];

            if ($countsAgainstIncentive) {
                $totalPenalty += $penaltyPerDown;
                $count++;
            }

            $penalties[] = [
                'down_id' => $down->id,
                'penalty_amount' => $countsAgainstIncentive ? $penaltyPerDown : 0,
                'resolution_type' => $resolutionInfo['resolution_type'],
                'resolved_by' => $resolutionInfo['resolved_by'],
                'resolved_at' => $resolutionInfo['resolved_at'],
                'counts_against_incentive' => $countsAgainstIncentive,
            ];
        }

        return [
            'count' => $count,
            'total_penalty' => $totalPenalty,
            'penalties' => $penalties,
        ];
    }

    // Get resolution info for a down
    private function getDownResolutionInfo(Down $down): array
    {
        $latestResolution = $down->resolutions()->latest()->first();

        if (!$latestResolution) {
            return [
                'is_zone_commander_resolution' => false,
                'resolution_type' => null,
                'resolved_by' => null,
                'resolved_at' => null,
            ];
        }

        $resolver = User::find($latestResolution->resolved_by);
        $isZoneCommander = $resolver && $resolver->hasRole('zone_commander');

        return [
            'is_zone_commander_resolution' => $isZoneCommander,
            'resolution_type' => $isZoneCommander ? 'zone_commander' : ($resolver ? 'other' : null),
            'resolved_by' => $latestResolution->resolved_by,
            'resolved_at' => $latestResolution->created_at,
        ];
    }

    // Admin: Approve incentive record
    public function approve(IncentiveRecord $record)
    {
        if ($record->status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending records can be approved']);
        }

        $record->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => Auth::id(),
        ]);

        return back()->with('success', 'Incentive approved');
    }

    // Admin: Mark as paid
    public function markAsPaid(IncentiveRecord $record)
    {
        if ($record->status !== 'approved') {
            return back()->withErrors(['error' => 'Only approved records can be marked as paid']);
        }

        $record->update([
            'status' => 'paid',
            'paid_at' => now(),
            'paid_by' => Auth::id(),
        ]);

        return back()->with('success', 'Incentive marked as paid');
    }

    // Supervisor/Sergeant: View my incentives
    public function myIncentives(): Response
    {
        $user = Auth::user();

        $incentives = IncentiveRecord::with(['downPenalties.down'])
            ->where('user_id', $user->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate(12);

        // Year-to-date stats
        $currentYear = now()->year;
        $ytdStats = [
            'total_base' => IncentiveRecord::where('user_id', $user->id)
                ->where('year', $currentYear)
                ->sum('base_amount'),
            'total_penalties' => IncentiveRecord::where('user_id', $user->id)
                ->where('year', $currentYear)
                ->sum('total_penalties'),
            'total_paid' => IncentiveRecord::where('user_id', $user->id)
                ->where('year', $currentYear)
                ->where('status', 'paid')
                ->sum('final_amount'),
        ];

        return Inertia::render('Guards/Incentives/Index', [
            'incentives' => $incentives,
            'ytdStats' => $ytdStats,
        ]);
    }

    // Supervisor/Sergeant: View incentive details
    public function showMyIncentive(IncentiveRecord $record): Response
    {
        $user = Auth::user();

        if ($record->user_id !== $user->id) {
            abort(403);
        }

        $record->load(['downPenalties.down', 'approver', 'payer']);

        return Inertia::render('Guards/Incentives/Show', [
            'incentive' => $record,
        ]);
    }

    // KPI Dashboard data
    public function summary(): array
    {
        $currentMonth = now()->month;
        $currentYear = now()->year;

        return [
            'total_supervisors' => User::role('supervisor')->count(),
            'total_sergeants' => User::role('sergeant')->count(),
            'active_incentive_profiles' => IncentiveProfile::where('is_active', true)->count(),
            'this_month_pending' => IncentiveRecord::where('year', $currentYear)
                ->where('month', $currentMonth)
                ->where('status', 'pending')
                ->count(),
            'this_month_paid' => IncentiveRecord::where('year', $currentYear)
                ->where('month', $currentMonth)
                ->where('status', 'paid')
                ->sum('final_amount'),
            'ytd_total' => IncentiveRecord::where('year', $currentYear)
                ->where('status', 'paid')
                ->sum('final_amount'),
            'by_month' => IncentiveRecord::selectRaw('month, SUM(final_amount) as total')
                ->where('year', $currentYear)
                ->where('status', 'paid')
                ->groupBy('month')
                ->pluck('total', 'month')
                ->toArray(),
        ];
    }
}
