<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    ];

    protected $casts = [
        'needed_by' => 'date',
        'amount' => 'decimal:2',
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
}
