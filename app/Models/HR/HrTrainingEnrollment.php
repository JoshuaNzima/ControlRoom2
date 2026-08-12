<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrTrainingEnrollment extends Model
{
    use HasFactory;

    protected $table = 'hr_training_enrollments';

    protected $fillable = [
        'hr_training_course_id','hr_training_session_id','guard_id','status','completed_at','created_by',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(HrTrainingCourse::class, 'hr_training_course_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(HrTrainingSession::class, 'hr_training_session_id');
    }

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\Guard::class, 'guard_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
