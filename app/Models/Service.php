<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Service extends Model
{
    protected $fillable = ['name', 'description', 'monthly_price', 'active'];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'client_service')->withPivot('custom_price')->withTimestamps();
    }
}
