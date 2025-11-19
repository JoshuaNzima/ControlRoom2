<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicIntake extends Model
{
    protected $fillable = [
        'type',
        'name',
        'email',
        'phone',
        'client_name',
        'client_site',
        'title',
        'category',
        'priority',
        'description',
        'attachments',
        'status',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'attachments' => 'array',
    ];
}
