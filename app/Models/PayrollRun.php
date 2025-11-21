<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRun extends Model
{
    protected $fillable = [
        'period_start',
        'period_end',
        'status',
        'gross_total',
        'deductions_total',
        'net_total',
        'created_by',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'gross_total' => 'decimal:2',
        'deductions_total' => 'decimal:2',
        'net_total' => 'decimal:2',
    ];

    public function entries(): HasMany
    {
        return $this->hasMany(PayrollEntry::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
