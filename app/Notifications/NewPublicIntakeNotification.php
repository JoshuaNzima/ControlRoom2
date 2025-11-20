<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Models\PublicIntake;

class NewPublicIntakeNotification extends Notification
{
    use Queueable;

    public function __construct(public PublicIntake $intake)
    {
    }

    public function via(object $notifiable): array
    {
        // Use database channel by default to avoid mail config requirements.
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'intake_id' => $this->intake->id,
            'type' => $this->intake->type,
            'name' => $this->intake->name,
            'email' => $this->intake->email,
            'title' => $this->intake->title,
            'submitted_at' => $this->intake->created_at?->toIso8601String(),
            'url' => url('/control-room/triage/intakes/' . $this->intake->id),
        ];
    }
}
