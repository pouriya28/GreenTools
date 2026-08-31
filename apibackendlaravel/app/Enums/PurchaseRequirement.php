<?php

namespace App\Enums;

enum PurchaseRequirement: string
{
    case Standard = 'standard';
    case TechnicalConsultation = 'technical_consultation';
    case ProfessionalInstallation = 'professional_installation';
    case Restricted = 'restricted';

    public function label(): string
    {
        return match ($this) {
            self::Standard => 'خرید عادی',
            self::TechnicalConsultation => 'نیاز به مشاوره فنی',
            self::ProfessionalInstallation => 'نیاز به نصب تخصصی',
            self::Restricted => 'محدود - نیاز به تماس با پشتیبانی',
        };
    }
}