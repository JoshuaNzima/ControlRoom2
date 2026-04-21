<?php

namespace App\Listeners;

use App\Events\CalendarEventCreated;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendCalendarEventPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected array $actionMessages = [
        'created' => 'New calendar event',
        'updated' => 'Event updated',
        'cancelled' => 'Event cancelled',
        'reminder' => 'Event reminder',
    ];

    public function handle(CalendarEventCreated $event): void
    {
        try {
            $calendarEvent = $event->event;
            $action = $event->action;
            
            // Determine who should be notified based on event type
            $users = collect();
            
            // Company-wide events notify all users
            if ($calendarEvent->event_type === 'company' || $calendarEvent->event_type === 'public_holiday') {
                $users = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin', 'hr_manager', 'hr', 'supervisor', 'guard', 'control_room_operator']);
                })->get();
            }
            
            // Training events notify trainers and trainees
            if ($calendarEvent->event_type === 'training') {
                $users = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin', 'trainer', 'trainee']);
                })->get();
            }
            
            // HR events notify HR and admins
            if ($calendarEvent->event_type === 'hr') {
                $users = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin', 'hr_manager', 'hr']);
                })->get();
            }
            
            // Operations events notify operations team
            if ($calendarEvent->event_type === 'operations') {
                $users = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin', 'operations_manager', 'operations_officer', 'supervisor', 'zone_commander']);
                })->get();
            }
            
            // Default: notify admins and creator's team
            if ($users->isEmpty()) {
                $users = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin']);
                })->get();
            }

            if ($users->isEmpty()) {
                return;
            }

            $pushService = new PushNotificationService();
            
            $title = $this->actionMessages[$action] ?? 'Calendar Event';
            $body = "\"{$calendarEvent->title}\"";
            
            if ($calendarEvent->start_date) {
                $body .= " - " . $calendarEvent->start_date->format('M j, g:i A');
            }
            
            $payload = PushNotificationService::createPayload(
                $title,
                $body,
                null,
                route('calendar.index'),
                'calendar-event-' . $calendarEvent->id,
                [
                    'type' => 'calendar_event',
                    'event_id' => $calendarEvent->id,
                    'event_type' => $calendarEvent->event_type,
                    'action' => $action,
                    'start_date' => $calendarEvent->start_date?->toDateTimeString(),
                ]
            );

            $result = $pushService->sendToUsers($users, $payload);

            Log::info('Calendar event push notification sent', [
                'event_id' => $calendarEvent->id,
                'action' => $action,
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send calendar event push notification', [
                'error' => $e->getMessage(),
                'event_id' => $event->event->id ?? null,
            ]);
        }
    }
}
