<?php

namespace App\Events;

use App\Models\CalendarEvent;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CalendarEventCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public CalendarEvent $event,
        public string $action = 'created'
    ) {}

    public function getData(): array
    {
        return [
            'event_id' => $this->event->id,
            'title' => $this->event->title,
            'description' => $this->event->description,
            'start_date' => $this->event->start_date?->toDateTimeString(),
            'end_date' => $this->event->end_date?->toDateTimeString(),
            'location' => $this->event->location,
            'event_type' => $this->event->event_type,
            'created_by' => $this->event->created_by,
            'action' => $this->action,
        ];
    }
}
