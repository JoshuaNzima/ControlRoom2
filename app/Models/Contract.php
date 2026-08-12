<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contract extends Model
{
    protected $fillable = [
        'client_id',
        'title',
        'start_date',
        'end_date',
        'value',
        'status',
        'renewal_date',
        'contact_person',
        'contact_email',
        'terms',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'renewal_date' => 'date',
        'value' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Client::class);
    }
}
