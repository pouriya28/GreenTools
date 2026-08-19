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
                'message' => 'حساب کاربری شما غیرفعال شده است.',
            ], 403);
        }

        return $next($request);
    }
}