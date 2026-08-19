<?php

namespace App\Support;

use App\Models\RefreshToken;
use Illuminate\Support\Carbon;

final readonly class RefreshTokenIssued
{
    public function __construct(
        public RefreshToken $record,
        public string $plainToken,
        public Carbon $expiresAt,
    ) {}
}