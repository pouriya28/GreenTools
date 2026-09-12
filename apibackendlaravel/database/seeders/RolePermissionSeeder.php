<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\User;
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
            'loyalty.manage', 'store.manage-status', 'shipping.manage', 'comments.moderate', 'comments.delete',
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

        // نقش admin به کاربری که ایمیلش در ADMIN_EMAIL تعریف شده اختصاص
        // داده می‌شود — به‌جای هاردکد کردن نام، تا این seeder در محیط‌های
        // مختلف (local/staging/production) بدون تغییر کد قابل اجرا باشد.
        $adminEmail = env('ADMIN_ALERT_EMAIL');

        if (! $adminEmail) {
            throw new \RuntimeException('ADMIN_EMAIL env variable is not set; cannot assign the admin role.');
        }

        $adminUser = User::where('email', $adminEmail)->first();

        if ($adminUser === null) {
            throw new \RuntimeException("No user found with email [{$adminEmail}] to assign the admin role.");
        }

        $adminUser->assignRole($admin);
    }
}