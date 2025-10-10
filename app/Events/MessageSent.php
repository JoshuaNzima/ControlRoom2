<?php

namespace App\Events;

use App\Models\Communication\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Message $message
    ) {}

    public function broadcastOn()
    {
        return new PresenceChannel('conversation.' . $this->message->conversation_id);
    }

    public function broadcastWith()
    {
        $sender = $this->message->sender;

        return [
            'message' => [
                'id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'sender_id' => $this->message->sender_id,
                'sender' => [
                    'id' => $sender?->id,
                    'name' => $sender?->name,
                ],
                'content' => $this->message->content,
                'type' => $this->message->type,
                'created_at' => $this->message->created_at,
            ],
        ];
    }
}


