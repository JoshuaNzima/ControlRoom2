<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Camera extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'ip_address',
        'port',
        'username',
        'password',
        'model',
        'status',
        'recording_enabled',
        'motion_detection',
        'night_vision',
        'description',
        'connection_status',
        'last_connection_test',
        'last_restart',
        'created_by',
    ];

    protected $casts = [
        'recording_enabled' => 'boolean',
        'motion_detection' => 'boolean',
        'night_vision' => 'boolean',
        'last_connection_test' => 'datetime',
        'last_restart' => 'datetime',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class, 'site_id');
    }

    public function recordings(): HasMany
    {
        return $this->hasMany(CameraRecording::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(CameraAlert::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}