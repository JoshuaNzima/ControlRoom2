<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'status',
        'contract_start_date',
        'contract_end_date',
        'monthly_rate',
        'notes',
    ];

    protected $casts = [
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'monthly_rate' => 'decimal:2',
    ];

    public function sites(): HasMany
    {
        return $this->hasMany(ClientSite::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Returns the client's monthly due amount.
     * Placeholder: integrate with Finance contract terms when available.
     */
    public function getMonthlyDueAmount(): float
    {
        return (float) ($this->monthly_rate ?? 0);
    }
}