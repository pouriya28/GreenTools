<?php

namespace Database\Seeders;

use App\Models\CustomerLevel;
use Illuminate\Database\Seeder;

class CustomerLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['code' => 'newcomer',  'name' => 'تازه‌وارد', 'icon' => '🌱', 'min_points' => 0,    'max_points' => 99,   'sort_order' => 1],
            ['code' => 'companion', 'name' => 'همراه',     'icon' => '🔧', 'min_points' => 100,  'max_points' => 499,  'sort_order' => 2],
            ['code' => 'friend',    'name' => 'رفیق',      'icon' => '⚙️', 'min_points' => 500,  'max_points' => 1499, 'sort_order' => 3],
            ['code' => 'veteran',   'name' => 'قدیمی',     'icon' => '🔥', 'min_points' => 1500, 'max_points' => 2999, 'sort_order' => 4],
            ['code' => 'special',   'name' => 'ویژه',      'icon' => '👑', 'min_points' => 3000, 'max_points' => null, 'sort_order' => 5],
        ];

        foreach ($levels as $level) {
            CustomerLevel::updateOrCreate(
                ['code' => $level['code']],
                $level + ['is_active' => true]
            );
        }
    }
}