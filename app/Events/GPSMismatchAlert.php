<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GPSMismatchAlert implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public int $siteId;
    public string $siteName;
    public ?float $userLatitude;
    public ?float $userLongitude;
    public ?float $siteLatitude;
    public ?float $siteLongitude;
    public ?float $distance;
    public int $mismatchCount;
    public int $threshold;
    public int $windowMinutes;
    public bool $escalated;

    public function __construct(
        int $userId,
        int $siteId,
        string $siteName,
        ?float $userLatitude,
        ?float $userLongitude,
        ?float $siteLatitude,
        ?float $siteLongitude,
        ?float $distance,
        int $mismatchCount = 1,
        int $threshold = 3,
        int $windowMinutes = 10,
        bool $escalated = false
    ) {
        $this->userId = $userId;
        $this->siteId = $siteId;
        $this->siteName = $siteName;
        $this->userLatitude = $userLatitude;
        $this->userLongitude = $userLongitude;
        $this->siteLatitude = $siteLatitude;
        $this->siteLongitude = $siteLongitude;
        $this->distance = $distance;
        $this->mismatchCount = $mismatchCount;
        $this->threshold = $threshold;
        $this->windowMinutes = $windowMinutes;
        $this->escalated = $escalated;
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('gps-alerts'),
            new PrivateChannel('user.' . $this->userId),
        ];

        if ($this->escalated) {
            $channels[] = new PrivateChannel('control-room');
            $channels[] = new PrivateChannel('admins');
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'gps.mismatch';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'site_id' => $this->siteId,
            'site_name' => $this->siteName,
            'user_coordinates' => [
                'lat' => $this->userLatitude,
                'lng' => $this->userLongitude,
            ],
            'site_coordinates' => [
                'lat' => $this->siteLatitude,
                'lng' => $this->siteLongitude,
            ],
            'distance_meters' => $this->distance,
            'mismatch_count' => $this->mismatchCount,
            'threshold' => $this->threshold,
            'window_minutes' => $this->windowMinutes,
            'escalated' => $this->escalated,
            'message' => $this->escalated
                ? 'Repeated GPS mismatches detected for this site. Please investigate.'
                : 'GPS verification failed. User attempted scan from invalid location.',
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
