<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlertController extends Controller
{
    public function index()
    {
        $alerts = Alert::with(['source', 'acknowledgedBy'])
            ->latest()
            ->paginate(20);

        return Inertia::render('ControlRoom/Alerts/Index', [
            'alerts' => $alerts,
        ]);
    }

    public function acknowledge(Request $request, Alert $alert)
    {
        $alert->update([
            'status' => 'acknowledged',
            'acknowledged_by' => auth()->id(),
            'acknowledged_at' => now(),
        ]);

        return back()->with('success', 'Alert acknowledged successfully.');
    }

    public function resolve(Request $request, Alert $alert)
    {
        $alert->update([
            'status' => 'resolved',
            'resolved_by' => auth()->id(),
            'resolved_at' => now(),
        ]);

        return back()->with('success', 'Alert resolved successfully.');
    }

    public function sendEmergency(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
            'priority' => 'required|in:low,medium,high,critical',
            'target_groups' => 'required|array',
            'target_groups.*' => 'in:all_guards,supervisors,management,clients',
        ]);

        // Create emergency alert
        $alert = Alert::create([
            'title' => 'Emergency Alert',
            'message' => $validated['message'],
            'type' => 'emergency',
            'priority' => $validated['priority'],
            'status' => 'active',
            'source_type' => 'control_room',
            'source_id' => auth()->id(),
            'target_groups' => $validated['target_groups'],
        ]);

        // Here you would typically send notifications via SMS, email, push notifications, etc.
        // For now, we'll just create the alert record

        return back()->with('success', 'Emergency alert sent successfully.');
    }
}