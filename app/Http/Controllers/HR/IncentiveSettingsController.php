<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\IncentiveType;
use App\Models\IncentiveRule;
use App\Models\IncentiveSetting;
use App\Models\IncentiveEntry;
use App\Models\GuardIncentiveProfile;
use App\Models\Guards\Guard;
use App\Services\IncentiveCalculator;
use Carbon\Carbon;

class IncentiveSettingsController extends Controller
{
    public function index(Request $request)
    {
        $types = IncentiveType::with('rules')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $settings = IncentiveSetting::byGroup('general')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('group');

        $stats = [
            'total_types' => IncentiveType::count(),
            'active_types' => IncentiveType::active()->count(),
            'active_rules' => IncentiveRule::active()->count(),
            'pending_entries' => IncentiveEntry::pending()->count(),
            'total_pending_amount' => IncentiveEntry::pending()->sum('final_amount'),
            'monthly_paid' => IncentiveEntry::paid()
                ->whereMonth('paid_at', now()->month)
                ->whereYear('paid_at', now()->year)
                ->sum('final_amount'),
        ];

        return Inertia::render('HR/IncentiveSettings', [
            'types' => $types,
            'settings' => $settings,
            'stats' => $stats,
        ]);
    }

    public function storeType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:incentive_types,slug',
            'description' => 'nullable|string',
            'category' => 'required|in:performance,referral,attendance,safety,tenure,other',
            'applies_to' => 'required|in:all,supervisor,guard,driver,staff',
            'requires_approval' => 'boolean',
            'default_config' => 'nullable|json',
        ]);

        $validated['is_active'] = true;
        $validated['sort_order'] = IncentiveType::max('sort_order') + 1;

        $type = IncentiveType::create($validated);

        return back()->with('success', 'Incentive type created successfully.');
    }

    public function updateType(Request $request, IncentiveType $type)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:performance,referral,attendance,safety,tenure,other',
            'applies_to' => 'required|in:all,supervisor,guard,driver,staff',
            'requires_approval' => 'boolean',
            'is_active' => 'boolean',
            'default_config' => 'nullable|json',
        ]);

        $type->update($validated);

        return back()->with('success', 'Incentive type updated successfully.');
    }

    public function destroyType(IncentiveType $type)
    {
        if ($type->records()->exists()) {
            return back()->with('error', 'Cannot delete type with existing records.');
        }

        $type->delete();
        return back()->with('success', 'Incentive type deleted successfully.');
    }

    public function storeRule(Request $request)
    {
        $validated = $request->validate([
            'incentive_type_id' => 'required|exists:incentive_types,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'condition_type' => 'required|string',
            'condition_config' => 'required|json',
            'calculation_type' => 'required|in:fixed,percentage_of_base,per_unit,tiered',
            'calculation_config' => 'required|json',
            'min_amount' => 'nullable|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'period_type' => 'required|in:daily,weekly,monthly,quarterly,yearly,one_time',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
        ]);

        $validated['is_active'] = true;

        $rule = IncentiveRule::create($validated);

        return back()->with('success', 'Incentive rule created successfully.');
    }

    public function updateRule(Request $request, IncentiveRule $rule)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'condition_type' => 'required|string',
            'condition_config' => 'required|json',
            'calculation_type' => 'required|in:fixed,percentage_of_base,per_unit,tiered',
            'calculation_config' => 'required|json',
            'min_amount' => 'nullable|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'period_type' => 'required|in:daily,weekly,monthly,quarterly,yearly,one_time',
            'is_active' => 'boolean',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
        ]);

        $rule->update($validated);

        return back()->with('success', 'Incentive rule updated successfully.');
    }

    public function destroyRule(IncentiveRule $rule)
    {
        if ($rule->records()->exists()) {
            return back()->with('error', 'Cannot delete rule with existing records.');
        }

        $rule->delete();
        return back()->with('success', 'Incentive rule deleted successfully.');
    }

    public function updateSettings(Request $request)
    {
        $settings = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        foreach ($settings['settings'] as $setting) {
            IncentiveSetting::setValue($setting['key'], $setting['value']);
        }

        return back()->with('success', 'Settings updated successfully.');
    }

    public function calculate(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'incentive_type_id' => 'nullable|exists:incentive_types,id',
            'guard_ids' => 'nullable|array',
            'guard_ids.*' => 'exists:guards,id',
        ]);

        $calculator = new IncentiveCalculator();
        $results = $calculator->calculateForPeriod(
            Carbon::parse($validated['period_start']),
            Carbon::parse($validated['period_end']),
            $validated['incentive_type_id'] ?? null,
            $validated['guard_ids'] ?? null
        );

        return back()->with('success', "Calculated {$results['count']} incentive entries.");
    }

    public function getEntries(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date',
            'guard_id' => 'nullable|exists:guards,id',
            'incentive_type_id' => 'nullable|exists:incentive_types,id',
            'status' => 'nullable|in:pending,approved,paid,rejected',
        ]);

        $entries = IncentiveEntry::with(['guard', 'incentiveType', 'incentiveRule'])
            ->when(!empty($validated['period_start']), function($q) use ($validated) {
                $q->where('period_start', '>=', $validated['period_start']);
            })
            ->when(!empty($validated['period_end']), function($q) use ($validated) {
                $q->where('period_end', '<=', $validated['period_end']);
            })
            ->when(!empty($validated['guard_id']), function($q) use ($validated) {
                $q->where('guard_id', $validated['guard_id']);
            })
            ->when(!empty($validated['incentive_type_id']), function($q) use ($validated) {
                $q->where('incentive_type_id', $validated['incentive_type_id']);
            })
            ->when(!empty($validated['status']), function($q) use ($validated) {
                $q->where('status', $validated['status']);
            })
            ->orderBy('period_end', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json(['entries' => $entries]);
    }

    public function approveEntry(Request $request, IncentiveEntry $entry)
    {
        $entry->approve(auth()->id());
        return back()->with('success', 'Incentive entry approved.');
    }

    public function markAsPaid(Request $request, IncentiveEntry $entry)
    {
        $entry->markAsPaid(auth()->id());
        return back()->with('success', 'Incentive marked as paid.');
    }

    public function rejectEntry(Request $request, IncentiveEntry $entry)
    {
        $entry->reject();
        return back()->with('success', 'Incentive entry rejected.');
    }

    public function adjustEntry(Request $request, IncentiveEntry $entry)
    {
        $validated = $request->validate([
            'adjustment_amount' => 'required|numeric',
            'adjustment_reason' => 'required|string',
        ]);

        $entry->adjust($validated['adjustment_amount'], $validated['adjustment_reason']);
        return back()->with('success', 'Incentive entry adjusted.');
    }

    public function destroyEntry(IncentiveEntry $entry)
    {
        if ($entry->status === 'paid') {
            return back()->with('error', 'Cannot delete paid incentive entries.');
        }

        $entry->delete();
        return back()->with('success', 'Incentive entry deleted.');
    }
}
