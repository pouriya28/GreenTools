<?php

namespace Database\Factories;

use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryReservationFactory extends Factory
{
    protected $model = InventoryReservation::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            
            'product_id' => Product::factory(),
            'quantity' => $this->faker->numberBetween(1, 3),
            'status' => ReservationStatus::Active,
            'expires_at' => now()->addMinutes(30),
        ];
    }

    // برای تست ExpireInventoryReservationsJob: رزرو هنوز Active است ولی
    // زمانش گذشته — دقیقاً حالتی که آن Job باید پیدا و پاک‌سازی کند.
    public function pastExpiry(): static
    {
        return $this->state(fn () => ['expires_at' => now()->subMinute()]);
    }

    // بعد از پرداخت موفق: موجودی به‌صورت قطعی کسر شده و رزرو دیگر active نیست.
    public function confirmed(): static
    {
        return $this->state(fn () => ['status' => ReservationStatus::Confirmed]);
    }

    // بعد از پاک‌سازی توسط Job (چه به‌خاطر انقضا، چه لغو دستی سفارش).
    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => ReservationStatus::Expired,
            'expires_at' => now()->subMinute(),
        ]);
    }
}