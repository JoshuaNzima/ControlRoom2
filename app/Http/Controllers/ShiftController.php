<?php

namespace App\Http\Controllers;

use App\Models\Guards\Guard;
use App\Models\Guards\Shift;
use App\Models\Guards\ClientSite;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ShiftController extends Controller
{
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

        // If user is supervisor, only show their guards' shifts
        if (Auth::user()->hasRole('supervisor')) {
            $query->whereHas('guardRelation', function($q) {
                $q->forSupervisor(Auth::id());
            });
        }

        $shifts = $query->latest('date')->paginate(20);

        return Inertia::render('Shifts/Index', [
            'shifts' => $shifts,
            'filters' => request()->only(['search', 'date', 'status']),
        ]);
    }

    public function create()
    {
        $guards = Guard::when(Auth::user()->hasRole('supervisor'), function($query) {
            $query->forSupervisor(Auth::id());
        })->active()->get();

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
            'end_time' => 'required|date_format:H:i|after:start_time',
            'shift_type' => 'required|in:day,night',
            'instructions' => 'nullable|string',
            'status' => 'required|in:scheduled,completed,cancelled',
        ]);

        $validated['assigned_by'] = Auth::id();
        
        // Combine date and time
        $validated['start_time'] = $validated['date'] . ' ' . $validated['start_time'];
        $validated['end_time'] = $validated['date'] . ' ' . $validated['end_time'];

        Shift::create($validated);

        return redirect()->route('shifts.index')
            ->with('success', 'Shift created successfully.');
    }

    public function edit(Shift $shift)
    {
        $guards = Guard::when(Auth::user()->hasRole('supervisor'), function($query) {
            $query->forSupervisor(Auth::id());
        })->active()->get();

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
            'end_time' => 'required|date_format:H:i|after:start_time',
            'shift_type' => 'required|in:day,night',
            'instructions' => 'nullable|string',
            'status' => 'required|in:scheduled,completed,cancelled',
        ]);

        // Combine date and time
        $validated['start_time'] = $validated['date'] . ' ' . $validated['start_time'];
        $validated['end_time'] = $validated['date'] . ' ' . $validated['end_time'];

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