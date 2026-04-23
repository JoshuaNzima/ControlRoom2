<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ChatSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'status',
        'context',
        'metadata',
        'transferred_to',
        'transferred_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'transferred_at' => 'datetime',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_PENDING_TRANSFER = 'pending_transfer';
    const STATUS_TRANSFERRED = 'transferred';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_CLOSED = 'closed';

    public function isPendingTransfer(): bool
    {
        return $this->status === self::STATUS_PENDING_TRANSFER;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'transferred_to');
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isTransferred(): bool
    {
        return $this->status === self::STATUS_TRANSFERRED;
    }

    public function transferTo(User $agent): void
    {
        $this->update([
            'status' => self::STATUS_TRANSFERRED,
            'transferred_to' => $agent->id,
            'transferred_at' => now(),
        ]);
    }

    public function resolve(): void
    {
        $this->update(['status' => self::STATUS_RESOLVED]);
    }

    public function close(): void
    {
        $this->update(['status' => self::STATUS_CLOSED]);
    }

    public static function findOrCreateBySessionId(string $sessionId, ?int $userId = null, string $context = 'general'): self
    {
        return static::firstOrCreate(
            ['session_id' => $sessionId],
            [
                'user_id' => $userId,
                'context' => $context,
            ]
        );
    }
}
