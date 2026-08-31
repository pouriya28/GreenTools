<?php

namespace App\Enums;

enum ReservationStatus: string
{
    case Active = 'active';
    case Confirmed = 'confirmed';
    case Expired = 'expired';
}