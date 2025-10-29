<?php

namespace App\Events;

use App\Models\ScanTag;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScanTagged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $scanTag;

    public function __construct(ScanTag $scanTag)
    {
        $this->scanTag = $scanTag;
    }

    public function broadcastOn(): array
    {
        // Control-room private channel
        return [new PrivateChannel('control-room')];
    }

    public function broadcastWith(): array
    {
        return [
            'scan_tag' => [
                'id' => $this->scanTag->id,
                'tags' => $this->scanTag->tags,
                'created_at' => $this->scanTag->created_at,
                'checkpoint_scan_id' => $this->scanTag->checkpoint_scan_id
            ]
        ];
    }
}
