<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;
use App\Models\User;

class HrSafetyIncident extends Model
{
    use HasFactory;

    protected $table = 'hr_safety_incidents';

    protected $fillable = [
        'guard_id', 'site', 'type', 'severity', 'occurred_at', 'status', 'notes', 'created_by',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
