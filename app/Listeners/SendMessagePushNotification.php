<?php

namespace App\Listeners;

use App\Events\MessageSent;
use App\Services\PushNotificationService;
use App\Models\User;
use App\Models\Communication\Conversation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendMessagePushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(MessageSent $event): void
    {
        try {
            $message = $event->message;
            $sender = $message->sender;
            $conversationId = $message->conversation_id;
            
            // Get conversation participants
            $conversation = Conversation::find($conversationId);
            
            if (!$conversation) {
                return;
            }
            
            // Get all participants except sender
            $participantIds = $conversation->participants()->where('user_id', '!=', $sender?->id)->pluck('user_id');
            $users = User::whereIn('id', $participantIds)->get();

            if ($users->isEmpty()) {
                return;
            }

            $pushService = new PushNotificationService();
            
            $title = 'New Message';
            $body = "{$sender?->name}: " . \Str::limit($message->content, 50);
            
            $payload = PushNotificationService::createPayload(
                $title,
                $body,
                null,
                route('messages.conversations.show', $conversationId),
                'message-' . $conversationId,
                [
                    'type' => 'message',
                    'message_id' => $message->id,
                    'conversation_id' => $conversationId,
                    'sender_id' => $sender?->id,
                    'sender_name' => $sender?->name,
                ]
            );

            $result = $pushService->sendToUsers($users, $payload);

            Log::info('Message push notification sent', [
                'message_id' => $message->id,
                'conversation_id' => $conversationId,
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send message push notification', [
                'error' => $e->getMessage(),
                'message_id' => $event->message->id ?? null,
            ]);
        }
    }
}
