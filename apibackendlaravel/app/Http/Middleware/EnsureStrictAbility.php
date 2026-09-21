<?php

// app/Http/Middleware/EnsureStrictAbility.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStrictAbility
{
    /**
     * مثل ability:xxx ولی wildcard ['*'] رو رد می‌کنه.
     * فقط توکنی که دقیقاً همون ability رو داره رد می‌شه.
     */
    public function handle(Request $request, Closure $next, string ...$abilities): Response
    {
        $token = $request->user()?->currentAccessToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'احراز هویت لازم است.',
                'code'    => 'UNAUTHENTICATED',
            ], 401);
        }

        $tokenAbilities = $token->abilities ?? [];

        // ❌ wildcard رو رد کن — توکن کامل نباید اینجا باشه
        if (in_array('*', $tokenAbilities, true)) {
            return response()->json([
                'success' => false,
                'message' => 'نوع توکن نامعتبر است.',
                'code'    => 'FORBIDDEN',
            ], 403);
        }

        // ❌ اگه ability موردنظر نداشت رد کن
        foreach ($abilities as $ability) {
            if (!in_array($ability, $tokenAbilities, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'دسترسی غیرمجاز.',
                    'code'    => 'FORBIDDEN',
                ], 403);
            }
        }

        return $next($request);
    }
}