<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

class EnsureOperationVerified
{
    /**
     * عملیات‌های حساس (مثل حذف محصول، بازگشت وجه) رو
     * ملزم می‌کنه که operation password در همین session تأیید شده باشه.
     *
     * Verification به token ID (session) وابسته‌ست:
     * تأیید از session A برای session B معتبر نیست.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'احراز هویت لازم است.',
                'code'    => 'UNAUTHENTICATED',
            ], 401);
        }

        $tokenId = $user->currentAccessToken()?->id;

        if (!$tokenId || !Redis::get("op_verified:{$user->id}:{$tokenId}")) {
            return response()->json([
                'success' => false,
                'message' => 'برای این عملیات ابتدا باید رمز تأیید عملیات را وارد کنید.',
                'code'    => 'OPERATION_PASSWORD_REQUIRED',
            ], 403);
        }

        return $next($request);
    }
}
