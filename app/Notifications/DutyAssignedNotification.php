<?php

namespace App\Notifications;

use App\Models\FrontOffice\OfficeDuty;
use App\Models\FrontOffice\PersonalDuty;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DutyAssignedNotification extends Notification
{
    use Queueable;

    private $duty;
    private string $dutyType;
    private bool $isEscalation;

    public function __construct($duty, string $dutyType, bool $isEscalation = false)
    {
        $this->duty = $duty;
        $this->dutyType = $dutyType;
        $this->isEscalation = $isEscalation;
    }

    public function via(object $notifiable): array
    {
        return config('front-office.notifications.channels', ['mail', 'database']);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->isEscalation
            ? "[ESCALATION] Overdue Duty: {$this->duty->title}"
            : "New Duty Assigned: {$this->duty->title}";

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},")
            ->line("A new duty has been " . ($this->isEscalation ? "escalated" : "assigned") . " to you.");

        if ($this->duty instanceof OfficeDuty) {
            $mail->line("**Duty Type:** {$this->duty->getDutyTypeLabel()}")
                ->line("**Title:** {$this->duty->title}")
                ->line("**Priority:** " . ucfirst($this->duty->priority))
                ->line("**Status:** " . ucfirst($this->duty->status));

            if ($this->duty->scheduled_start) {
                $mail->line("**Scheduled:** {$this->duty->scheduled_start->format('M d, Y H:i')}");
            }

            if ($this->duty->petty_cash_amount) {
                $mail->line("**Petty Cash:** MWK " . number_format($this->duty->petty_cash_amount, 2));
            }

            $mail->action('View Duty', url('/front-office/executive'));
        } else {
            $mail->line("**Duty Type:** {$this->duty->getDutyTypeLabel()}")
                ->line("**Title:** {$this->duty->title}")
                ->line("**Priority:** " . ucfirst($this->duty->priority));

            if ($this->duty->scheduled_start) {
                $mail->line("**Scheduled:** {$this->duty->scheduled_start->format('M d, Y H:i')}");
            }

            if ($this->duty->budget_amount) {
                $mail->line("**Budget:** MWK " . number_format($this->duty->budget_amount, 2));
            }

            $mail->action('View Duty', url('/front-office/personal'));
        }

        $mail->line('Thank you for using our application.');

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'duty_id' => $this->duty->id,
            'duty_type' => $this->dutyType,
            'title' => $this->duty->title,
            'priority' => $this->duty->priority,
            'status' => $this->duty->status,
            'is_escalation' => $this->isEscalation,
            'url' => $this->dutyType === 'office' ? '/front-office/executive' : '/front-office/personal',
        ];
    }
}
