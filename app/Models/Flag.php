<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class Flag extends Model
{
    protected $fillable = [
        'reason',
        'details',
        'status',
        'flaggable_id',
        'flaggable_type',
        'reported_by',
        'reviewed_by',
        'review_notes',
        'review_date'
    ];

    protected $casts = [
        'review_date' => 'datetime',
        'meta' => 'array'
    ];

    const STATUSES = ['pending_review', 'under_review', 'resolved', 'dismissed'];

    public function flaggable()
    {
        return $this->morphTo();
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePendingReview($query)
    {
        return $query->where('status', 'pending_review');
    }
}