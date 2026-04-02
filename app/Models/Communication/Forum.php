<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Forum extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'type',
        'category',
        'created_by',
        'color',
        'icon',
        'is_archived',
        'archived_at',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
    ];

    const TYPES = ['public', 'private', 'announcement'];
    const CATEGORIES = ['general', 'department', 'project', 'emergency', 'social'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'forum_members')
            ->withPivot(['role', 'joined_at', 'last_read_at', 'notifications_enabled'])
            ->withTimestamps();
    }

    public function threads()
    {
        return $this->hasMany(ForumThread::class);
    }

    public function getMember(User $user)
    {
        return $this->members()->where('user_id', $user->id)->first();
    }

    public function isMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    public function isAdmin(User $user): bool
    {
        $member = $this->getMember($user);
        return $member && in_array($member->pivot->role, ['admin', 'moderator']);
    }

    public function unreadCountFor(User $user): int
    {
        $member = $this->getMember($user);
        if (!$member) return 0;

        $lastRead = $member->pivot->last_read_at;

        $query = $this->threads()
            ->whereHas('replies', function ($q) use ($user, $lastRead) {
                $q->where('user_id', '!=', $user->id);
                if ($lastRead) {
                    $q->where('created_at', '>', $lastRead);
                }
            });

        return $query->count();
    }

    public function markAsRead(User $user)
    {
        $this->members()->updateExistingPivot($user->id, [
            'last_read_at' => now()
        ]);
    }

    public function scopeActive($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopePublic($query)
    {
        return $query->where('type', 'public');
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }
}
