<?php

namespace App\Models\Training;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TraineeTrainer extends Model
{
    use HasFactory;

    protected $table = 'training_trainee_trainers';

    protected $fillable = [
        'trainee_id',
        'trainer_id',
        'is_primary',
        'assigned_by',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function trainee(): BelongsTo
    {
        return $this->belongsTo(Trainee::class, 'trainee_id');
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
