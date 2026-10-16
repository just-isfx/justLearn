<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;

class CourseCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public $user, public string $language) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.from_noreply.address'), 'justLearnCode'),
            subject: "Congratulations on completing {$this->language}!",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.course-completed',
        );
    }
}