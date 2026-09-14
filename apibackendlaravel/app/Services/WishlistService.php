<?php
// app/Services/WishlistService.php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class WishlistService
{
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
        // firstOrCreate به خاطر constraint یونیک، امن در برابر دابل‌کلیک/ریکوئست تکراری است.
        Wishlist::query()->firstOrCreate([
            'user_id' => $user->id,
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
}