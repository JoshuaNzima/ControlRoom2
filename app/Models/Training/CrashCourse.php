<?php

namespace App\Models\Training;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\User;

class CrashCourse extends Model
{
    use HasFactory;

    protected $table = 'training_crash_courses';

    protected $fillable = [
        'title',
        'description',
        'duration_hours',
        'status',
        'created_by',
    ];

    protected $casts = [
        'duration_hours' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function trainees(): BelongsToMany
    {
        return $this->belongsToMany(Trainee::class, 'training_crash_course_trainee', 'crash_course_id', 'trainee_id')
            ->withPivot(['enrolled_at', 'completed_at', 'status', 'notes', 'trained_by', 'approval_status', 'rejection_reason', 'approved_by', 'approved_at'])
            ->withTimestamps();
    }
}
