<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PettyCashEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'description',
        'category',
        'amount',
        'receipt_number',
        'vendor',
        'type',
        'status',
        'approved_by',
        'approved_at',
        'notes',
        'synced_to_finance',
        'synced_by',
        'synced_at',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'synced_to_finance' => 'boolean',
        'synced_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function syncedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'synced_by');
    }

    public function scopeExpenses($query)
    {
        return $query->where('type', 'expense');
    }

    public function scopeReplenishments($query)
    {
        return $query->where('type', 'replenishment');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeNotSynced($query)
    {
        return $query->where('synced_to_finance', false);
    }

    public static function categories(): array
    {
        return [
            'office_supplies' => 'Office Supplies',
            'transport' => 'Transport/Fuel',
            'refreshments' => 'Refreshments/Meals',
            'maintenance' => 'Maintenance',
            'communication' => 'Communication',
            'other' => 'Other',
        ];
    }

    public function getCategoryLabelAttribute(): string
    {
        return self::categories()[$this->category] ?? $this->category;
    }
}
