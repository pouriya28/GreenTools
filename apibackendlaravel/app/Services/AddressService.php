<?php

namespace App\Services;

use App\Exceptions\Checkout\AddressNotOwnedException;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderAddressSnapshot;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * NOTE: reverse geocoding was moved out of this service into the dedicated
 * MapController + GeocodingServiceInterface (app/Services/Geocoding). This
 * service now only owns Address CRUD/ownership/snapshot concerns, matching
 * the separation of concerns required by the map feature spec.
 */
class AddressService
{
    public function create(User $user, array $data): Address
    {
        return DB::transaction(function () use ($user, $data) {
            $isFirstAddress = $user->addresses()->count() === 0;

            if (! empty($data['is_default']) || $isFirstAddress) {
                $user->addresses()->update(['is_default' => false]);
                $data['is_default'] = true;
            }

            return $user->addresses()->create($data);
        });
    }

    public function update(Address $address, array $data): Address
    {
        return DB::transaction(function () use ($address, $data) {
            if (! empty($data['is_default'])) {
                $address->user->addresses()
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            }

            $address->update($data);

            return $address;
        });
    }

    public function delete(Address $address): void
    {
        DB::transaction(function () use ($address) {
            $wasDefault = $address->is_default;
            $address->delete();

            if ($wasDefault) {
                $next = $address->user->addresses()->oldest()->first();
                $next?->update(['is_default' => true]);
            }
        });
    }

    public function setDefault(Address $address): Address
    {
        return DB::transaction(function () use ($address) {
            $address->user->addresses()
                ->where('id', '!=', $address->id)
                ->update(['is_default' => false]);

            $address->update(['is_default' => true]);

            return $address;
        });
    }

    public function findOwnedOrFail(string $addressId, string $userId): Address
    {
        $address = Address::where('id', $addressId)
            ->where('user_id', $userId)
            ->first();

        if ($address === null) {
            throw new AddressNotOwnedException($addressId);
        }

        return $address;
    }

    public function createSnapshot(Order $order, Address $address): OrderAddressSnapshot
    {
        $address->loadMissing(['province', 'city']);

        return $order->addressSnapshot()->create([
            'address_id' => $address->id,
            'recipient_name' => $address->recipient_name,
            'recipient_phone' => $address->recipient_phone,
            'province_id' => $address->province_id,
            'city_id' => $address->city_id,
            'province_name' => $address->province->name,
            'city_name' => $address->city->name,
            'district' => $address->district,
            'postal_code' => $address->postal_code,
            'address_line' => $address->address_line,
            'plaque' => $address->plaque,
            'unit' => $address->unit,
            'latitude' => $address->latitude,
            'longitude' => $address->longitude,
        ]);
    }
}
