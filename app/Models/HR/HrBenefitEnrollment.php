<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;
use App\Models\User;

class HrBenefitEnrollment extends Model
{
    use HasFactory;

    protected $table = 'hr_benefit_enrollments';

    protected $fillable = [
        'hr_benefit_id', 'guard_id', 'status', 'start_date', 'end_date', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function benefit(): BelongsTo
    {
        return $this->belongsTo(HrBenefit::class, 'hr_benefit_id');
    }

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
