<?php

namespace App\Listeners;

use App\Services\WishlistService;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

class MergeGuestWishlistOnLogin
{
    public function __construct(
        private readonly WishlistService $wishlistService,
        private readonly Request $request,
    ) {
    }

    public function handle(Login $event): void
    {
        $guestToken = $this->request->cookie('wishlist_guest_token');

        if ($guestToken === null) {
            return;
        }

        $this->wishlistService->mergeGuestIntoUser($guestToken, $event->user->id);
    }
}
