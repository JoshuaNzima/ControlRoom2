<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Guards\ClientSite;

class Camera extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'client_site_id',
        'stream_url',
        'type',
        'location',
        'status',
        'last_online',
        'recording_enabled',
        'retention_days',
        'credentials',
        'settings'
    ];

    protected $casts = [
        'last_online' => 'datetime',
        'settings' => 'json',
        'credentials' => 'encrypted',
        'recording_enabled' => 'boolean'
    ];

    const TYPES = ['ptz', 'fixed', 'dome', 'thermal'];
    const STATUSES = ['online', 'offline', 'maintenance', 'disabled'];

    public function site()
    {
        return $this->belongsTo(ClientSite::class, 'client_site_id');
    }

    public function recordings()
    {
        return $this->hasMany(CameraRecording::class);
    }

    public function alerts()
    {
        return $this->hasMany(CameraAlert::class);
    }

    public function getStreamUrlAttribute($value)
    {
        // Add any necessary authentication tokens or parameters
        return $value;
    }

    public function isOnline(): bool
    {
        return $this->status === 'online' && 
               $this->last_online && 
               $this->last_online->diffInMinutes(now()) < 5;
    }
}