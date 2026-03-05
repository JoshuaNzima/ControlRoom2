<?php

namespace App\Models\FrontOffice;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class AssistantAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'assistant_id',
        'assigned_to_id',
        'assignment_type',
        'start_date',
        'end_date',
        'notes',
        'is_primary',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_primary' => 'boolean',
    ];

    /**
     * The assistant (user with assistant role)
     */
    public function assistant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assistant_id');
    }

    /**
     * The user this assistant is assigned to
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    /**
     * Scope for active assignments
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for primary assignments
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope by assignment type
     */
    public function scopeType($query, $type)
    {
        return $query->where('assignment_type', $type);
    }

    /**
     * Check if assignment is for executive support
     */
    public function isExecutive(): bool
    {
        return in_array($this->assignment_type, ['executive', 'both']);
    }

    /**
     * Check if assignment is for personal support
     */
    public function isPersonal(): bool
    {
        return in_array($this->assignment_type, ['personal', 'both']);
    }
}
