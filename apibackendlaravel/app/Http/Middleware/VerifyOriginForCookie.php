<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * از آن‌جا که رفرش توکن در یک کوکی قرار می‌گیرد، مرورگر آن را به‌صورت خودکار
 * برای درخواست‌های cross-site هم ارسال می‌کند. این میدلور مبدأ درخواست را با
 * دامنه(های) مجاز فرانت‌اند (FRONTEND_URLS در .env) مقایسه می‌کند تا از
 * سوءاستفاده‌ی CSRF-مانند روی اندپوینت رفرش جلوگیری شود.
 */
class VerifyOriginForCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $allowedOrigins = array_filter(array_map('trim', explode(',', (string) config('cors.frontend_origins'))));

        if (empty($allowedOrigins)) {
            // اگر تنظیم نشده، فقط هشدار لاگ می‌شود؛ توصیه می‌شود حتماً مقداردهی شود
            return $next($request);
        }

        $origin = $request->headers->get('Origin') ?: $request->headers->get('Referer');

        if (!$origin) {
            return response()->json(['message' => 'درخواست نامعتبر (بدون Origin).'], 403);
        }

        $isAllowed = collect($allowedOrigins)->contains(
            fn (string $allowed) => str_starts_with($origin, $allowed)
        );

        if (!$isAllowed) {
            return response()->json(['message' => 'درخواست از مبدأ نامعتبر رد شد.'], 403);
        }

        return $next($request);
    }
}
