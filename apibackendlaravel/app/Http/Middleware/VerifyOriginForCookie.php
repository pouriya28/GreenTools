<?php

namespace App\Http\Middleware;

use App\Http\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyOriginForCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredOrigins = config('cors.frontend_origins', []);

        if (is_array($configuredOrigins)) {
            $allowedOrigins = $configuredOrigins;
        } else {
            $allowedOrigins = explode(',', (string) $configuredOrigins);
        }

        $allowedOrigins = array_values(array_unique(array_filter(
            array_map(
                static fn ($origin): string => trim((string) $origin),
                $allowedOrigins
            ),
            static fn (string $origin): bool => $origin !== ''
        )));

        if ($allowedOrigins === []) {
            Log::critical(
                'Cookie origin protection is unavailable because no frontend origins are configured.',
                [
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'request_id' => $request->attributes->get('request_id'),
                ]
            );

            return ApiResponse::error(
                message: 'سرویس احراز مبدأ درخواست موقتاً در دسترس نیست.',
                code: 'ORIGIN_CONFIGURATION_MISSING',
                status: 503,
            );
        }

        $origin = $request->headers->get('Origin')
            ?: $request->headers->get('Referer');

        if (!$origin) {
            return ApiResponse::error(
                message: 'درخواست بدون مبدأ معتبر است.',
                code: 'ORIGIN_HEADER_MISSING',
                status: 403,
            );
        }

        $normalizedOrigin = $this->normalizeOrigin($origin);

        $isAllowed = $normalizedOrigin !== null
            && collect($allowedOrigins)->contains(
                fn (string $allowedOrigin): bool =>
                    $this->normalizeOrigin($allowedOrigin) === $normalizedOrigin
            );

        if (!$isAllowed) {
            return ApiResponse::error(
                message: 'درخواست از مبدأ نامعتبر رد شد.',
                code: 'ORIGIN_NOT_ALLOWED',
                status: 403,
            );
        }

        return $next($request);
    }

    private function normalizeOrigin(string $value): ?string
    {
        $parts = parse_url(trim($value));

        if (
            !is_array($parts)
            || !isset($parts['scheme'], $parts['host'])
            || !in_array(strtolower($parts['scheme']), ['http', 'https'], true)
            || isset($parts['user'], $parts['pass'])
        ) {
            return null;
        }

        $host = strtolower($parts['host']);
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return strtolower($parts['scheme']).'://'.$host.$port;
    }
}