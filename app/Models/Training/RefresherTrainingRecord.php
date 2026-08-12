<?php

namespace App\Models\Training;

use App\Models\Guards\Guard;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RefresherTrainingRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'refresher_training_records';

    protected $fillable = [
        'guard_id',
        'refresher_id',
        'trainer_id',
        'training_date',
        'completed_date',
        'status',
        'trainer_notes',
        'dismissal_reason',
        'evaluated_at',
        'evaluated_by',
    ];

    protected $casts = [
        'training_date' => 'date',
        'completed_date' => 'date',
        'evaluated_at' => 'datetime',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'guard_id');
    }

    public function refresher(): BelongsTo
    {
        return $this->belongsTo(Refresher::class, 'refresher_id');
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['completed', 'passed', 'failed', 'dismissed', 'promoted']);
    }

    public function scopeNeedsEvaluation($query)
    {
        return $query->where('status', 'completed');
    }

    public function isPassed(): bool
    {
        return in_array($this->status, ['passed', 'promoted']);
    }

    public function isDismissed(): bool
    {
        return $this->status === 'dismissed' || $this->status === 'failed';
    }
}
