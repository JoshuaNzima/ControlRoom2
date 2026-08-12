<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FrontOfficeTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'status',
        'priority',
        'due_date',
        'assigned_to',
        'created_by',
        'completed_at',
        'completed_by',
        'completion_notes',
        'time_estimate',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public const CATEGORIES = [
        'front_office' => 'Front Office',
        'executive' => 'Executive',
        'general' => 'General',
        'personal' => 'Personal',
        'ict' => 'ICT',
        'administration' => 'Administration',
        'marketing' => 'Marketing',
        'operations' => 'Operations',
        'accounts' => 'Accounts',
    ];

    public const STATUSES = [
        'pending' => 'Pending',
        'in_progress' => 'In Progress',
        'overdue' => 'Overdue',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
    ];

    public const PRIORITIES = [
        'low' => 'Low',
        'medium' => 'Medium',
        'high' => 'High',
        'urgent' => 'Urgent',
    ];

    public function isOverdue(): bool
    {
        return $this->status !== 'completed' && $this->due_date && $this->due_date->isPast();
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(FrontOfficeTaskComment::class, 'task_id');
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(FrontOfficeTaskTimeEntry::class, 'task_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
