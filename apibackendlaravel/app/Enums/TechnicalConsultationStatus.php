<?php

namespace App\Enums;

enum TechnicalConsultationStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}