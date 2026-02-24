<?php

namespace App\Models\Training;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\User;
use Carbon\Carbon;

class Refresher extends Model
{
    use HasFactory;

    protected $table = 'training_refreshers';

    protected $fillable = [
        'title',
        'description',
        'duration_hours',
        'validity_months',
        'status',
        'created_by',
    ];

    protected $casts = [
        'duration_hours' => 'integer',
        'validity_months' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function trainees(): BelongsToMany
    {
        return $this->belongsToMany(Trainee::class, 'training_refresher_trainee', 'refresher_id', 'trainee_id')
            ->withPivot(['completed_at', 'expires_at', 'notes', 'trained_by'])
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function calculateExpiryDate($completedDate): Carbon
    {
        return Carbon::parse($completedDate)->addMonths($this->validity_months);
    }
}
