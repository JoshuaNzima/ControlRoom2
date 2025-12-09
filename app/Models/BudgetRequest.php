<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class BudgetRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'amount',
        'needed_by',
        'status',
        'requested_by',
        'approved_by',
        'released_by',
        'notes_admin',
        'notes_release',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'needed_by' => 'date',
    ];

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }
}
