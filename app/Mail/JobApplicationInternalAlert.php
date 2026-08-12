<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\JobApplication;

class JobApplicationInternalAlert extends Mailable
{
    use Queueable, SerializesModels;

    public JobApplication $application;

    public function __construct(JobApplication $application)
    {
        $this->application = $application;
    }

    public function envelope(): Envelope
    {
        $title = $this->application->jobPosting?->title;

        return new Envelope(
            subject: 'New job application'.($title ? ' — '.$title : ''),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.job-application-internal-alert',
            with: [
                'application' => $this->application,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
