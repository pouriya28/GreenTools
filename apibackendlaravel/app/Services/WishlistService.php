<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class WishlistService
{
    private const GUEST_TTL_DAYS = 10;

    // -----------------------------------------------------------------------
    // Authenticated user methods
    // -----------------------------------------------------------------------

    public function paginateProductsForUser(User $user, int $perPage = 20): LengthAwarePaginator
    {
        $productIds = Wishlist::query()
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->pluck('product_id');

        return Product::query()
            ->whereIn('id', $productIds)
            ->with(['primaryImage'])
            ->paginate($perPage);
    }

    public function productIdsForUser(User $user): Collection
    {
        return Wishlist::query()
            ->where('user_id', $user->id)
            ->pluck('product_id');
    }

    public function add(User $user, Product $product): void
    {
        Wishlist::query()->firstOrCreate([
            'user_id'    => $user->id,
            'product_id' => $product->id,
        ]);
    }

    public function remove(User $user, Product $product): void
    {
        Wishlist::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->delete();
    }

    // -----------------------------------------------------------------------
    // Guest methods
    // -----------------------------------------------------------------------

    public function paginateProductsForGuest(string $guestToken, int $perPage = 20): LengthAwarePaginator
    {
        $productIds = Wishlist::query()
            ->where('guest_token', $guestToken)
            ->where('expires_at', '>', now())
            ->orderByDesc('id')
            ->pluck('product_id');

        return Product::query()
            ->whereIn('id', $productIds)
            ->with(['primaryImage'])
            ->paginate($perPage);
    }

    public function productIdsForGuest(string $guestToken): Collection
    {
        return Wishlist::query()
            ->where('guest_token', $guestToken)
            ->where('expires_at', '>', now())
            ->pluck('product_id');
    }

    public function addForGuest(string $guestToken, Product $product): void
    {
        Wishlist::query()->firstOrCreate(
            [
                'guest_token' => $guestToken,
                'product_id'  => $product->id,
            ],
            [
                'expires_at' => now()->addDays(self::GUEST_TTL_DAYS),
            ]
        );
    }

    public function removeForGuest(string $guestToken, Product $product): void
    {
        Wishlist::query()
            ->where('guest_token', $guestToken)
            ->where('product_id', $product->id)
            ->delete();
    }

    // -----------------------------------------------------------------------
    // Merge — called after login
    // -----------------------------------------------------------------------

    /**
     * Merge a guest wishlist into an authenticated user's wishlist.
     *
     * Strategy:
     * - Products already in user wishlist → skip (idempotent, no error)
     * - Products only in guest wishlist → move to user wishlist
     * - Expired guest entries → skip and clean up
     * - After merge → delete all guest entries for this token
     *
     * Wrapped in a transaction to prevent partial merges.
     */
    public function mergeGuestIntoUser(string $guestToken, string $userId): void
    {
        \DB::transaction(function () use ($guestToken, $userId) {
            $guestItems = Wishlist::query()
                ->where('guest_token', $guestToken)
                ->where('expires_at', '>', now())
                ->get();

            foreach ($guestItems as $item) {
                // firstOrCreate is safe against duplicates (unique index)
                Wishlist::query()->firstOrCreate([
                    'user_id'    => $userId,
                    'product_id' => $item->product_id,
                ]);
            }

            // Clean up all guest entries for this token (expired or not)
            Wishlist::query()
                ->where('guest_token', $guestToken)
                ->delete();
        });
    }

    // -----------------------------------------------------------------------
    // Cleanup — called by scheduled job
    // -----------------------------------------------------------------------

    public function deleteExpiredGuestWishlists(): int
    {
        return Wishlist::query()
            ->whereNotNull('guest_token')
            ->where('expires_at', '<=', now())
            ->delete();
    }
}
