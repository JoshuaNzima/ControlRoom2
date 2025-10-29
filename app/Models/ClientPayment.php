<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientPayment extends Model
{
    protected $fillable = [
        'client_id',
        'year',
        'month',
        'paid',
        'amount_due',
        'amount_paid',
        'prepaid_amount',
    ];

    protected $casts = [
        'paid' => 'boolean',
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'prepaid_amount' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\Client::class);
    }
}


