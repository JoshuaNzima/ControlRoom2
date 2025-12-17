<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use App\Models\Holiday;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardOffDay;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class LeaveController extends Controller
{
     public function index(Request $request)
    {
        $today = Carbon::today();
        $monthStart = $request->query('month_start');
        $monthEnd = $request->query('month_end');

        $start = $monthStart ? Carbon::parse($monthStart) : $today->copy()->startOfMonth();
        $end = $monthEnd ? Carbon::parse($monthEnd) : $today->copy()->endOfMonth();

        $guards = Guard::active()
            ->orderBy('name')
            ->get(['id','name','employee_id'])
            ->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'employee_id' => $g->employee_id,
            ]);

        // Light bootstrap data: upcoming holidays in month
        $holidays = Holiday::query()
            ->whereBetween('date', [$start->copy()->startOfMonth(), $end->copy()->endOfMonth()])
            ->orderBy('date')
            ->get(['id','name','date','is_recurring','type']);

        return Inertia::render('HR/Roster', [
            'guards' => $guards,
            'initial_month' => $today->format('Y-m-01'),
            'initial_holidays' => $holidays,
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['required','date'],
            'end' => ['required','date','after_or_equal:start'],
        ]);

        $start = Carbon::parse($request->query('start'))->startOfDay();
        $end = Carbon::parse($request->query('end'))->endOfDay();

        // Holidays: include both fixed (within range) and recurring (match month-day)
        $fixedHolidays = Holiday::where('is_recurring', false)
            ->whereBetween('date', [$start->copy()->toDateString(), $end->copy()->toDateString()])
            ->get();

        $recurringHolidays = Holiday::where('is_recurring', true)->get();

        $events = [];

        foreach ($fixedHolidays as $h) {
            $events[] = [
                'entity' => 'holiday',
                'entity_id' => $h->id,
                'date' => Carbon::parse($h->date)->toDateString(),
                'title' => $h->name,
                'type' => 'holiday',
                'color' => 'red',
                'meta' => ['is_recurring' => false, 'holiday_type' => $h->type],
            ];
        }

        if ($recurringHolidays->isNotEmpty()) {
            $period = CarbonPeriod::create($start->copy()->toDateString(), $end->copy()->toDateString());
            foreach ($period as $day) {
                foreach ($recurringHolidays as $h) {
                    $hDate = Carbon::parse($h->date);
                    if ($day->month === $hDate->month && $day->day === $hDate->day) {
                        $events[] = [
                            'entity' => 'holiday',
                            'entity_id' => $h->id,
                            'date' => $day->toDateString(),
                            'title' => $h->name,
                            'type' => 'holiday',
                            'color' => 'red',
                            'meta' => ['is_recurring' => true, 'holiday_type' => $h->type],
                        ];
                    }
                }
            }
        }

        // Guard off-days overlapping the range
        $offDays = GuardOffDay::with('guard:id,name,employee_id')
            ->whereDate('start_date', '<=', $end->toDateString())
            ->where(function($q) use ($start) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $start->toDateString());
            })
            ->get();

        foreach ($offDays as $off) {
            $offStart = Carbon::parse($off->start_date)->startOfDay();
            $offEnd = $off->end_date ? Carbon::parse($off->end_date)->endOfDay() : $offStart->copy()->endOfDay();

            $rangeStart = $offStart->greaterThan($start) ? $offStart : $start->copy();
            $rangeEnd = $offEnd->lessThan($end) ? $offEnd : $end->copy();

            $period = CarbonPeriod::create($rangeStart->toDateString(), $rangeEnd->toDateString());
            foreach ($period as $day) {
                $events[] = [
                    'entity' => 'off_day',
                    'entity_id' => $off->id,
                    'date' => $day->toDateString(),
                    'title' => 'Off: '.($off->guard?->name ?? 'Guard'),
                    'type' => 'off_day',
                    'color' => 'indigo',
                    'meta' => [
                        'guard' => $off->guard ? [
                            'id' => $off->guard->id,
                            'name' => $off->guard->name,
                            'employee_id' => $off->guard->employee_id,
                        ] : null,
                        'reason' => $off->reason,
                        'start_date' => $off->start_date,
                        'end_date' => $off->end_date,
                    ],
                ];
            }
        }

        return response()->json(['events' => $events]);
    }

    public function storeHoliday(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required','string','max:100'],
            'date' => ['required','date'],
            'is_recurring' => ['nullable','boolean'],
            'type' => ['nullable','in:company,public'],
        ]);

        $holiday = Holiday::create([
            'name' => $validated['name'],
            'date' => Carbon::parse($validated['date'])->toDateString(),
            'is_recurring' => (bool)($validated['is_recurring'] ?? false),
            'type' => $validated['type'] ?? 'company',
        ]);

        return back()->with('success', 'Holiday created');
    }

    public function updateHoliday(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'name' => ['required','string','max:100'],
            'date' => ['required','date'],
            'is_recurring' => ['nullable','boolean'],
            'type' => ['nullable','in:company,public'],
        ]);

        $holiday->update([
            'name' => $validated['name'],
            'date' => Carbon::parse($validated['date'])->toDateString(),
            'is_recurring' => (bool)($validated['is_recurring'] ?? false),
            'type' => $validated['type'] ?? 'company',
        ]);

        return back()->with('success', 'Holiday updated');
    }

    public function destroyHoliday(Holiday $holiday)
    {
        $holiday->delete();
        return back()->with('success', 'Holiday deleted');
    }

    public function storeOffDay(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'start_date' => ['required','date'],
            'end_date' => ['nullable','date','after_or_equal:start_date'],
            'reason' => ['nullable','string','max:255'],
        ]);

        GuardOffDay::create([
            'guard_id' => $validated['guard_id'],
            'start_date' => Carbon::parse($validated['start_date'])->toDateString(),
            'end_date' => !empty($validated['end_date']) ? Carbon::parse($validated['end_date'])->toDateString() : null,
            'reason' => $validated['reason'] ?? null,
        ]);

        return back()->with('success', 'Off day recorded');
    }

    public function updateOffDay(Request $request, GuardOffDay $offDay)
    {
        $validated = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'start_date' => ['required','date'],
            'end_date' => ['nullable','date','after_or_equal:start_date'],
            'reason' => ['nullable','string','max:255'],
        ]);

        $offDay->update([
            'guard_id' => $validated['guard_id'],
            'start_date' => Carbon::parse($validated['start_date'])->toDateString(),
            'end_date' => !empty($validated['end_date']) ? Carbon::parse($validated['end_date'])->toDateString() : null,
            'reason' => $validated['reason'] ?? null,
        ]);

        return back()->with('success', 'Off day updated');
    }

    public function destroyOffDay(GuardOffDay $offDay)
    {
        $offDay->delete();
        return back()->with('success', 'Off day deleted');
    }
}
