<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ForumReplyVote extends Model
{
    protected $fillable = [
        'reply_id',
        'user_id',
        'type',
    ];

    public function reply()
    {
        return $this->belongsTo(ForumReply::class, 'reply_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
