<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Notifications\DatabaseNotification as DBNotification;
use App\Jobs\SendNotificationEmail;
use App\Services\PushNotificationService;

class NotificationEventServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        try {
            DBNotification::created(function (DBNotification $n) {
                try {
                    $notifiable = $n->notifiable;
                    if (!is_object($notifiable)) return;
                    
                    $email = $notifiable->email ?? null;
                    $data = is_array($n->data) ? $n->data : [];
                    
                    // Send email notification
                    if ($email) {
                        $subject = (string) ($data['title'] ?? 'Notification');
                        $app = config('app.name', 'ControlRoom');
                        if ($app && stripos($subject, $app) !== 0) {
                            $subject = $app.': '.$subject;
                        }
                        $body = (string) ($data['message'] ?? json_encode($data));
                        SendNotificationEmail::dispatch($email, $subject, $body)->onQueue('mail');
                    }
                    
                    // Send push notification
                    if (method_exists($notifiable, 'pushSubscriptions')) {
                        $pushService = new PushNotificationService();
                        
                        $title = (string) ($data['title'] ?? 'Notification');
                        $body = (string) ($data['message'] ?? 'You have a new notification');
                        $url = (string) ($data['url'] ?? config('app.url'));
                        $tag = (string) ($data['tag'] ?? 'notification-' . $n->id);
                        
                        $payload = PushNotificationService::createPayload(
                            $title,
                            $body,
                            null,
                            $url,
                            $tag,
                            $data
                        );
                        
                        $pushService->sendToUser($notifiable, $payload);
                    }
                } catch (\Throwable $e) {
                    \Log::warning('Notification event failed', [
                        'error' => $e->getMessage(),
                        'notification_id' => $n->id ?? null,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            // swallow
        }
    }
}
