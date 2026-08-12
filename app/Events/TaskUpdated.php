<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Task $task,
        public string $action,
        public ?string $previousStatus = null
    ) {}

    public function getData(): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'status' => $this->task->status,
            'action' => $this->action,
            'previous_status' => $this->previousStatus,
            'assigned_to' => $this->task->assigned_to,
            'created_by' => $this->task->created_by,
            'due_date' => $this->task->due_date?->toDateString(),
            'priority' => $this->task->priority,
        ];
    }
}
