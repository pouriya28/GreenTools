<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Province;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class ProvinceCitySeeder extends Seeder
{
    public function run(): void
    {
        $json = File::get(database_path('seeders/cities.json'));
        $data = json_decode($json, true);

        foreach ($data as $item) {
            $province = Province::firstOrCreate(['name' => $item['province']]);

            foreach ($item['cities'] as $cityName) {
                City::firstOrCreate([
                    'province_id' => $province->id,
                    'name' => $cityName,
                ]);
            }
        }
    }
}