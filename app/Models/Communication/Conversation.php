<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use Illuminate\Database\Eloquent\SoftDeletes;

class Conversation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'type',
        'created_by',
        'last_message_at',
        'status'
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'meta' => 'json'
    ];

    const TYPES = ['direct', 'group', 'broadcast'];
    const STATUSES = ['active', 'archived', 'closed'];

    public function participants()
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot('role', 'last_read_at')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function markAsRead(User $user)
    {
        $this->participants()->updateExistingPivot($user->id, [
            'last_read_at' => now()
        ]);
    }

    public function addParticipants($userIds, $role = 'member')
    {
        $participants = collect($userIds)->mapWithKeys(function ($id) use ($role) {
            return [$id => ['role' => $role]];
        });

        return $this->participants()->attach($participants);
    }
}