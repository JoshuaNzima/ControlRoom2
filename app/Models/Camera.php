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
        'source_type',
        'nvr_device_id',
        'nvr_channel',
        'stream_url',
        'stream_type',
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
        'nvr_channel' => 'integer',
        'last_online' => 'datetime',
        'last_connection_test' => 'datetime',
        'last_restart' => 'datetime',
    ];

	public function site(): BelongsTo
	{
		return $this->belongsTo(ClientSite::class, 'client_site_id');
	}

    public function nvrDevice(): BelongsTo
    {
        return $this->belongsTo(NvrDevice::class, 'nvr_device_id');
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

    public function isNvrCamera(): bool
    {
        return $this->source_type === 'nvr' || $this->source_type === 'dvr';
    }

    public function resolveStreamUrl(): ?string
    {
        if ($this->stream_url) {
            return $this->stream_url;
        }

        if ($this->isNvrCamera() && $this->nvrDevice && $this->nvr_channel) {
            return $this->nvrDevice->buildChannelStreamUrl($this->nvr_channel, $this->stream_type ?? 'hls');
        }

        return null;
    }
}