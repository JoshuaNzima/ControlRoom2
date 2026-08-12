<?php

namespace App\Listeners;

use App\Events\GPSMismatchAlert;
use App\Models\User;
use App\Notifications\GenericDbNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class GPSMismatchNotificationListener
{
    /**
     * Handle the GPS mismatch alert event.
     */
    public function handle(GPSMismatchAlert $event): void
    {
        try {
            // Get user who triggered the mismatch
            $user = User::find($event->userId);
            $userName = $user?->name ?? 'Unknown User';

            // Determine severity based on escalation status
            $severity = $event->escalated ? 'high' : 'medium';
            $title = $event->escalated
                ? "🚨 Escalated GPS Alert - {$event->siteName}"
                : "GPS Mismatch - {$event->siteName}";

            $message = $event->escalated
                ? "User {$userName} has failed GPS verification {$event->mismatchCount} times at {$event->siteName} within {$event->windowMinutes} minutes."
                : "User {$userName} failed GPS verification at {$event->siteName}. Distance: " . round($event->distance ?? 0, 0) . "m";

            // Get control room operators and admins to notify
            $recipients = User::role([
                'control_room_operator',
                'operations_officer',
                'admin',
                'super_admin',
            ])->get();

            if ($recipients->isEmpty()) {
                Log::warning('GPSMismatchNotificationListener: No recipients found for GPS mismatch alert', [
                    'user_id' => $event->userId,
                    'site_id' => $event->siteId,
                ]);
                return;
            }

            // Send database notification to control room operators
            Notification::send($recipients, new GenericDbNotification([
                'title' => $title,
                'message' => $message,
                'url' => route('control-room.dashboard'),
                'severity' => $severity,
                'meta' => [
                    'user_id' => $event->userId,
                    'site_id' => $event->siteId,
                    'distance_meters' => $event->distance,
                    'mismatch_count' => $event->mismatchCount,
                    'escalated' => $event->escalated,
                    'event_type' => 'gps_mismatch',
                ],
            ]));

            // Log the notification
            Log::info('GPSMismatchNotificationListener: Notifications sent', [
                'recipients_count' => $recipients->count(),
                'user_id' => $event->userId,
                'site_id' => $event->siteId,
                'escalated' => $event->escalated,
                'mismatch_count' => $event->mismatchCount,
            ]);

            // Also send notification to the user who triggered it (so they know it failed)
            if ($user && $event->escalated) {
                $user->notify(new GenericDbNotification([
                    'title' => 'GPS Verification Failed',
                    'message' => "Your scan at {$event->siteName} could not be verified due to GPS location mismatch. Please ensure you are at the correct location.",
                    'url' => route('supervisor.dashboard'),
                    'severity' => 'warning',
                ]));
            }
        } catch (\Throwable $e) {
            Log::error('GPSMismatchNotificationListener: Error handling GPS mismatch alert', [
                'error' => $e->getMessage(),
                'user_id' => $event->userId,
                'site_id' => $event->siteId,
            ]);
        }
    }
}
