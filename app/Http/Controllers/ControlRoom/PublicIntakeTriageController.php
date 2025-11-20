<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\PublicIntake;
use App\Models\Ticket;
use App\Models\Down;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PublicIntakeTriageController extends Controller
{
    public function index(Request $request)
    {
        $intakes = PublicIntake::query()
            ->when($request->get('type'), fn($q, $t) => $q->where('type', $t))
            ->when($request->get('status'), fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(15)
            ->appends($request->query());

        return Inertia::render('ControlRoom/Triage/Intakes/Index', [
            'intakes' => $intakes,
            'filters' => [
                'type' => $request->get('type'),
                'status' => $request->get('status'),
            ],
        ]);
    }

    public function show(PublicIntake $intake)
    {
        return Inertia::render('ControlRoom/Triage/Intakes/Show', [
            'intake' => $intake,
        ]);
    }

    public function convert(Request $request, PublicIntake $intake)
    {
        if ($intake->converted_id) {
            return back()->with('info', 'Already converted.');
        }

        $targetType = $request->input('target_type', $intake->type);
        $createdId = null;

        if ($targetType === 'ticket') {
            $ticket = Ticket::create([
                'title' => $intake->title ?? 'Public Ticket',
                'category' => $intake->category ?: 'request',
                'priority' => $intake->priority ?: 'medium',
                'description' => $intake->description,
                'status' => 'open',
                'reported_by' => Auth::id(),
            ]);
            $createdId = $ticket->id;
        } elseif ($targetType === 'down') {
            $down = Down::create([
                'title' => $intake->title ?? 'Public Down',
                'type' => $intake->category ?: 'other',
                'description' => $intake->description,
                'status' => 'open',
                'reported_by' => Auth::id(),
                'escalation_level' => 0,
            ]);
            $createdId = $down->id;
        } else { // incident
            $incident = Incident::create([
                'title' => $intake->title ?? 'Public Incident',
                'type' => $intake->category ?: 'general',
                'severity' => 'medium',
                'description' => $intake->description,
                'status' => 'open',
                'reporter_id' => Auth::id(),
            ]);
            $createdId = $incident->id;
        }

        $intake->update([
            'status' => 'converted',
            'converted_type' => $targetType,
            'converted_id' => $createdId,
            'converted_by' => Auth::id(),
            'converted_at' => now(),
        ]);

        return back()->with('success', ucfirst($targetType).' created successfully.');
    }
}
