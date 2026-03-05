<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;
use App\Models\User;

class SupervisorIncentiveDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'balance_id',
        'down_id',
        'deduction_amount',
        'reason',
        'resolution_type',
        'resolved_by',
        'supervisor_id',
        'deducted_at',
        'notes',
    ];

    protected $casts = [
        'deduction_amount' => 'decimal:2',
        'deducted_at' => 'datetime',
    ];

    public function balance(): BelongsTo
    {
        return $this->belongsTo(SupervisorIncentiveBalance::class, 'balance_id');
    }

    public function down(): BelongsTo
    {
        return $this->belongsTo(Down::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'supervisor_id');
    }

    /**
     * Scope for deductions linked to a specific down
     */
    public function scopeForDown($query, $downId)
    {
        return $query->where('down_id', $downId);
    }

    /**
     * Scope for deductions by resolution type
     */
    public function scopeByResolutionType($query, $type)
    {
        return $query->where('resolution_type', $type);
    }

    /**
     * Check if this deduction was for self-resolved issue
     */
    public function isSelfResolved(): bool
    {
        return $this->resolution_type === 'self_resolved';
    }

    /**
     * Check if this deduction was for control room resolved issue
     */
    public function isControlRoomResolved(): bool
    {
        return $this->resolution_type === 'control_room_resolved';
    }
}
