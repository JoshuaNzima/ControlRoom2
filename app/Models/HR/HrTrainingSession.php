<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrTrainingSession extends Model
{
    use HasFactory;

    protected $table = 'hr_training_sessions';

    protected $fillable = [
        'hr_training_course_id','title','mode','location_or_link','start_at','end_at','capacity','trainer_name','created_by',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(HrTrainingCourse::class, 'hr_training_course_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(HrTrainingEnrollment::class, 'hr_training_session_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
