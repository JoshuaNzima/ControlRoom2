<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Interview;

class InterviewScheduled extends Mailable
{
    use Queueable, SerializesModels;

    public Interview $interview;

    public function __construct(Interview $interview)
    {
        $this->interview = $interview;
    }

    public function envelope(): Envelope
    {
        $title = $this->interview->application?->jobPosting?->title;

        return new Envelope(
            subject: 'Interview scheduled'.($title ? ' — '.$title : ''),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.interview-scheduled',
            with: [
                'interview' => $this->interview,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
