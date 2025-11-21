<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayProfile extends Model
{
    protected $fillable = [
        'payee_type', // 'guard' | 'user'
        'payee_id',
        'monthly_salary',
        'overtime_multiplier',
        'advance_amount',
        'allowances', // json
        'absence_deduction_per_day',
    ];

    protected $casts = [
        'monthly_salary' => 'decimal:2',
        'overtime_multiplier' => 'decimal:2',
        'advance_amount' => 'decimal:2',
        'allowances' => 'array',
        'absence_deduction_per_day' => 'decimal:2',
    ];
}
