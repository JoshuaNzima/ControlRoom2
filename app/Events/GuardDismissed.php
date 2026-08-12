<?php

namespace App\Events;

use App\Models\Guard;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GuardDismissed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Guard $guard,
        public string $reason,
        public ?int $dismissedBy = null,
        public ?string $notes = null
    ) {}

    public function getData(): array
    {
        return [
            'guard_id' => $this->guard->id,
            'guard_name' => $this->guard->full_name ?? $this->guard->name,
            'reason' => $this->reason,
            'dismissed_by' => $this->dismissedBy,
            'notes' => $this->notes,
            'site_id' => $this->guard->site_id,
            'site_name' => $this->guard->site?->name,
        ];
    }
}
