<?php
// app/Models/SenderAddress.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SenderAddress extends Model
{
    protected $fillable = [
        'label', 'sender_name', 'sender_phone',
        'province_name', 'city_name', 'district', 'postal_code',
        'address_line', 'plaque', 'unit', 'is_default',
    ];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }
}