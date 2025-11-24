<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSubmission extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'subject',
        'message',
        'service_interest',
        'budget',
        'timeline',
        'status',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getServiceInterestLabelAttribute(): string
    {
        return match($this->service_interest) {
            'security_guards' => 'Security Guards',
            'cctv_surveillance' => 'CCTV Surveillance',
            'mobile_patrol' => 'Mobile Patrol',
            'event_security' => 'Event Security',
            'consultation' => 'Security Consultation',
            'integrated_systems' => 'Integrated Security Systems',
            'general' => 'General Inquiry',
            default => 'Unknown',
        };
    }

    public function getBudgetLabelAttribute(): string
    {
        return match($this->budget) {
            'under_5k' => 'Under $5,000/month',
            '5k_10k' => '$5,000 - $10,000/month',
            '10k_25k' => '$10,000 - $25,000/month',
            '25k_50k' => '$25,000 - $50,000/month',
            'over_50k' => 'Over $50,000/month',
            'discuss' => 'Let\\'s discuss budget',
            default => 'Not specified',
        };
    }

    public function getTimelineLabelAttribute(): string
    {
        return match($this->timeline) {
            'asap' => 'ASAP',
            '1_month' => 'Within 1 month',
            '3_months' => 'Within 3 months',
            '6_months' => 'Within 6 months',
            'planning' => 'Just planning',
            default => 'Not specified',
        };
    }
}
