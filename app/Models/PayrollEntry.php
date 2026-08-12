<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollEntry extends Model
{
    protected $fillable = [
        'payroll_run_id',
        'payee_type',
        'payee_id',
        'base_amount',
        'allowances',
        'deductions',
        'gross',
        'net',
        'notes',
    ];

    protected $casts = [
        'base_amount' => 'decimal:2',
        'gross' => 'decimal:2',
        'net' => 'decimal:2',
        'allowances' => 'array',
        'deductions' => 'array',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }
}
