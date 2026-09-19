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

        $normalizedOrigin = $this->normalizeOrigin($origin);

        $isAllowed = $normalizedOrigin !== null && collect($allowedOrigins)
            ->contains(fn (string $allowed) => $this->normalizeOrigin($allowed) === $normalizedOrigin);

        if (!$isAllowed) {
            return response()->json(['message' => 'درخواست از مبدأ نامعتبر رد شد.'], 403);
        }

        return $next($request);
    }

    /*
     * Reduces a URL down to scheme, host, and port only, discarding any path
     * or query string, so a Referer header (which includes a path) can be
     * compared against a bare Origin value. Using exact equality here,
     * instead of the previous str_starts_with prefix match, prevents an
     * attacker-controlled domain that merely starts with an allowed origin
     * string from passing the check.
     */
    private function normalizeOrigin(string $value): ?string
    {
        $parts = parse_url($value);

        if (!isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return strtolower($parts['scheme'].'://'.$parts['host'].$port);
    }
}