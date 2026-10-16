<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;

class WelcomeUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.from_noreply.address'), 'justLearnCode'),
            subject: 'Welcome to justLearnCode!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome',
        );
    }
}