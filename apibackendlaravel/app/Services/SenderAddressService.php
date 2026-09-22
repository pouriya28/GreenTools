<?php
// app/Services/SenderAddressService.php

namespace App\Services;

use App\Models\SenderAddress;
use Illuminate\Support\Facades\DB;

class SenderAddressService
{
    public function create(array $data): SenderAddress
    {
        return DB::transaction(function () use ($data) {
            $isFirst = SenderAddress::count() === 0;
            if (! empty($data['is_default']) || $isFirst) {
                SenderAddress::query()->update(['is_default' => false]);
                $data['is_default'] = true;
            }
            return SenderAddress::create($data);
        });
    }

    public function update(SenderAddress $senderAddress, array $data): SenderAddress
    {
        return DB::transaction(function () use ($senderAddress, $data) {
            if (! empty($data['is_default'])) {
                SenderAddress::where('id', '!=', $senderAddress->id)->update(['is_default' => false]);
            }
            $senderAddress->update($data);
            return $senderAddress;
        });
    }

    public function delete(SenderAddress $senderAddress): void
    {
        DB::transaction(function () use ($senderAddress) {
            $wasDefault = $senderAddress->is_default;
            $senderAddress->delete();
            if ($wasDefault) {
                SenderAddress::query()->oldest()->first()?->update(['is_default' => true]);
            }
        });
    }
}