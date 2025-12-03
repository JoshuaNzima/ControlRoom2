<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobPosting extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'location',
        'type',
        'status',
        'apply_email',
        'description',
        'requirements',
        'posted_at',
        'created_by',
    ];

    protected $casts = [
        'posted_at' => 'datetime',
    ];
}
