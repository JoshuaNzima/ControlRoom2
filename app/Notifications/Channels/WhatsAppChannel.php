<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

class WhatsAppChannel
{
    public function send($notifiable, Notification $notification): void
    {
        if (!Config::get('services.whatsapp.enabled')) {
            return;
        }

        $message = method_exists($notification, 'toWhatsApp')
            ? $notification->toWhatsApp($notifiable)
            : null;
        if (!$message) {
            return;
        }
        $text = is_array($message) ? ($message['text'] ?? null) : (string) $message;
        if (!$text) {
            return;
        }

        $to = null;
        if (method_exists($notifiable, 'routeNotificationForWhatsApp')) {
            $to = $notifiable->routeNotificationForWhatsApp($notification);
        }
        if (!$to && isset($notifiable->phone)) {
            $to = $notifiable->phone;
        }
        if (!$to) {
            return;
        }

        $providers = Config::get('services.whatsapp.providers', ['meta']);
        foreach ($providers as $provider) {
            try {
                if ($provider === 'meta') {
                    $this->sendViaMeta($to, $text);
                } elseif ($provider === 'twilio') {
                    $this->sendViaTwilio($to, $text);
                }
            } catch (\Throwable $e) {
                // swallow provider errors to avoid breaking other channels
            }
        }
    }

    protected function normalizeE164(string $number, bool $forcePlus = true): string
    {
        $digits = preg_replace('/[^0-9+]/', '', (string) $number) ?? '';
        if ($digits === '') return '';
        // Ensure leading +
        if ($forcePlus && $digits[0] !== '+') {
            $digits = '+'.$digits;
        }
        return $digits;
    }

    protected function sendViaMeta(string $to, string $text): void
    {
        $token = Config::get('services.whatsapp.meta.token');
        $phoneNumberId = Config::get('services.whatsapp.meta.phone_number_id');
        $apiVersion = Config::get('services.whatsapp.meta.api_version', 'v20.0');
        if (!$token || !$phoneNumberId) return;
        $toE164 = $this->normalizeE164($to, true);
        if ($toE164 === '') return;

        Http::withToken($token)->post("https://graph.facebook.com/{$apiVersion}/{$phoneNumberId}/messages", [
            'messaging_product' => 'whatsapp',
            'to' => $toE164,
            'type' => 'text',
            'text' => ['body' => $text],
        ]);
    }

    protected function sendViaTwilio(string $to, string $text): void
    {
        $sid = Config::get('services.whatsapp.twilio.sid');
        $token = Config::get('services.whatsapp.twilio.token');
        $from = Config::get('services.whatsapp.twilio.from', 'whatsapp:+14155238886');
        if (!$sid || !$token || !$from) return;

        $toFormatted = str_starts_with($to, 'whatsapp:') ? $to : ('whatsapp:'.$this->normalizeE164($to, true));
        Http::asForm()->withBasicAuth($sid, $token)->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
            'To' => $toFormatted,
            'From' => $from,
            'Body' => $text,
        ]);
    }
}
