<?php

namespace App\Http\Controllers;

use App\Models\Guards\Guard;
use App\Models\Guards\Shift;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;
use App\Services\GuardScopingService;
use App\Services\RotaResolver;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ShiftController extends Controller
{
    /**
     * Get the guards managed by the current user (supervisor/sergeant) via GuardScopingService.
     * Returns a query builder scoped to managed guards, or all guards for other roles.
     */
    private function getManagedGuardsQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $user = Auth::user();
        if ($user && ($user->hasRole('supervisor') || $user->hasRole('sergeant'))) {
            return app(GuardScopingService::class)->getManagedGuardQuery($user);
        }
        return Guard::query();
    }

    public function index()
    {
        $query = Shift::query()
            ->with(['guardRelation', 'clientSite', 'assignedBy'])
            ->when(request('search'), function($query, $search) {
                $query->whereHas('guardRelation', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->when(request('date'), function($query, $date) {
                $query->whereDate('date', $date);
            })
            ->when(request('status'), function($query, $status) {
                $query->where('status', $status);
            });

        // Scope to managed guards via GuardScopingService (handles both supervisor and sergeant)
        $user = Auth::user();
        if ($user && ($user->hasRole('supervisor') || $user->hasRole('sergeant'))) {
            $guardIds = app(GuardScopingService::class)->getManagedGuardIds($user);
            $query->whereHas('guardRelation', function($q) use ($guardIds) {
                $q->whereIn('id', $guardIds);
            });
        }

        $shifts = $query->latest('date')->paginate(20);

        $guards = $this->getManagedGuardsQuery()->active()->select(['id','name','guard_type'])->get();

        $sites = ClientSite::active()->select(['id','name'])->get();

        return Inertia::render('Shifts/Index', [
            'shifts' => $shifts,
            'filters' => request()->only(['search', 'date', 'status']),
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }

    public function create()
    {
        $guards = $this->getManagedGuardsQuery()->active()->get();

        $sites = ClientSite::active()->get();

        return Inertia::render('Shifts/Create', [
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'shift_type' => 'required|in:day,night',
            'instructions' => 'nullable|string',
            'status' => 'required|in:scheduled,completed,cancelled',
        ]);

        $start = Carbon::parse($validated['date'].' '.$validated['start_time'].':00');
        $end = Carbon::parse($validated['date'].' '.$validated['end_time'].':00');
        if ($end->lessThanOrEqualTo($start)) {
            $end->addDay();
        }

        $rota = app(RotaResolver::class);
        $dayStatus = $rota->getDayStatus((int) $validated['guard_id'], $validated['date']);

        $errors = [];
        if (!empty($dayStatus['is_off'])) {
            $errors['date'] = 'Guard has an off-day on the selected date.';
        }

        $overlap = Shift::where('guard_id', $validated['guard_id'])
            ->where('status', '!=', 'cancelled')
            ->where(function($q) use ($start, $end) {
                $q->where('start_time', '<', $end)
                  ->where('end_time', '>', $start);
            })
            ->exists();
        if ($overlap) {
            $errors['start_time'] = 'Overlapping shift exists for this guard at the selected time.';
        }

        $assigned = GuardAssignment::active()->current()
            ->where('guard_id', $validated['guard_id'])
            ->where('client_site_id', $validated['client_site_id'])
            ->whereDate('start_date', '<=', $validated['date'])
            ->where(function($q) use ($validated) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $validated['date']);
            })
            ->exists();
        if (!$assigned) {
            $errors['client_site_id'] = 'Guard is not assigned to the selected site on this date.';
        }

        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        $validated['assigned_by'] = Auth::id();
        $validated['source'] = 'manual_roster_entry';

        // Combine date and time
        $validated['start_time'] = $start;
        $validated['end_time'] = $end;

        Shift::create($validated);

        return redirect()->route('shifts.index')
            ->with('success', 'Shift created successfully.');
    }

    public function edit(Shift $shift)
    {
        $guards = $this->getManagedGuardsQuery()->active()->get();

        $sites = ClientSite::active()->get();

        return Inertia::render('Shifts/Edit', [
            'shift' => $shift->load(['guardRelation', 'clientSite']),
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }

    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'shift_type' => 'required|in:day,night',
            'instructions' => 'nullable|string',
            'status' => 'required|in:scheduled,completed,cancelled',
        ]);
        $start = Carbon::parse($validated['date'].' '.$validated['start_time'].':00');
        $end = Carbon::parse($validated['date'].' '.$validated['end_time'].':00');
        if ($end->lessThanOrEqualTo($start)) {
            $end->addDay();
        }

        $rota = app(RotaResolver::class);
        $dayStatus = $rota->getDayStatus((int) $validated['guard_id'], $validated['date']);

        $errors = [];
        if (!empty($dayStatus['is_off'])) {
            $errors['date'] = 'Guard has an off-day on the selected date.';
        }

        $overlap = Shift::where('guard_id', $validated['guard_id'])
            ->where('status', '!=', 'cancelled')
            ->where('id', '!=', $shift->id)
            ->where(function($q) use ($start, $end) {
                $q->where('start_time', '<', $end)
                  ->where('end_time', '>', $start);
            })
            ->exists();
        if ($overlap) {
            $errors['start_time'] = 'Overlapping shift exists for this guard at the selected time.';
        }

        $assigned = GuardAssignment::active()->current()
            ->where('guard_id', $validated['guard_id'])
            ->where('client_site_id', $validated['client_site_id'])
            ->whereDate('start_date', '<=', $validated['date'])
            ->where(function($q) use ($validated) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $validated['date']);
            })
            ->exists();
        if (!$assigned) {
            $errors['client_site_id'] = 'Guard is not assigned to the selected site on this date.';
        }

        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        // Combine date and time
        $validated['start_time'] = $start;
        $validated['end_time'] = $end;

        $shift->update($validated);

        return redirect()->route('shifts.index')
            ->with('success', 'Shift updated successfully.');
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();

        return redirect()->route('shifts.index')
            ->with('success', 'Shift deleted successfully.');
    }
}
