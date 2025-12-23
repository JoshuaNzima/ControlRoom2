<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrSalaryBand extends Model
{
    use HasFactory;

    protected $table = 'hr_salary_bands';

    protected $fillable = [
        'code', 'title', 'min_amount', 'mid_amount', 'max_amount', 'currency', 'active',
    ];

    protected $casts = [
        'min_amount' => 'decimal:2',
        'mid_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function changes(): HasMany
    {
        return $this->hasMany(HrCompChange::class, 'hr_salary_band_id');
    }
}
