<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\SupervisorIncentiveProfile;
use App\Models\SupervisorIncentiveRecord;
use App\Models\Guards\Guard;
use Carbon\Carbon;

class SupervisorIncentiveController extends Controller
{
    public function index(Request $request)
    {
        $profiles = SupervisorIncentiveProfile::with(['guardRelation' => function($q) {
                $q->select('id', 'name', 'employee_id', 'position', 'status');
            }])
            ->whereHas('guardRelation', function($q) {
                $q->whereIn('position', ['supervisor', 'sergeant']);
            })
            ->get();

        $leaders = Guard::whereIn('position', ['supervisor', 'sergeant'])
            ->where('status', 'active')
            ->select('id', 'name', 'employee_id', 'position')
            ->orderBy('name')
            ->get();

        return Inertia::render('HR/SupervisorIncentives', [
            'profiles' => $profiles,
            'leaders' => $leaders,
        ]);
    }

    public function storeProfile(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'base_amount' => 'required|numeric|min:0',
            'per_guard_amount' => 'nullable|numeric|min:0',
            'absence_deduction' => 'nullable|numeric|min:0',
            'uncovered_site_deduction' => 'nullable|numeric|min:0',
            'calculation_period' => 'required|in:weekly,bi_weekly,monthly',
            'notes' => 'nullable|string',
        ]);

        $validated['is_active'] = true;

        $profile = SupervisorIncentiveProfile::updateOrCreate(
            ['guard_id' => $validated['guard_id']],
            $validated
        );

        return back()->with('success', 'Incentive profile saved successfully.');
    }

    public function updateProfile(Request $request, SupervisorIncentiveProfile $profile)
    {
        $validated = $request->validate([
            'base_amount' => 'required|numeric|min:0',
            'per_guard_amount' => 'nullable|numeric|min:0',
            'absence_deduction' => 'nullable|numeric|min:0',
            'uncovered_site_deduction' => 'nullable|numeric|min:0',
            'calculation_period' => 'required|in:weekly,bi_weekly,monthly',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $profile->update($validated);

        return back()->with('success', 'Incentive profile updated successfully.');
    }

    public function calculateIncentives(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'guard_ids' => 'nullable|array',
            'guard_ids.*' => 'exists:guards,id',
        ]);

        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = Carbon::parse($validated['period_end']);

        $profiles = SupervisorIncentiveProfile::with('guardRelation')
            ->where('is_active', true)
            ->when(!empty($validated['guard_ids']), function($q) use ($validated) {
                $q->whereIn('guard_id', $validated['guard_ids']);
            })
            ->get();

        $calculated = [];

        foreach ($profiles as $profile) {
            $record = $this->calculateForGuard($profile, $periodStart, $periodEnd);
            $calculated[] = $record;
        }

        return back()->with('success', 'Incentives calculated for ' . count($calculated) . ' supervisors/sergeants.');
    }

    private function calculateForGuard(SupervisorIncentiveProfile $profile, Carbon $periodStart, Carbon $periodEnd): SupervisorIncentiveRecord
    {
        $guard = $profile->guardRelation;

        // Get guards under this supervisor/sergeant
        $subordinateIds = Guard::where('reports_to_guard_id', $guard->id)
            ->where('status', 'active')
            ->pluck('id');

        $guardsCount = $subordinateIds->count();

        // Count absences in period (from attendance records)
        $absencesCount = \DB::table('attendance_records')
            ->whereIn('guard_id', $subordinateIds)
            ->whereBetween('date', [$periodStart, $periodEnd])
            ->where('status', 'absent')
            ->count();

        // Count uncovered sites in period
        $uncoveredSitesCount = \DB::table('site_coverage_issues')
            ->where('supervisor_guard_id', $guard->id)
            ->whereBetween('date', [$periodStart, $periodEnd])
            ->where('resolved', false)
            ->count();

        // Calculate amounts
        $baseAmount = $profile->base_amount;
        $perGuardTotal = $guardsCount * $profile->per_guard_amount;
        $absenceDeductions = $absencesCount * $profile->absence_deduction;
        $uncoveredSiteDeductions = $uncoveredSitesCount * $profile->uncovered_site_deduction;
        $totalDeductions = $absenceDeductions + $uncoveredSiteDeductions;

        // Performance bonus if no issues
        $performanceBonus = ($absencesCount === 0 && $uncoveredSitesCount === 0)
            ? $baseAmount * 0.1 // 10% bonus for perfect performance
            : 0;

        $netAmount = $baseAmount + $perGuardTotal + $performanceBonus - $totalDeductions;

        return SupervisorIncentiveRecord::updateOrCreate(
            [
                'guard_id' => $guard->id,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
            ],
            [
                'base_amount' => $baseAmount,
                'performance_bonus' => $performanceBonus,
                'guards_count' => $guardsCount,
                'per_guard_total' => $perGuardTotal,
                'absences_count' => $absencesCount,
                'absence_deductions' => $absenceDeductions,
                'uncovered_sites_count' => $uncoveredSitesCount,
                'uncovered_site_deductions' => $uncoveredSiteDeductions,
                'total_deductions' => $totalDeductions,
                'net_amount' => max(0, $netAmount),
                'status' => 'pending',
                'calculated_by' => auth()->id(),
                'calculated_at' => now(),
            ]
        );
    }

    public function getRecords(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date',
            'guard_id' => 'nullable|exists:guards,id',
            'status' => 'nullable|in:pending,approved,paid,rejected',
        ]);

        $records = SupervisorIncentiveRecord::with(['guardRelation' => function($q) {
                $q->select('id', 'name', 'employee_id', 'position');
            }, 'calculator', 'approver'])
            ->when(!empty($validated['period_start']), function($q) use ($validated) {
                $q->where('period_start', '>=', $validated['period_start']);
            })
            ->when(!empty($validated['period_end']), function($q) use ($validated) {
                $q->where('period_end', '<=', $validated['period_end']);
            })
            ->when(!empty($validated['guard_id']), function($q) use ($validated) {
                $q->where('guard_id', $validated['guard_id']);
            })
            ->when(!empty($validated['status']), function($q) use ($validated) {
                $q->where('status', $validated['status']);
            })
            ->orderBy('period_end', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'records' => $records]);
    }

    public function approveRecord(Request $request, SupervisorIncentiveRecord $record)
    {
        $record->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Incentive record approved.');
    }

    public function markAsPaid(Request $request, SupervisorIncentiveRecord $record)
    {
        $record->update([
            'status' => 'paid',
        ]);

        return back()->with('success', 'Incentive marked as paid.');
    }

    public function deleteRecord(SupervisorIncentiveRecord $record)
    {
        $record->delete();
        return back()->with('success', 'Incentive record deleted.');
    }
}
