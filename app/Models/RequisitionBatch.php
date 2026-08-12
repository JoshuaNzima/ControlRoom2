<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RequisitionBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_date',
        'compiled_by',
        'status',
        'acknowledged_by',
        'acknowledged_at',
        'total_amount',
        'archived_at',
    ];

    protected $casts = [
        'batch_date' => 'date',
        'acknowledged_at' => 'datetime',
        'total_amount' => 'decimal:2',
        'archived_at' => 'datetime',
    ];

    public function compiledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'compiled_by');
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function requisitions(): HasMany
    {
        return $this->hasMany(Requisition::class, 'batch_id');
    }
}
