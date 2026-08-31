<?php

namespace App\Listeners;

use App\Services\Cart\CartMergeService;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

class MergeGuestCartOnLogin
{
    public function __construct(
        private readonly CartMergeService $mergeService,
        private readonly Request $request,
    ) {
    }

    public function handle(Login $event): void
    {
        $guestToken = $this->request->cookie('cart_guest_token');

        if ($guestToken === null) {
            return;
        }

        $this->mergeService->merge($event->user->id, $guestToken);
    }
}