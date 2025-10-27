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
        'billing_start_date',
        'contract_start_date',
        'contract_end_date',
        'monthly_rate',
        'notes',
    ];

    protected $casts = [
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'billing_start_date' => 'date',
        'monthly_rate' => 'decimal:2',
    ];

    public function services()
    {
        return $this->belongsToMany(\App\Models\Service::class, 'client_service')
                    ->withPivot('custom_price', 'quantity')
                    ->withTimestamps();
    }

    public function sites(): HasMany
    {
        return $this->hasMany(ClientSite::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(\App\Models\ClientPayment::class);
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
        // If the client has services assigned, sum service prices (allow custom pivot price)
        if ($this->relationLoaded('services') || $this->services()->exists()) {
            $total = 0.0;
            foreach ($this->services as $service) {
                $price = $service->pivot->custom_price ?? $service->monthly_price;
                $quantity = $service->pivot->quantity ?? 1;
                $total += (float) $price * $quantity;
            }
            // Update the monthly_rate property
            $this->monthly_rate = $total;
            return $total;
        }

        return (float) ($this->monthly_rate ?? 0);
    }
}