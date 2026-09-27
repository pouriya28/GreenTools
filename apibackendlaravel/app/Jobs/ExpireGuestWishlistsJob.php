<?php

namespace App\Jobs;

use App\Services\WishlistService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ExpireGuestWishlistsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(WishlistService $service): void
    {
        $deleted = $service->deleteExpiredGuestWishlists();

        Log::info('wishlist.guest_expiry', ['deleted_rows' => $deleted]);
    }
}
