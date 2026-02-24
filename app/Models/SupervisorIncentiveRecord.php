<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;
use App\Models\User;

class SupervisorIncentiveRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'guard_id',
        'period_start',
        'period_end',
        'base_amount',
        'performance_bonus',
        'guards_count',
        'per_guard_total',
        'absences_count',
        'absence_deductions',
        'uncovered_sites_count',
        'uncovered_site_deductions',
        'total_deductions',
        'net_amount',
        'status',
        'notes',
        'calculated_by',
        'calculated_at',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'base_amount' => 'decimal:2',
        'performance_bonus' => 'decimal:2',
        'per_guard_total' => 'decimal:2',
        'absence_deductions' => 'decimal:2',
        'uncovered_site_deductions' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'calculated_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function calculator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
