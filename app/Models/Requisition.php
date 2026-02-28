<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Requisition extends Model
{
    use HasFactory;

    protected $fillable = [
        'requested_by',
        'approved_by',
        'disbursed_by',
        'title',
        'category',
        'description',
        'amount',
        'status',
        'needed_by',
        'notes_admin',
        'notes_disbursement',
        'batch_id',
        'batched_at',
    ];

    protected $casts = [
        'needed_by' => 'date',
        'amount' => 'decimal:2',
        'batched_at' => 'datetime',
    ];

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function disbursedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(RequisitionBatch::class, 'batch_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(RequisitionAttachment::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RequisitionItem::class);
    }
}
