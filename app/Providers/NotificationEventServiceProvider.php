<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Notifications\DatabaseNotification as DBNotification;
use App\Jobs\SendNotificationEmail;

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
                    if (!$email) return;
                    $data = is_array($n->data) ? $n->data : [];
                    $subject = (string) ($data['title'] ?? 'Notification');
                    $app = config('app.name', 'ControlRoom');
                    if ($app && stripos($subject, $app) !== 0) {
                        $subject = $app.': '.$subject;
                    }
                    $body = (string) ($data['message'] ?? json_encode($data));
                    SendNotificationEmail::dispatch($email, $subject, $body)->onQueue('mail');
                } catch (\Throwable $e) {
                    // swallow
                }
            });
        } catch (\Throwable $e) {
            // swallow
        }
    }
}
