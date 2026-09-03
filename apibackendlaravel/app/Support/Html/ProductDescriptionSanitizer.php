<?php

namespace App\Support\Html;

use Mews\Purifier\Facades\Purifier;

class ProductDescriptionSanitizer
{
    private const PROFILE = 'product_description';

    public function sanitize(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        return Purifier::clean($html, self::PROFILE);
    }
}