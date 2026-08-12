<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\MessageSentReport;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    protected WebPush $webPush;

    public function __construct()
    {
        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => config('app.url'),
                'publicKey' => config('webpush.vapid.public_key'),
                'privateKey' => config('webpush.vapid.private_key'),
            ],
        ]);
    }

    /**
     * Send notification to a specific user
     */
    public function sendToUser(User $user, array $payload): array
    {
        $subscriptions = $user->pushSubscriptions()
            ->active()
            ->where('device_type', 'web')
            ->get();

        if ($subscriptions->isEmpty()) {
            return ['sent' => 0, 'failed' => 0, 'message' => 'No active subscriptions'];
        }

        return $this->sendToSubscriptions($subscriptions, $payload);
    }

    /**
     * Send notification to multiple users
     */
    public function sendToUsers(iterable $users, array $payload): array
    {
        $userIds = collect($users)->pluck('id')->unique();
        
        $subscriptions = PushSubscription::whereIn('user_id', $userIds)
            ->active()
            ->where('device_type', 'web')
            ->get();

        if ($subscriptions->isEmpty()) {
            return ['sent' => 0, 'failed' => 0, 'message' => 'No active subscriptions'];
        }

        return $this->sendToSubscriptions($subscriptions, $payload);
    }

    /**
     * Send notification to specific subscription IDs
     */
    public function sendToSubscriptionIds(array $subscriptionIds, array $payload): array
    {
        $subscriptions = PushSubscription::whereIn('id', $subscriptionIds)
            ->active()
            ->get();

        if ($subscriptions->isEmpty()) {
            return ['sent' => 0, 'failed' => 0, 'message' => 'No active subscriptions'];
        }

        return $this->sendToSubscriptions($subscriptions, $payload);
    }

    /**
     * Send broadcast notification to all active subscriptions
     */
    public function broadcast(array $payload): array
    {
        $subscriptions = PushSubscription::active()
            ->where('device_type', 'web')
            ->get();

        if ($subscriptions->isEmpty()) {
            return ['sent' => 0, 'failed' => 0, 'message' => 'No active subscriptions'];
        }

        return $this->sendToSubscriptions($subscriptions, $payload);
    }

    /**
     * Send to multiple subscriptions
     */
    protected function sendToSubscriptions(iterable $subscriptions, array $payload): array
    {
        $sent = 0;
        $failed = 0;
        $invalidEndpoints = [];

        foreach ($subscriptions as $subscription) {
            if (!$subscription->isValid()) {
                $subscription->deactivate();
                $failed++;
                continue;
            }

            $webPushSubscription = Subscription::create([
                'endpoint' => $subscription->endpoint,
                'keys' => [
                    'p256dh' => $subscription->p256dh_key,
                    'auth' => $subscription->auth_token,
                ],
            ]);

            $this->webPush->queueNotification(
                $webPushSubscription,
                json_encode($payload)
            );
        }

        // Flush all queued notifications
        foreach ($this->webPush->flush() as $report) {
            /** @var MessageSentReport $report */
            
            if ($report->isSuccess()) {
                $sent++;
            } else {
                $failed++;
                // If endpoint is invalid (410 Gone), mark subscription as inactive
                if ($report->isSubscriptionExpired()) {
                    $endpoint = $report->getEndpoint();
                    $invalidEndpoints[] = $endpoint;
                }
                Log::warning('Push notification failed', [
                    'endpoint' => $report->getEndpoint(),
                    'reason' => $report->getReason(),
                ]);
            }
        }

        // Deactivate expired subscriptions
        if (!empty($invalidEndpoints)) {
            PushSubscription::whereIn('endpoint', $invalidEndpoints)
                ->update(['is_active' => false]);
        }

        return [
            'sent' => $sent,
            'failed' => $failed,
            'message' => "Sent {$sent} notifications, {$failed} failed",
        ];
    }

    /**
     * Create a notification payload
     */
    public static function createPayload(
        string $title,
        string $body,
        ?string $icon = null,
        ?string $url = null,
        ?string $tag = null,
        array $data = []
    ): array {
        return [
            'title' => $title,
            'body' => $body,
            'icon' => $icon ?? asset('images/Coin-logo.png'),
            'badge' => asset('images/badge-72x72.png'),
            'tag' => $tag ?? 'default',
            'data' => array_merge([
                'url' => $url ?? config('app.url'),
                'timestamp' => now()->timestamp,
            ], $data),
            'actions' => [
                ['action' => 'open', 'title' => 'Open'],
                ['action' => 'dismiss', 'title' => 'Dismiss'],
            ],
            'requireInteraction' => true,
            'silent' => false,
        ];
    }

    /**
     * Send incident alert notification
     */
    public function sendIncidentAlert(User $user, array $incident): array
    {
        $payload = self::createPayload(
            'Incident Alert',
            $incident['title'] ?? 'New incident reported',
            null,
            route('incidents.show', $incident['id'] ?? 0),
            'incident-' . ($incident['id'] ?? 0),
            ['type' => 'incident', 'incident_id' => $incident['id'] ?? null]
        );

        return $this->sendToUser($user, $payload);
    }

    /**
     * Send shift reminder notification
     */
    public function sendShiftReminder(User $user, array $shift): array
    {
        $payload = self::createPayload(
            'Shift Reminder',
            "Your shift at {$shift['site_name']} starts in 30 minutes",
            null,
            route('shifts.index'),
            'shift-reminder',
            ['type' => 'shift', 'shift_id' => $shift['id'] ?? null]
        );

        return $this->sendToUser($user, $payload);
    }

    /**
     * Send attendance alert to supervisors
     */
    public function sendAttendanceAlert(array $supervisors, string $guardName, string $siteName): array
    {
        $payload = self::createPayload(
            'Attendance Alert',
            "{$guardName} has not checked in at {$siteName}",
            null,
            route('attendance.index'),
            'attendance-alert',
            ['type' => 'attendance']
        );

        return $this->sendToUsers($supervisors, $payload);
    }
}
