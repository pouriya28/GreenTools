<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'products.view', 'products.create', 'products.update', 'products.delete', 'products.manage', 'products.trash',
            'categories.view', 'categories.create', 'categories.update', 'categories.delete', 'categories.manage', 'categories.trash',
            'orders.view', 'orders.update', 'orders.delete',
            'users.view', 'users.manage',
            'audit-logs.view',
            'loyalty.manage', 'store.manage-status',
        ];

        // Permissions that require the operation password before they can be
        // used — checked at runtime by EnsureOperationVerified middleware.
        $sensitive = [
            'products.delete',
            'categories.delete',
            'orders.delete',
            'users.manage',
            'loyalty.manage',
        ];

        foreach ($permissions as $name) {
            /** @var Permission $permission */
            $permission = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'sanctum']);

            $permission->update([
                'requires_operation_confirmation' => in_array($name, $sensitive, true),
            ]);
        }

        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'sanctum']);
        $manager->syncPermissions([
            'products.view', 'products.create', 'products.update',
            'categories.view', 'categories.create', 'categories.update',
            'orders.view', 'orders.update',
        ]);

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $admin->syncPermissions(Permission::all());
    }
}