<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AgentStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $agent
    ) {}

    public function broadcastOn()
    {
        return new PrivateChannel('agent-statuses');
    }

    public function broadcastWith()
    {
        return [
            'agent' => [
                'id' => $this->agent->id,
                'name' => $this->agent->name,
                'status' => $this->agent->agentStatus?->status ?? 'offline',
                'location' => $this->agent->agentStatus?->location,
                'last_seen' => $this->agent->agentStatus?->updated_at,
            ],
        ];
    }
}