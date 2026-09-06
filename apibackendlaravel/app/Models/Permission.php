<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    protected $fillable = [
        'name',
        'guard_name',
        'requires_operation_confirmation',
    ];

    protected function casts(): array
    {
        return [
            'requires_operation_confirmation' => 'boolean',
        ];
    }
}