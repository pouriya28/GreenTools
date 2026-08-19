<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // مقادیر واقعی را از .env بخوانید، هرگز در کد hardcode نکنید
        $email = env('ADMIN_SEED_EMAIL');
        $username = env('ADMIN_SEED_USERNAME');
        $password = env('ADMIN_SEED_PASSWORD');

        if (!$email || !$username || !$password) {
            $this->command?->warn('ADMIN_SEED_EMAIL / ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD در .env تنظیم نشده؛ Seeder اجرا نشد.');
            return;
        }

        $admin = User::where('email', $email)->first();

        if (!$admin) {
            $admin = new User([
                'name' => 'مدیر سیستم',
                'username' => $username,
                'email' => $email,
                'password' => Hash::make($password),
            ]);
            // فیلدهای guarded باید صریحاً تخصیص داده شوند
            $admin->user_type = 'staff';
            $admin->is_active = true;
            $admin->email_verified_at = now();
            $admin->save();
        }

        if (!$admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }
    }
}
