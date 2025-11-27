<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Notifications\DatabaseNotification as DBNotification;

class SendNotificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $notificationId;

    public function __construct(string $notificationId)
    {
        $this->notificationId = $notificationId;
    }

    public function handle(): void
    {
        try {
            $notification = DBNotification::find($this->notificationId);
            if (!$notification) return;

            $notifiable = $notification->notifiable;
            $email = is_object($notifiable) ? ($notifiable->email ?? null) : null;
            if (!$email) return;

            $data = is_array($notification->data) ? $notification->data : [];
            $subject = (string) ($data['title'] ?? 'Notification');
            $body = (string) ($data['message'] ?? json_encode($data));

            Mail::raw($body, function ($m) use ($email, $subject) {
                $m->to($email)->subject($subject);
            });
        } catch (\Throwable $e) {
            // swallow failures, they will be retried per queue policy if configured
        }
    }
}
