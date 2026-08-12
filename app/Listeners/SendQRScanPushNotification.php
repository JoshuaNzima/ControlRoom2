<?php

namespace App\Listeners;

use App\Events\QRScanned;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendQRScanPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(QRScanned $event): void
    {
        try {
            $data = $event->data;
            
            // Notify control room operators about QR scan
            $users = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'super_admin', 'control_room_operator', 'zone_commander']);
            })->get();

            if ($users->isEmpty()) {
                return;
            }

            $pushService = new PushNotificationService();
            
            $payload = PushNotificationService::createPayload(
                'QR Code Scanned',
                $event->message,
                null,
                route('control-room.dashboard'),
                'qr-scan-' . ($data['scan_id'] ?? now()->timestamp),
                [
                    'type' => 'qr_scan',
                    'scan_id' => $data['scan_id'] ?? null,
                    'guard_id' => $data['guard_id'] ?? null,
                    'site_id' => $data['site_id'] ?? null,
                    'supervisor_id' => $event->supervisorId,
                ]
            );

            $result = $pushService->sendToUsers($users, $payload);

            Log::info('QR scan push notification sent', [
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send QR scan push notification', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
