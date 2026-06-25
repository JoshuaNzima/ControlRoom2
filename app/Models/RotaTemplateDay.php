<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RotaTemplateDay extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'rota_template_id',
        'weekday',
        'is_off',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_off' => 'boolean',
        'weekday' => 'integer',
    ];

    /**
     * The template this day belongs to.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(RotaTemplate::class);
    }
}
