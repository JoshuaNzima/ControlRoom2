<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrBenefit extends Model
{
    use HasFactory;

    protected $table = 'hr_benefits';

    protected $fillable = [
        'name', 'code', 'category', 'active', 'description', 'start_date', 'end_date',
    ];

    protected $casts = [
        'active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function enrollments(): HasMany
    {
        return $this->hasMany(HrBenefitEnrollment::class, 'hr_benefit_id');
    }
}
