<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class Order extends Model
{
    // Guarded, not fillable: every write MUST go through CheckoutService/PaymentService,
    // never a raw mass-assignment from a controller. This is what blocks admin forgery.
    use HasUlids;
    protected $guarded = ['id'];

    protected $casts = [
        'status' => OrderStatus::class,
        'total_amount' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(InventoryReservation::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function shipment(): HasOne
    {
        return $this->hasOne(Shipment::class);
    }

    // جدید: هر سفارش دقیقاً یک Snapshot غیرقابل‌تغییر از آدرس زمان خرید دارد.
    public function addressSnapshot(): HasOne
    {
        return $this->hasOne(OrderAddressSnapshot::class);
    }

    public function technicalConsultationRequests(): HasMany
    {
        return $this->hasMany(TechnicalConsultationRequest::class);
    }

    public function transitionTo(OrderStatus $next): void
    {
        if (! $this->status->canTransitionTo($next)) {
            throw new \App\Exceptions\Order\InvalidOrderTransitionException($this->status, $next);
        }

        $this->update(['status' => $next]);
    }
}
