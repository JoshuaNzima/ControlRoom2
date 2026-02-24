<?php

namespace App\Models\Training;

use App\Models\Guards\Guard;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Trainee extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'training_trainees';

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'id_number',
        'date_of_birth',
        'gender',
        'notes',
        'training_track',
        'training_days',
        'training_start_date',
        'training_end_date',
        'status',
        'regimen_id',
        'primary_trainer_id',
        'created_by',
        'decided_at',
        'decided_by',
        'decision_notes',
        'converted_guard_id',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'training_start_date' => 'date',
        'training_end_date' => 'date',
        'training_days' => 'integer',
        'decided_at' => 'datetime',
    ];

    public function regimen(): BelongsTo
    {
        return $this->belongsTo(Regimen::class, 'regimen_id');
    }

    public function trainers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'training_trainee_trainers', 'trainee_id', 'trainer_id')
            ->withPivot(['is_primary', 'assigned_by'])
            ->withTimestamps();
    }

    public function primaryTrainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_trainer_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function convertedGuard(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'converted_guard_id');
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(TraineeAttendance::class, 'trainee_id');
    }

    public function crashCourses(): BelongsToMany
    {
        return $this->belongsToMany(CrashCourse::class, 'training_crash_course_trainee', 'trainee_id', 'crash_course_id')
            ->withPivot(['enrolled_at', 'completed_at', 'status', 'notes', 'trained_by'])
            ->withTimestamps();
    }

    public function refreshers(): BelongsToMany
    {
        return $this->belongsToMany(Refresher::class, 'training_refresher_trainee', 'trainee_id', 'refresher_id')
            ->withPivot(['completed_at', 'expires_at', 'notes', 'trained_by'])
            ->withTimestamps();
    }
}
