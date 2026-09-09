<?php

namespace App\Exceptions\Checkout;

use App\Exceptions\ApiException;
use App\Support\HttpStatusCodes;

class AddressNotOwnedException extends ApiException
{
    public function __construct(private readonly int $addressId)
    {
        parent::__construct("Address {$addressId} does not belong to the authenticated user.");

        $this->withContext(['address_id' => $addressId]);
    }

    public function errorCode(): string
    {
        return HttpStatusCodes::codeFor(403);
    }

    public function statusCode(): int
    {
        return 403;
    }

    public function userMessage(): string
    {
        return HttpStatusCodes::safeMessageFor(403);
    }
}
