<?php

namespace App\Models\Training;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Regimen extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'training_regimens';

    protected $fillable = [
        'title',
        'track',
        'default_days',
        'description',
        'created_by',
    ];

    protected $casts = [
        'default_days' => 'integer',
    ];

    public function goals(): HasMany
    {
        return $this->hasMany(RegimenGoal::class, 'regimen_id');
    }

    public function trainees(): HasMany
    {
        return $this->hasMany(Trainee::class, 'regimen_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
