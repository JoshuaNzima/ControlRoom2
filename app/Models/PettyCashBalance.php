<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PettyCashBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'current_balance',
        'total_replenished',
        'total_spent',
        'last_replenished_by',
        'last_replenished_at',
    ];

    protected $casts = [
        'current_balance' => 'decimal:2',
        'total_replenished' => 'decimal:2',
        'total_spent' => 'decimal:2',
        'last_replenished_at' => 'datetime',
    ];

    public function lastReplenishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_replenished_by');
    }

    public static function getCurrent(): self
    {
        return self::firstOrCreate([], [
            'current_balance' => 0,
            'total_replenished' => 0,
            'total_spent' => 0,
        ]);
    }

    public function recalculate(): void
    {
        $totalReplenished = PettyCashEntry::replenishments()->approved()->sum('amount');
        $totalSpent = PettyCashEntry::expenses()->approved()->sum('amount');
        
        $this->update([
            'total_replenished' => $totalReplenished,
            'total_spent' => $totalSpent,
            'current_balance' => $totalReplenished - $totalSpent,
        ]);
    }
}
