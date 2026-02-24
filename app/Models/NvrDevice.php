<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class NvrDevice extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'client_site_id',
        'device_type',
        'brand',
        'model',
        'public_protocol',
        'public_host',
        'public_port',
        'public_path',
        'local_ip',
        'local_port',
        'username',
        'password',
        'api_key',
        'status',
        'last_online_at',
        'last_sync_at',
        'channel_count',
        'active_channels',
        'settings',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'public_port' => 'integer',
        'local_port' => 'integer',
        'channel_count' => 'integer',
        'active_channels' => 'integer',
        'nvr_channel' => 'integer',
        'last_online_at' => 'datetime',
        'last_sync_at' => 'datetime',
        'settings' => 'array',
    ];

    protected $hidden = [
        'password',
        'api_key',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class, 'client_site_id');
    }

    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class, 'nvr_device_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getStreamBaseUrl(): ?string
    {
        if (empty($this->public_host)) {
            return null;
        }

        $protocol = $this->public_protocol ?: 'http';
        $portPart = $this->public_port ? ':' . $this->public_port : '';
        
        return $protocol . '://' . $this->public_host . $portPart;
    }

    public function getApiBaseUrl(): ?string
    {
        $base = $this->getStreamBaseUrl();
        if (!$base) {
            return null;
        }

        $path = $this->public_path ?: '';
        if ($path && !str_starts_with($path, '/')) {
            $path = '/' . $path;
        }

        return $base . $path;
    }

    public function isOnline(): bool
    {
        return $this->status === 'online';
    }

    public function buildChannelStreamUrl(int $channel, string $streamType = 'hls'): ?string
    {
        $base = $this->getStreamBaseUrl();
        if (!$base) {
            return null;
        }

        // Brand-specific URL patterns
        $brand = strtolower($this->brand ?: '');

        return match ($brand) {
            'hikvision' => $this->buildHikvisionUrl($channel, $streamType),
            'dahua' => $this->buildDahuaUrl($channel, $streamType),
            'cpplus', 'cp plus' => $this->buildCpPlusUrl($channel, $streamType),
            'uniview', 'unv' => $this->buildUniviewUrl($channel, $streamType),
            default => $this->buildGenericUrl($channel, $streamType),
        };
    }

    private function buildHikvisionUrl(int $channel, string $streamType): string
    {
        $base = $this->getStreamBaseUrl();
        $stream = $streamType === 'hls' ? 'hls' : 'streaming';
        return "{$base}/ISAPI/Streaming/channels/{$channel}01/{$stream}";
    }

    private function buildDahuaUrl(int $channel, string $streamType): string
    {
        $base = $this->getStreamBaseUrl();
        if ($streamType === 'hls') {
            return "{$base}/cgi-bin/mjpg/video.cgi?channel={$channel}&subtype=0";
        }
        return "{$base}/rtsp://user:pass@host:port/cam/realmonitor?channel={$channel}&subtype=0";
    }

    private function buildCpPlusUrl(int $channel, string $streamType): string
    {
        $base = $this->getStreamBaseUrl();
        return "{$base}/live/ch{$channel}";
    }

    private function buildUniviewUrl(int $channel, string $streamType): string
    {
        $base = $this->getStreamBaseUrl();
        return "{$base}/video/stream{$channel}";
    }

    private function buildGenericUrl(int $channel, string $streamType): string
    {
        $base = $this->getStreamBaseUrl();
        return "{$base}/channel/{$channel}/stream";
    }
}
