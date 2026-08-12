<?php

namespace App\Models\HR;

use App\Models\Guards\Guard;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrPensionEnrollment extends Model
{
    use HasFactory;

    protected $table = 'hr_pension_enrollments';

    protected $fillable = [
        'hr_pension_scheme_id',
        'guard_id',
        'start_date',
        'end_date',
        'member_no',
        'status',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function scheme(): BelongsTo
    {
        return $this->belongsTo(HrPensionScheme::class, 'hr_pension_scheme_id');
    }

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'guard_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
