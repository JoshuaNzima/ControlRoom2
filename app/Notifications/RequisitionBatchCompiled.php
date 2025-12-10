<?php

namespace App\Notifications;

use App\Models\RequisitionBatch;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequisitionBatchCompiled extends Notification
{
    use Queueable;

    public RequisitionBatch $batch;

    public function __construct(RequisitionBatch $batch)
    {
        $this->batch = $batch;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Requisitions Batch Compiled for ' . ($this->batch->batch_date?->format('Y-m-d') ?? 'today'))
            ->greeting('Hello ' . ($notifiable->name ?? 'Admin'))
            ->line('An assets manager compiled today\'s requisitions into a batch that requires your acknowledgement.')
            ->line('Total Amount: MWK ' . number_format((float) $this->batch->total_amount, 2))
            ->action('Review Today\'s Batch', route('requisitions.index'))
            ->line('Open Requisitions and click “Today\'s Batch” to review and acknowledge.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'requisition_batch_compiled',
            'title' => 'Requisitions batch compiled',
            'message' => "Today's requisitions were compiled and await acknowledgement.",
            'batch' => [
                'id' => $this->batch->id,
                'batch_date' => optional($this->batch->batch_date)->format('Y-m-d'),
                'total_amount' => $this->batch->total_amount,
                'status' => $this->batch->status,
            ],
            'action' => route('requisitions.index'),
        ];
    }
}
