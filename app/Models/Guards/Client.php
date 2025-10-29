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

  
    /**
     * Get the billing start date considering fallbacks.
     */
    public function getEffectiveBillingStartAttribute()
    {
        return $this->billing_start_date ?? $this->contract_start_date ?? $this->created_at;
    }

    /**
     * Calculate payment summary for a given year.
     */
    public function getPaymentSummary(int $year): array
    {
        $currentYear = now()->year;
        $currentMonth = now()->month;
        $limitMonth = $year < $currentYear ? 12 : ($year > $currentYear ? 0 : $currentMonth);

        // Get all payments for the year
        $yearPayments = $this->payments()
            ->where('year', $year)
            ->get(['month', 'paid', 'amount_due', 'amount_paid'])
            ->keyBy('month');

        $unpaidCount = 0;
        $totalDue = 0;
        $totalPaid = 0;

        $startMonth = 1;
        if ($this->effective_billing_start?->year === $year) {
            $startMonth = $this->effective_billing_start->month;
        } elseif ($this->effective_billing_start?->year > $year) {
            $startMonth = 13; // No months to bill this year
        }

        $monthlyRate = $this->getMonthlyDueAmount();

        // Calculate totals for each applicable month
        for ($month = $startMonth; $month <= $limitMonth; $month++) {
            $payment = $yearPayments->get($month);
            $isInBillingWindow = $this->isInBillingWindow($year, $month);
            
            $monthDue = $isInBillingWindow ? ($payment?->amount_due ?? $monthlyRate) : 0;
            $monthPaid = $payment?->amount_paid ?? 0;

            $totalDue += $monthDue;
            $totalPaid += $monthPaid;

            if ($monthDue > 0 && $monthDue > $monthPaid) {
                $unpaidCount++;
            }
        }

        return [
            'total_due' => round($totalDue, 2),
            'total_paid' => round($totalPaid, 2),
            'outstanding_amount' => round($totalDue - $totalPaid, 2),
            'outstanding_months' => $unpaidCount,
            'billing_start' => $this->effective_billing_start?->toDateString(),
            'is_overdue' => $unpaidCount >= 3
        ];
    }

    /**
     * Check if a given year/month falls within the client's billing window.
     */
    protected function isInBillingWindow(int $year, int $month): bool
    {
        $date = now()->setYear($year)->setMonth($month)->startOfMonth();
        
        if ($this->effective_billing_start && $date->lt($this->effective_billing_start->startOfMonth())) {
            return false;
        }

        if ($this->contract_end_date && $date->gt($this->contract_end_date->endOfMonth())) {
            return false;
        }

        return true;
    }

    /**
     * Scope query to clients with overdue payments.
     */
    public function scopeWithOverduePayments($query, int $year)
    {
        return $query->whereHas('payments', function ($query) use ($year) {
            $query->where('year', $year)
                  ->where('month', '<=', now()->year === $year ? now()->month : 12)
                  ->where('paid', false)
                  ->havingRaw('COUNT(*) >= 3')
                  ->groupBy('client_id');
        });
    }

    /**
     * Scope query to filter by payment status.
     */
    public function scopeByPaymentStatus($query, string $status, int $year)
    {
        if ($status === 'all') {
            return $query;
        }

        return $query->whereHas('payments', function ($query) use ($status, $year) {
            $query->where('year', $year)
                  ->where('month', '<=', now()->year === $year ? now()->month : 12)
                  ->where('paid', $status === 'paid');
        });
    }
}
