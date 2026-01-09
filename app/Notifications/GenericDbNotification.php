<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Notifications\Channels\WhatsAppChannel;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Notifications\Messages\MailMessage;

class GenericDbNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected array $payload;

    public function __construct(array $payload)
    {
        $this->payload = $payload;
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (!empty($this->payload['mail'])) {
            $channels[] = 'mail';
        }
        if (config('services.whatsapp.enabled')) {
            $channels[] = WhatsAppChannel::class;
        }
        if (config('services.sms.enabled')) {
            $channels[] = SmsChannel::class;
        }
        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return $this->payload;
    }

    public function toWhatsApp(object $notifiable): array|string
    {
        $title = (string)($this->payload['title'] ?? 'Notification');
        $message = (string)($this->payload['message'] ?? '');
        $url = (string)($this->payload['url'] ?? '');
        $body = trim($title . (strlen($message) ? ' - '.$message : '') . (strlen($url) ? "\n".$url : ''));
        return ['text' => $body];
    }

    public function toSms(object $notifiable): string
    {
        $title = (string)($this->payload['title'] ?? 'Notification');
        $message = (string)($this->payload['message'] ?? '');
        $url = (string)($this->payload['url'] ?? '');
        $body = trim($title . (strlen($message) ? ': '.$message : '') . (strlen($url) ? ' '.$url : ''));
        return $body;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $title = (string)($this->payload['title'] ?? 'Notification');
        $message = (string)($this->payload['message'] ?? '');
        $url = (string)($this->payload['url'] ?? '');
        $mail = (new MailMessage)
            ->subject($title)
            ->greeting('Hello ' . ($notifiable->name ?? ''));
        if (strlen($message)) {
            $mail->line($message);
        }
        if (strlen($url)) {
            $mail->action('View', $url);
        }
        return $mail;
    }
}
