<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'type',
        'content',
        'metadata',
        'status'
    ];

    protected $casts = [
        'metadata' => 'json',
    ];

    const TYPES = ['text', 'location', 'status_update', 'emergency', 'image', 'file'];
    const STATUSES = ['sent', 'delivered', 'read', 'failed'];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function readBy()
    {
        return $this->belongsToMany(User::class, 'message_reads')
            ->withTimestamps();
    }

    public function markAsRead(User $user)
    {
        if (!$this->readBy()->where('user_id', $user->id)->exists()) {
            $this->readBy()->attach($user->id);
            $this->update(['status' => 'read']);
        }
    }

    public function isLocation()
    {
        return $this->type === 'location';
    }

    public function isEmergency()
    {
        return $this->type === 'emergency';
    }

    public function getLocationData()
    {
        if (!$this->isLocation()) {
            return null;
        }

        return $this->metadata['location'] ?? null;
    }
}