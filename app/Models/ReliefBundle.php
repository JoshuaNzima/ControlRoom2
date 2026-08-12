<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Guards\Guard;
use App\Models\Zone;

class ReliefBundle extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'reliever_guard_id',
        'zone_id',
        'supervisor_id',
        'created_by',
    ];

    public function reliever(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'reliever_guard_id');
    }

    public function sites(): HasMany
    {
        return $this->hasMany(ReliefBundleSite::class)->orderBy('position');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}
