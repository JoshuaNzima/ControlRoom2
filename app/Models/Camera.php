<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Camera extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'client_site_id',
        'stream_url',
        'type',
        'location',
        'ip_address',
        'port',
        'public_protocol',
        'public_host',
        'public_port',
        'public_path',
        'username',
        'password',
        'model',
        'status',
        'last_online',
        'recording_enabled',
        'retention_days',
        'credentials',
        'settings',
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
        'settings' => 'array',
        'last_online' => 'datetime',
        'last_connection_test' => 'datetime',
        'last_restart' => 'datetime',
    ];

	public function site(): BelongsTo
	{
		return $this->belongsTo(ClientSite::class, 'client_site_id');
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