<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_session_id',
        'sender_type',
        'sender_id',
        'message',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    const SENDER_USER = 'user';
    const SENDER_ASSISTANT = 'assistant';
    const SENDER_AGENT = 'agent';

    public function session()
    {
        return $this->belongsTo(ChatSession::class, 'chat_session_id');
    }

    public function isFromUser(): bool
    {
        return $this->sender_type === self::SENDER_USER;
    }

    public function isFromAssistant(): bool
    {
        return $this->sender_type === self::SENDER_ASSISTANT;
    }

    public function isFromAgent(): bool
    {
        return $this->sender_type === self::SENDER_AGENT;
    }

    public static function createMessage(ChatSession $session, string $senderType, string $message, ?int $senderId = null, ?array $metadata = null): self
    {
        return static::create([
            'chat_session_id' => $session->id,
            'sender_type' => $senderType,
            'sender_id' => $senderId,
            'message' => $message,
            'metadata' => $metadata,
        ]);
    }
}
