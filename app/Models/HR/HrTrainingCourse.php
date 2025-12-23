<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrTrainingCourse extends Model
{
    use HasFactory;

    protected $table = 'hr_training_courses';

    protected $fillable = [
        'title', 'code', 'category', 'active', 'description', 'created_by',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function sessions(): HasMany
    {
        return $this->hasMany(HrTrainingSession::class, 'hr_training_course_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(HrTrainingEnrollment::class, 'hr_training_course_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
