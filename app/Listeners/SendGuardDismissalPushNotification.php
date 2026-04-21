<?php

namespace App\Listeners;

use App\Events\GuardDismissed;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendGuardDismissalPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(GuardDismissed $event): void
    {
        try {
            $guard = $event->guard;
            
            // Notify admins, HR, and supervisors about guard dismissal
            $users = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'super_admin', 'hr_manager', 'hr', 'supervisor', 'zone_commander']);
            })->get();

            if ($users->isEmpty()) {
                return;
            }

            $pushService = new PushNotificationService();
            
            $title = 'Guard Dismissed';
            $body = "{$guard->full_name} has been dismissed. Reason: {$event->reason}";
            
            $payload = PushNotificationService::createPayload(
                $title,
                $body,
                null,
                route('admin.guards.index'),
                'guard-dismissal-' . $guard->id,
                [
                    'type' => 'guard_dismissal',
                    'guard_id' => $guard->id,
                    'guard_name' => $guard->full_name ?? $guard->name,
                    'reason' => $event->reason,
                    'site_id' => $guard->site_id,
                ]
            );

            $payload['requireInteraction'] = true;

            $result = $pushService->sendToUsers($users, $payload);

            Log::info('Guard dismissal push notification sent', [
                'guard_id' => $guard->id,
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send guard dismissal push notification', [
                'error' => $e->getMessage(),
                'guard_id' => $event->guard->id ?? null,
            ]);
        }
    }
}
