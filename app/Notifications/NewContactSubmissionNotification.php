<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\ContactSubmission;

class NewContactSubmissionNotification extends Notification
{
    use Queueable;

    public ContactSubmission $submission;

    /**
     * Create a new notification instance.
     */
    public function __construct(ContactSubmission $submission)
    {
        $this->submission = $submission;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Contact Form Submission: ' . $this->submission->subject)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('You have received a new contact form submission from your website.')
            ->line('**Name:** ' . $this->submission->name)
            ->line('**Email:** ' . $this->submission->email)
            ->line('**Phone:** ' . ($this->submission->phone ?? 'Not provided'))
            ->line('**Company:** ' . ($this->submission->company ?? 'Not provided'))
            ->line('**Service Interest:** ' . $this->submission->service_interest_label)
            ->line('**Budget:** ' . $this->submission->budget_label)
            ->line('**Timeline:** ' . $this->submission->timeline_label)
            ->line('**Subject:** ' . $this->submission->subject)
            ->line('')
            ->line('**Message:**')
            ->line($this->submission->message)
            ->line('')
            ->action('Open Admin Dashboard', route('admin.dashboard'))
            ->line('Please respond to this inquiry within 24 hours.')
            ->salutation('Best regards, Coin Security System');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'submission_id' => $this->submission->id,
            'type' => 'contact_submission',
            'title' => 'New Contact Form Submission',
            'message' => $this->submission->name . ' submitted a contact form: ' . $this->submission->subject,
            'data' => [
                'name' => $this->submission->name,
                'email' => $this->submission->email,
                'subject' => $this->submission->subject,
                'service_interest' => $this->submission->service_interest,
            ],
            'created_at' => $this->submission->created_at->toISOString(),
        ];
    }
}
