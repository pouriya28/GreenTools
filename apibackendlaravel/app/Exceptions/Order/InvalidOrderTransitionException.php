<?php

namespace App\Exceptions\Order;

use App\Enums\OrderStatus;
use Exception;

class InvalidOrderTransitionException extends Exception
{
    public function __construct(public readonly OrderStatus $from, public readonly OrderStatus $to)
    {
        parent::__construct("Invalid order transition from {$from->value} to {$to->value}.");
    }
}