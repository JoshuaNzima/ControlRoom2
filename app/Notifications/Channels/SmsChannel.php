<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

class SmsChannel
{
    public function send($notifiable, Notification $notification): void
    {
        if (!Config::get('services.sms.enabled')) {
            return;
        }
        $message = method_exists($notification, 'toSms')
            ? $notification->toSms($notifiable)
            : null;
        if (!$message) {
            return;
        }

        $to = null;
        if (method_exists($notifiable, 'routeNotificationForSms')) {
            $to = $notifiable->routeNotificationForSms($notification);
        }
        if (!$to && isset($notifiable->phone)) {
            $to = $notifiable->phone;
        }
        if (!$to) {
            return;
        }

        $providers = Config::get('services.sms.providers', ['twilio']);
        foreach ($providers as $provider) {
            try {
                if ($provider === 'twilio') {
                    $this->sendViaTwilio($to, $message);
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
        if ($forcePlus && $digits[0] !== '+') {
            $digits = '+'.$digits;
        }
        return $digits;
    }

    protected function sendViaTwilio(string $to, string $text): void
    {
        $sid = Config::get('services.sms.twilio.sid');
        $token = Config::get('services.sms.twilio.token');
        $from = Config::get('services.sms.twilio.from');
        if (!$sid || !$token || !$from) return;

        $toE164 = $this->normalizeE164($to, true);
        if ($toE164 === '') return;

        Http::asForm()->withBasicAuth($sid, $token)->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
            'To' => $toE164,
            'From' => $from,
            'Body' => $text,
        ]);
    }
}
