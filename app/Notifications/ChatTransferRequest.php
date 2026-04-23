<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\ChatSession;

class ChatTransferRequest extends Notification implements ShouldQueue
{
    use Queueable;

    protected ChatSession $session;
    protected ?string $reason;

    public function __construct(ChatSession $session, ?string $reason = null)
    {
        $this->session = $session;
        $this->reason = $reason;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'chat_transfer_request',
            'session_id' => $this->session->session_id,
            'user_id' => $this->session->user_id,
            'user_name' => $this->session->user?->name ?? 'Anonymous',
            'context' => $this->session->context,
            'reason' => $this->reason,
            'message_count' => $this->session->messages()->count(),
            'created_at' => $this->session->created_at->toISOString(),
        ];
    }

    public function toDatabase($notifiable): array
    {
        return $this->toArray($notifiable);
    }
}
