<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SenderAddress;

class ShippingLabelDataService
{
    // Physical mm dimensions — single source of truth for label sheet layout math.
    private const LABEL_SIZES_MM = [
        '10x15' => ['width' => 100, 'height' => 150],
        '10x10' => ['width' => 100, 'height' => 100],
    ];

    private const PAPER_SIZES_MM = [
        'a4' => ['width' => 210, 'height' => 297],
        'a5' => ['width' => 148, 'height' => 210],
    ];

    public function build(
        array $orderIds,
        ?string $status,
        SenderAddress $sender,
        string $paperSize,
        string $labelSize,
        int $copiesPerOrder,
    ): array {
        $query = Order::query()->with(['addressSnapshot']);

        $orders = empty($orderIds)
            ? $query->where('status', $status)->limit(200)->get()
            : $query->whereIn('id', $orderIds)->get();

        $labelSizeMm = self::LABEL_SIZES_MM[$labelSize];
        $paperSizeMm = self::PAPER_SIZES_MM[$paperSize];
        $columns = max(1, (int) floor($paperSizeMm['width'] / $labelSizeMm['width']));
        $rows = max(1, (int) floor($paperSizeMm['height'] / $labelSizeMm['height']));

        // Expand each order into N copies — the frontend just renders a flat list of cards.
        $labels = $orders->flatMap(function (Order $order) use ($copiesPerOrder) {
            $address = $order->addressSnapshot;

            $item = [
                'order_id' => $order->id,
                'recipient_name' => $address?->recipient_name,
                'recipient_phone' => $address?->recipient_phone,
                'province_name' => $address?->province_name,
                'city_name' => $address?->city_name,
                'district' => $address?->district,
                'address_line' => $address?->address_line,
                'plaque' => $address?->plaque,
                'unit' => $address?->unit,
                'postal_code' => $address?->postal_code,
            ];

            return array_fill(0, $copiesPerOrder, $item);
        })->values()->all();

        return [
            'sender' => [
                'sender_name' => $sender->sender_name,
                'sender_phone' => $sender->sender_phone,
                'province_name' => $sender->province_name,
                'city_name' => $sender->city_name,
                'district' => $sender->district,
                'address_line' => $sender->address_line,
                'plaque' => $sender->plaque,
                'unit' => $sender->unit,
                'postal_code' => $sender->postal_code,
            ],
            'labels' => $labels,
            'layout' => [
                'paper_size' => $paperSize,
                'label_size' => $labelSize,
                'label_width_mm' => $labelSizeMm['width'],
                'label_height_mm' => $labelSizeMm['height'],
                'paper_width_mm' => $paperSizeMm['width'],
                'paper_height_mm' => $paperSizeMm['height'],
                'columns' => $columns,
                'rows' => $rows,
            ],
        ];
    }
}