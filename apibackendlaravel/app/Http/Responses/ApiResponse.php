<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

final class ApiResponse
{
    public static function success(
        mixed $data = null,
        ?string $message = null,
        array $warnings = [],
        int $status = 200,
        array $meta = [],
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'warnings' => $warnings,
            'meta' => array_merge(self::baseMeta(), $meta),
        ], $status);
    }

    public static function error(
        string $message,
        string $code,
        int $status,
        array $errors = [],
        array $meta = [],
    ): JsonResponse {
        $payload = [
            'success' => false,
            'data' => null,
            'message' => $message,
            'code' => $code,
            'meta' => array_merge(self::baseMeta(), $meta),
        ];

        if (! empty($errors)) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }

    private static function baseMeta(): array
    {
        return [
            'request_id' => request()->attributes->get('request_id'),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}