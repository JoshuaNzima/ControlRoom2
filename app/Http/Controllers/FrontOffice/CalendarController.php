<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Events\CalendarEventCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalendarController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $role = $this->getRole($user);

        return inertia('FrontOffice/Calendar/Index', [
            'role' => $role,
            'can' => [
                'manage_calendar' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'manage_tasks' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'view_reports' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
                'export_data' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
            ],
        ]);
    }

    private function getRole($user): string
    {
        $roles = $user->roles->pluck('name')->toArray();

        foreach (['executive_assistant', 'personal_assistant', 'receptionist', 'super_admin', 'admin'] as $r) {
            if (in_array($r, $roles)) {
                return $r;
            }
        }

        return 'receptionist';
    }

    public function events(Request $request)
    {
        $start = $request->input('start', now()->startOfMonth());
        $end = $request->input('end', now()->endOfMonth());

        $events = CalendarEvent::with('creator')
            ->whereBetween('start_time', [$start, $end])
            ->orderBy('start_time')
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'start' => $e->start_time->toIso8601String(),
                'end' => $e->end_time?->toIso8601String(),
                'allDay' => $e->all_day,
                'description' => $e->description,
                'location' => $e->location,
                'attendees' => $e->attendees,
                'color' => $this->getEventColor($e->type),
            ]);

        return response()->json($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after:start_time',
            'all_day' => 'boolean',
            'location' => 'nullable|string|max:255',
            'attendees' => 'nullable|array',
            'attendees.*' => 'exists:users,id',
            'type' => 'nullable|string|in:meeting,appointment,reminder,other',
        ]);

        $event = CalendarEvent::create([
            ...$validated,
            'created_by' => Auth::id(),
        ]);

        // Dispatch event for push notification
        CalendarEventCreated::dispatch($event, 'created');

        return back()->with('success', 'Event created successfully.');
    }

    public function update(Request $request, CalendarEvent $event)
    {
        $this->authorize('update', $event);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after:start_time',
            'all_day' => 'boolean',
            'location' => 'nullable|string|max:255',
            'attendees' => 'nullable|array',
            'type' => 'nullable|string|in:meeting,appointment,reminder,other',
        ]);

        $event->update($validated);

        // Dispatch event for push notification
        CalendarEventCreated::dispatch($event, 'updated');

        return back()->with('success', 'Event updated successfully.');
    }

    public function destroy(CalendarEvent $event)
    {
        $this->authorize('delete', $event);

        // Dispatch event for push notification before deletion
        CalendarEventCreated::dispatch($event, 'cancelled');

        $event->delete();

        return back()->with('success', 'Event deleted successfully.');
    }

    private function getEventColor(string $type): string
    {
        return match($type) {
            'meeting' => '#ef4444',
            'appointment' => '#3b82f6',
            'reminder' => '#f59e0b',
            default => '#6b7280',
        };
    }
}
