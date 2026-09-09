<?php

namespace App\Exceptions\Checkout;

use App\Exceptions\ApiException;
use App\Support\HttpStatusCodes;

class StoreClosedException extends ApiException
{
    public function __construct(private readonly ?string $reason = null)
    {
        parent::__construct('Store is currently closed for new orders.');

        $this->withContext(['reason' => $reason]);
    }

    public function errorCode(): string
    {
        return HttpStatusCodes::codeFor(503);
    }

    public function statusCode(): int
    {
        return 503;
    }

    public function userMessage(): string
    {
        return $this->reason ?: HttpStatusCodes::safeMessageFor(503);
    }
}
