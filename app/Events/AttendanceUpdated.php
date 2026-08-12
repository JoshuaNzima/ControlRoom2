<?php

namespace App\Events;

use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $attendanceId;
    public $message;
    public $data;

    /**
     * Create a new event instance.
     */
    public function __construct($attendanceId, $message, $data = [])
    {
        $this->attendanceId = $attendanceId;
        $this->message = $message;
        $this->data = $this->enrichData($attendanceId, $data);
    }

    /**
     * Enrich the broadcast data with guard_name, site_name, client_name.
     */
    protected function enrichData($attendanceId, array $data): array
    {
        // If already has guard_name, skip enrichment
        if (isset($data['guard_name']) && isset($data['site_name'])) {
            return $data;
        }

        $attendance = Attendance::with(['guard', 'clientSite.client'])->find($attendanceId);
        
        if (!$attendance) {
            return $data;
        }

        $guard = $attendance->guard;
        $site = $attendance->clientSite;
        $client = $site?->client;

        return array_merge($data, [
            'id' => $attendance->id,
            'guard_name' => $guard?->name ?? $data['guard_name'] ?? 'Unknown',
            'site_name' => $site?->name ?? $data['site_name'] ?? 'Unknown',
            'client_name' => $client?->name ?? $data['client_name'] ?? '',
            'status' => $attendance->status ?? $data['status'] ?? 'unknown',
            'action' => $data['action'] ?? $attendance->status ?? 'updated',
            'timestamp' => $data['timestamp'] ?? now()->toIso8601String(),
            'time' => $data['time'] ?? now()->toIso8601String(),
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('control-room'),
        ];

        if (!empty($this->data['supervisor_id'])) {
            $channels[] = new PrivateChannel("supervisor.{$this->data['supervisor_id']}");
        }

        return $channels;
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
            'data' => $this->data,
        ];
    }
}
