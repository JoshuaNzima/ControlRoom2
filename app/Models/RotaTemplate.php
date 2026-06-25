<?php

namespace App\Models;

use App\Models\Guards\Guard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RotaTemplate extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'notes',
        'default_shift_type',
    ];

    /**
     * The days defined in this template.
     */
    public function days(): HasMany
    {
        return $this->hasMany(RotaTemplateDay::class);
    }

    /**
     * Guards assigned to this template.
     */
    public function guards(): HasMany
    {
        return $this->hasMany(Guard::class, 'rota_template_id');
    }

    /**
     * Get the off-day status for a specific weekday.
     * Returns true if the given weekday (0=Sun..6=Sat) is an off-day.
     */
    public function isOffDay(int $weekday): bool
    {
        return $this->days()
            ->where('weekday', $weekday)
            ->where('is_off', true)
            ->exists();
    }
}
