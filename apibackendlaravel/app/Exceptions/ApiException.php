<?php

namespace App\Exceptions;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class ApiException extends \RuntimeException
{
    protected array $context = [];
    protected array $errors = [];

    abstract public function errorCode(): string;
    abstract public function statusCode(): int;
    abstract public function userMessage(): string;

    public function withContext(array $context): static
    {
        $this->context = array_merge($this->context, $context);
        return $this;
    }

    public function withErrors(array $errors): static
    {
        $this->errors = $errors;
        return $this;
    }

    public function context(): array
    {
        return $this->context;
    }

    public function render(Request $request): ?JsonResponse
    {
        if (! $request->is('api/*')) {
            return null;
        }

        return ApiResponse::error(
            message: $this->userMessage(),
            code: $this->errorCode(),
            status: $this->statusCode(),
            errors: $this->errors,
            meta: $this->context,
        );
    }

    public function report(): void
    {
        \Illuminate\Support\Facades\Log::warning(static::class, [
            'error_code' => $this->errorCode(),
            'message' => $this->getMessage(),
            'context' => $this->context,
        ]);
    }
}