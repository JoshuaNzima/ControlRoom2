<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;

class SupervisorIncentiveProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'guard_id',
        'base_amount',
        'per_guard_amount',
        'absence_deduction',
        'uncovered_site_deduction',
        'calculation_period',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'base_amount' => 'decimal:2',
        'per_guard_amount' => 'decimal:2',
        'absence_deduction' => 'decimal:2',
        'uncovered_site_deduction' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }
}
