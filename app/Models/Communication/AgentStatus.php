<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class AgentStatus extends Model
{
    protected $fillable = [
        'user_id',
        'status',
        'location',
        'location_updated_at',
        'battery_level',
        'metadata'
    ];

    protected $casts = [
        'location' => 'json',
        'location_updated_at' => 'datetime',
        'metadata' => 'json'
    ];

    const STATUSES = ['available', 'on_duty', 'on_break', 'offline', 'emergency'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function updateLocation($latitude, $longitude, $accuracy = null)
    {
        $this->update([
            'location' => [
                'lat' => $latitude,
                'lng' => $longitude,
                'accuracy' => $accuracy,
            ],
            'location_updated_at' => now(),
        ]);
    }

    public function updateStatus($status, $metadata = [])
    {
        if (!in_array($status, self::STATUSES)) {
            throw new \InvalidArgumentException('Invalid status');
        }

        $this->update([
            'status' => $status,
            'metadata' => array_merge($this->metadata ?? [], $metadata),
        ]);
    }

    public function isAvailable()
    {
        return $this->status === 'available';
    }

    public function isOnDuty()
    {
        return $this->status === 'on_duty';
    }

    public function isEmergency()
    {
        return $this->status === 'emergency';
    }
}