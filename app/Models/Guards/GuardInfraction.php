<?php

namespace App\Models\Guards;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardInfraction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'guard_id',
        'type',
        'description',
        'severity',
        'incident_date',
        'status',
        'resolution',
        'reported_by',
        'reviewed_by',
        'reviewed_at'
    ];

    protected $casts = [
        'incident_date' => 'datetime',
        'reviewed_at' => 'datetime'
    ];

    public function guardRelation()
    {
        return $this->belongsTo(Guard::class, 'guard_id');
    }

    // legacy alias intentionally removed — use guardRelation() to avoid colliding with Eloquent internals

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}