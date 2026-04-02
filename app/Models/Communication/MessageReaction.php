<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class MessageReaction extends Model
{
    protected $fillable = [
        'message_id',
        'user_id',
        'reaction',
    ];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
