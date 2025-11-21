<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'module',
    ];

    protected $casts = [
        'value' => 'array',
    ];
}
