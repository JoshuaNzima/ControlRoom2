<?php

namespace App\Listeners;

use App\Events\EmergencyAlert;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendEmergencyPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(EmergencyAlert $event): void
    {
        try {
            $message = $event->message;
            $sender = $message->sender;
            
            // Get all users who should receive emergency alerts
            // This includes admins, super_admins, and zone commanders
            $users = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'super_admin', 'zone_commander']);
            })->where('id', '!=', $sender->id ?? 0)->get();

            if ($users->isEmpty()) {
                return;
            }

            $pushService = new PushNotificationService();
            
            $payload = PushNotificationService::createPayload(
                'EMERGENCY ALERT',
                $message->content ?? 'Emergency alert triggered',
                null,
                route('messages.conversations.show', $message->conversation_id),
                'emergency-' . $message->id,
                [
                    'type' => 'emergency',
                    'message_id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'sender_id' => $sender->id ?? null,
                    'sender_name' => $sender->name ?? 'Unknown',
                ]
            );

            // Set high priority for emergency alerts
            $payload['requireInteraction'] = true;
            $payload['silent'] = false;

            $result = $pushService->sendToUsers($users, $payload);

            Log::info('Emergency push notification sent', [
                'message_id' => $message->id,
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send emergency push notification', [
                'error' => $e->getMessage(),
                'message_id' => $event->message->id ?? null,
            ]);
        }
    }
}
