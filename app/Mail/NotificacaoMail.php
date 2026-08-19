<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NotificacaoMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Dados que vão no email.
     */
    public function __construct(
        public readonly string $assunto,
        public readonly string $mensagem,
        public readonly string $nomeSegurado,
    ) {}

    /**
     * Corpo do email
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->assunto,
        );
    }

    /**
     * Template do email.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.notificacao',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
