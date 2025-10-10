<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class AssignmentController extends Controller
{
    public function index()
    {
        $supervisor = Auth::user();
        $guards = Guard::with('currentAssignment.site.client')
            ->where('supervisor_id', $supervisor->id)
            ->get();

        $sites = ClientSite::with('client')->whereHas('client', function ($query) {
            $query->where('status', 'active');
        })->get()->map(function ($site) {
            $site->full_name = $site->client->name . ' - ' . $site->name;
            return $site;
        });

        return Inertia::render('Supervisor/Assignments', [
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }

    public function assign(Request $request)
    {
        $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'assignment_type' => 'required|in:permanent,temporary',
        ]);

        // End previous assignment if any
        GuardAssignment::where('guard_id', $request->guard_id)->whereNull('end_date')->update(['end_date' => now()]);

        GuardAssignment::create($request->all());

        return redirect()->back()->with('success', 'Guard assigned successfully.');
    }

    public function unassign(GuardAssignment $assignment)
    {
        $assignment->update(['end_date' => now()]);

        return redirect()->back()->with('success', 'Guard unassigned successfully.');
    }
}
