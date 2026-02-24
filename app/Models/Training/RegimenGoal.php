<?php

namespace App\Models\Training;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegimenGoal extends Model
{
    use HasFactory;

    protected $table = 'training_regimen_goals';

    protected $fillable = [
        'regimen_id',
        'title',
        'description',
        'max_score',
        'weight',
        'sort_order',
    ];

    protected $casts = [
        'max_score' => 'integer',
        'weight' => 'integer',
        'sort_order' => 'integer',
    ];

    public function regimen(): BelongsTo
    {
        return $this->belongsTo(Regimen::class, 'regimen_id');
    }
}
