<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\TaskComment;
use App\Models\TaskDependency;
use App\Models\TaskTimeEntry;
use App\Models\TaskCategory;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'assigned_to',
        'title',
        'description',
        'module',
        'status',
        'priority',
        'due_date',
        'completed_at',
        'completed_by',
        'completion_notes',
        'metadata',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    public const STATUSES = [
        'pending' => 'Pending',
        'in_progress' => 'In Progress',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
    ];

    public const PRIORITIES = [
        'low' => 'Low',
        'medium' => 'Medium',
        'high' => 'High',
        'urgent' => 'Urgent',
    ];

    public const MODULES = [
        'control_room' => 'Control Room',
        'hr' => 'HR',
        'assets' => 'Assets',
        'requisitions' => 'Requisitions',
        'invoices' => 'Invoices',
        'finance' => 'Finance',
        'training' => 'Training',
        'front_office' => 'Front Office',
        'guards' => 'Guards',
        'shifts' => 'Shifts',
        'general' => 'General',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    public function dependencies(): HasMany
    {
        return $this->hasMany(TaskDependency::class);
    }

    public function dependents(): HasMany
    {
        return $this->hasMany(TaskDependency::class, 'depends_on_task_id');
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TaskTimeEntry::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(TaskCategory::class, 'task_category_task');
    }

    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'in_progress']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'yellow',
            'in_progress' => 'blue',
            'completed' => 'green',
            'cancelled' => 'gray',
            default => 'gray',
        };
    }

    public function getPriorityColorAttribute(): string
    {
        return match ($this->priority) {
            'low' => 'gray',
            'medium' => 'blue',
            'high' => 'orange',
            'urgent' => 'red',
            default => 'gray',
        };
    }

    public function isOverdue(): bool
    {
        if (!$this->due_date || $this->status === 'completed' || $this->status === 'cancelled') {
            return false;
        }
        return $this->due_date->isPast();
    }

    public function markAsCompleted(int $userId, ?string $notes = null): void
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->completed_by = $userId;
        $this->completion_notes = $notes;
        $this->save();
    }
}
