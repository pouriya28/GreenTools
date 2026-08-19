<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminPasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $token) {}

    public function build(): self
    {
        $resetUrl = rtrim(config('app.frontend_url'), '/')
            .'/reset-password?email='.urlencode($this->user->email)
            .'&token='.$this->token;

        return $this->subject('بازیابی رمز عبور و نام کاربری')
            ->view('emails.admin-password-reset', [
                'username' => $this->user->username,
                'resetUrl' => $resetUrl,
            ]);
    }
}
