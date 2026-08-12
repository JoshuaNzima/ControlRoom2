<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleDispatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'driver_id',
        'origin_site_id',
        'destination_site_id',
        'odometer_out',
        'odometer_in',
        'fuel_level_out',
        'fuel_level_in',
        'status',
        'dispatched_at',
        'returned_at',
        'purpose',
        'notes_out',
        'notes_in',
        'created_by',
    ];

    protected $casts = [
        'dispatched_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\Guard::class, 'driver_id');
    }

    public function originSite(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\ClientSite::class, 'origin_site_id');
    }

    public function destinationSite(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\ClientSite::class, 'destination_site_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
