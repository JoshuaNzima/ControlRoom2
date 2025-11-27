<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;

class GuardGrade extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'base_salary',
        'overtime_multiplier',
        'allowances',
        'absence_deduction_per_day',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'overtime_multiplier' => 'decimal:2',
        'allowances' => 'array',
        'absence_deduction_per_day' => 'decimal:2',
    ];
}
