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
        'review_date',
        'category',
        'priority',
        'location',
        'incident_date',
        'witnesses',
        'evidence_type',
        'evidence_path',
        'site_id',
        'shift_id',
        'supervisor_id',
        'resolution_type',
        'action_taken',
        'repeat_occurrence',
        'last_occurred_at'
    ];

    protected $casts = [
        'review_date' => 'datetime',
        'incident_date' => 'datetime',
        'last_occurred_at' => 'datetime',
        'meta' => 'array',
        'witnesses' => 'array'
    ];

    const STATUSES = ['pending_review', 'under_review', 'resolved', 'dismissed'];
    
    const CATEGORIES = [
        'misconduct' => 'Misconduct',
        'performance' => 'Performance Issues',
        'attendance' => 'Attendance Problems',
        'safety' => 'Safety Violations',
        'other' => 'Other Issues'
    ];

    const PRIORITIES = [
        'low' => 'Low Priority',
        'medium' => 'Medium Priority',
        'high' => 'High Priority',
        'critical' => 'Critical Priority'
    ];

    const RESOLUTION_TYPES = [
        'warning' => 'Verbal/Written Warning',
        'suspension' => 'Temporary Suspension',
        'probation' => 'Probationary Period',
        'training' => 'Additional Training Required',
        'termination' => 'Contract Termination',
        'other' => 'Other Resolution'
    ];

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

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function site()
    {
        return $this->belongsTo(\App\Models\ClientSite::class, 'site_id');
    }

    public function shift()
    {
        return $this->belongsTo(\App\Models\Shift::class, 'shift_id');
    }

    public function relatedFlags()
    {
        return $this->newQuery()
            ->where('flaggable_type', $this->flaggable_type)
            ->where('flaggable_id', $this->flaggable_id)
            ->where('id', '!=', $this->id)
            ->latest();
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopePriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopePendingReview($query)
    {
        return $query->where('status', 'pending_review');
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeByGuard($query, $guardId)
    {
        return $query->where('flaggable_type', 'App\\Models\\Guards\\Guard')
            ->where('flaggable_id', $guardId);
    }

    public function scopeBySite($query, $siteId)
    {
        return $query->where('site_id', $siteId);
    }

    public function scopeCritical($query)
    {
        return $query->where('priority', 'critical');
    }

    public function getIsRepeatOffenderAttribute(): bool
    {
        return $this->repeat_occurrence > 0;
    }

    public function getRequiresImmediateActionAttribute(): bool
    {
        return $this->priority === 'critical' || $this->repeat_occurrence > 2;
    }

    protected static function booted()
    {
        static::creating(function ($flag) {
            // Check for previous occurrences
            $previousCount = static::where('flaggable_type', $flag->flaggable_type)
                ->where('flaggable_id', $flag->flaggable_id)
                ->where('category', $flag->category)
                ->count();

            $flag->repeat_occurrence = $previousCount;
            
            if ($previousCount > 0) {
                $flag->last_occurred_at = static::where('flaggable_type', $flag->flaggable_type)
                    ->where('flaggable_id', $flag->flaggable_id)
                    ->where('category', $flag->category)
                    ->latest()
                    ->first()
                    ->created_at;
            }

            // Set incident date if not provided
            if (!$flag->incident_date) {
                $flag->incident_date = now();
            }
        });
    }
}