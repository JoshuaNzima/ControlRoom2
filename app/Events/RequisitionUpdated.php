<?php

namespace App\Events;

use App\Models\Requisition;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequisitionUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Requisition $requisition,
        public string $action,
        public ?string $previousStatus = null
    ) {}

    public function getData(): array
    {
        return [
            'requisition_id' => $this->requisition->id,
            'title' => $this->requisition->title,
            'status' => $this->requisition->status,
            'action' => $this->action,
            'previous_status' => $this->previousStatus,
            'requested_by' => $this->requisition->requested_by,
            'approved_by' => $this->requisition->approved_by,
            'total_amount' => $this->requisition->total_amount,
        ];
    }
}
