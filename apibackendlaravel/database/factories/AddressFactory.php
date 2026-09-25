<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;

class AddressFactory extends Factory
{
    protected $model = Address::class;

    public function definition(): array
    {
        // province_id and city_id are NOT NULL in the DB schema.
        // We insert minimal rows directly rather than creating full seeders.
        $province = DB::table('provinces')->insertGetId([
            'name'       => $this->faker->state(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $city = DB::table('cities')->insertGetId([
            'province_id' => $province,
            'name'        => $this->faker->city(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return [
            'user_id'         => User::factory(),
            'title'           => $this->faker->words(2, true),
            'recipient_name'  => $this->faker->name(),
            'recipient_phone' => '091' . $this->faker->numerify('########'),
            'province_id'     => $province,
            'city_id'         => $city,
            'district'        => $this->faker->word(),
            'postal_code'     => $this->faker->numerify('##########'),
            'address_line'    => $this->faker->streetAddress(),
            'plaque'          => (string) $this->faker->numberBetween(1, 200),
            'unit'            => null,
            'latitude'        => null,
            'longitude'       => null,
            'map_provider'    => null,
            'map_place_id'    => null,
            'is_default'      => false,
        ];
    }

    public function default(): static
    {
        return $this->state(fn () => ['is_default' => true]);
    }
}
