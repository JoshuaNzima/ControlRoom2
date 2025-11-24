<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'position',
        'department',
        'status',
        'hired_at',
        'notes',
    ];

    protected $casts = [
        'hired_at' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
