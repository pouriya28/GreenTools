<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    /**
     * حساب‌های غیرفعال (is_active = false) حتی با توکن معتبر نباید
     * به منابع محافظت‌شده دسترسی داشته باشن — مثلاً کارمندی که اخراج شده
     * ولی توکن قدیمیش هنوز منقضی نشده.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user && !$user->is_active) {
            $user->currentAccessToken()?->delete();

            return response()->json([
                'success' => false,
                'date' => null ,

                'message' => 'حساب کاربری شما غیرفعال شده است.',
                'code'    => 'ACCOUNT_INACTIVE',
            ], 403);
        }
        if ($user && $user->locked_until && $user->locked_until->isFuture()) {
            return response()->json([
                'success' => false,
                'data'    => null,
                'message' => 'حساب شما موقتاً قفل شده است.',
                'code'    => 'ACCOUNT_LOCKED',
            ], 403);
        }

        return $next($request);
    }
}