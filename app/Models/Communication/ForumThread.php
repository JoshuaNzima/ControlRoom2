<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class ForumThread extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'forum_id',
        'user_id',
        'title',
        'content',
        'type',
        'is_pinned',
        'is_locked',
        'views_count',
        'replies_count',
        'last_reply_at',
        'last_reply_by',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_locked' => 'boolean',
        'views_count' => 'integer',
        'replies_count' => 'integer',
        'last_reply_at' => 'datetime',
    ];

    const TYPES = ['discussion', 'announcement', 'question', 'poll'];

    public function forum()
    {
        return $this->belongsTo(Forum::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lastReplyBy()
    {
        return $this->belongsTo(User::class, 'last_reply_by');
    }

    public function replies()
    {
        return $this->hasMany(ForumReply::class, 'thread_id');
    }

    public function topLevelReplies()
    {
        return $this->replies()->whereNull('parent_id');
    }

    public function incrementViews()
    {
        $this->increment('views_count');
    }

    public function updateReplyStats()
    {
        $lastReply = $this->replies()->latest()->first();
        $this->update([
            'replies_count' => $this->replies()->count(),
            'last_reply_at' => $lastReply?->created_at,
            'last_reply_by' => $lastReply?->user_id,
        ]);
    }

    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    public function scopeUnpinned($query)
    {
        return $query->where('is_pinned', false);
    }

    public function scopeRecent($query)
    {
        return $query->orderByDesc('last_reply_at')->orderByDesc('created_at');
    }
}
