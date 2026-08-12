<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\JobApplication;

class JobApplicationStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public JobApplication $application;
    public string $oldStatus;

    public function __construct(JobApplication $application, string $oldStatus)
    {
        $this->application = $application;
        $this->oldStatus = $oldStatus;
    }

    public function envelope(): Envelope
    {
        $title = $this->application->jobPosting?->title;

        return new Envelope(
            subject: 'Application update'.($title ? ' — '.$title : ''),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.job-application-status-updated',
            with: [
                'application' => $this->application,
                'oldStatus' => $this->oldStatus,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
