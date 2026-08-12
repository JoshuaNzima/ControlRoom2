<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;
use App\Models\User;

class HrDisciplinaryCase extends Model
{
    use HasFactory;

    protected $table = 'hr_disciplinary_cases';

    protected $fillable = [
        'guard_id',
        'case_no',
        'type',
        'status',
        'stage',
        'description',
        'opened_at',
        'closed_at',
        'created_by',
        'outcome_type',
        'outcome',
        'corrective_actions',
        'next_hearing_at',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'next_hearing_at' => 'datetime',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
