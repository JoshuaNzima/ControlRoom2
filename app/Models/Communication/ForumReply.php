<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class ForumReply extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'thread_id',
        'user_id',
        'parent_id',
        'content',
        'upvotes_count',
    ];

    protected $casts = [
        'upvotes_count' => 'integer',
    ];

    public function thread()
    {
        return $this->belongsTo(ForumThread::class, 'thread_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function votes()
    {
        return $this->hasMany(ForumReplyVote::class, 'reply_id');
    }

    public function upvotes()
    {
        return $this->votes()->where('type', 'upvote');
    }

    public function downvotes()
    {
        return $this->votes()->where('type', 'downvote');
    }

    public function isUpvotedBy(User $user): bool
    {
        return $this->votes()->where('user_id', $user->id)->where('type', 'upvote')->exists();
    }

    public function isDownvotedBy(User $user): bool
    {
        return $this->votes()->where('user_id', $user->id)->where('type', 'downvote')->exists();
    }

    public function vote(User $user, string $type)
    {
        $existing = $this->votes()->where('user_id', $user->id)->first();

        if ($existing) {
            if ($existing->type === $type) {
                $existing->delete();
                $this->decrement('upvotes_count', $type === 'upvote' ? 1 : 0);
                return null;
            }
            $existing->update(['type' => $type]);
        } else {
            $this->votes()->create([
                'user_id' => $user->id,
                'type' => $type,
            ]);
        }

        // Recalculate upvotes count
        $upvotes = $this->upvotes()->count();
        $this->update(['upvotes_count' => $upvotes]);

        return $type;
    }

    protected static function booted()
    {
        static::created(function ($reply) {
            $reply->thread->updateReplyStats();
        });

        static::deleted(function ($reply) {
            $reply->thread->updateReplyStats();
        });
    }
}
