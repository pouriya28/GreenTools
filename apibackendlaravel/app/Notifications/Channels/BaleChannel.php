<?php
// app/Notifications/Channels/BaleChannel.php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BaleChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toBale')) {
            return;
        }

        $chatId = method_exists($notifiable, 'routeNotificationFor')
            ? $notifiable->routeNotificationFor('bale', $notification)
            : null;

        // No chat id set for this admin yet — silently skip, not an error.
        if (empty($chatId)) {
            return;
        }

        $token = config('services.bale.bot_token');
        if (empty($token)) {
            Log::warning('Bale notification skipped: BALE_BOT_TOKEN is not configured.');
            return;
        }

        $text = $notification->toBale($notifiable);

        try {
            // Fail-soft by design: unlike the payment webhook (which must
            // fail closed for security), a Bale outage must never block or
            // retry-loop an otherwise-successful order-paid flow.
            $response = Http::timeout(5)->post("https://tapi.bale.ai/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
            ]);

            if (! $response->successful()) {
                // Never log $token here.
                Log::warning('Bale notification failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Bale notification threw an exception.', ['message' => $e->getMessage()]);
        }
    }
}