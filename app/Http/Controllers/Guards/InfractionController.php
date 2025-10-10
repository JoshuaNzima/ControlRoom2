<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardInfraction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class InfractionController extends Controller
{
    use AuthorizesRequests;
    public function index()
    {
        $this->authorize('view_infractions');
        
        $query = GuardInfraction::with(['guardRelation', 'reporter', 'reviewer'])
            ->latest();

        // If zone commander, only show infractions from their zone
        if (Auth::user()->hasRole('zone_commander')) {
            $query->whereHas('guardRelation.site.zone', function($q) {
                $q->where('id', Auth::user()->zone_id);
            });
        }
        // If supervisor, only show their guards' infractions
        elseif (Auth::user()->hasRole('supervisor')) {
            $query->whereHas('guardRelation', function($q) {
                $q->where('supervisor_id', Auth::id());
            });
        }

        $infractions = $query->paginate(15);

        return Inertia::render('Guards/Infractions/Index', [
            'infractions' => $infractions
        ]);
    }

    public function create()
    {
        $this->authorize('create_infractions');

        $guards = Auth::user()->hasRole('supervisor') 
            ? Guard::where('supervisor_id', Auth::id())->get()
            : Guard::all();

        return Inertia::render('Guards/Infractions/Create', [
            'guards' => $guards
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create_infractions');

        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'type' => 'required|string',
            'description' => 'required|string',
            'severity' => 'required|in:minor,moderate,major',
            'incident_date' => 'required|date',
        ]);

        $validated['reported_by'] = Auth::id();
        $validated['status'] = 'pending';

        $guard = Guard::findOrFail($validated['guard_id']);
        $infraction = $guard->recordInfraction($validated);

        return redirect()->route('infractions.index')
            ->with('success', 'Infraction recorded successfully.');
    }

    public function review(GuardInfraction $infraction)
    {
        $this->authorize('manage_infractions');

        return Inertia::render('Guards/Infractions/Review', [
            'infraction' => $infraction->load(['guardRelation', 'reporter'])
        ]);
    }

    public function updateStatus(Request $request, GuardInfraction $infraction)
    {
        $this->authorize('manage_infractions');

        $validated = $request->validate([
            'status' => 'required|in:pending,reviewed,resolved',
            'resolution' => 'required_if:status,resolved|nullable|string',
        ]);

        $infraction->update([
            'status' => $validated['status'],
            'resolution' => $validated['resolution'],
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        $infraction->guardRelation?->updateInfractionCount();

        return redirect()->back()
            ->with('success', 'Infraction status updated successfully.');
    }
}