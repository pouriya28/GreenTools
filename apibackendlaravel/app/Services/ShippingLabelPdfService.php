<?php
// app/Services/ShippingLabelPdfService.php

namespace App\Services;

use App\Models\Order;
use App\Models\SenderAddress;
use Mpdf\Mpdf;

class ShippingLabelPdfService
{
    // ابعاد فیزیکی به میلی‌متر — منبع واحد حقیقت برای چیدمان گرید
    private const LABEL_SIZES_MM = [
        '10x15' => ['width' => 100, 'height' => 150],
        '10x10' => ['width' => 100, 'height' => 100],
    ];

    private const PAPER_SIZES_MM = [
        'a4' => ['width' => 210, 'height' => 297],
        'a5' => ['width' => 148, 'height' => 210],
    ];

    public function generate(
        array $orderIds,
        ?string $status,
        SenderAddress $sender,
        string $paperSize,
        string $labelSize,
        int $copiesPerOrder,
    ): string {
        $query = Order::query()->with(['items', 'addressSnapshot']);

        $orders = empty($orderIds)
            ? $query->where('status', $status)->limit(200)->get()
            : $query->whereIn('id', $orderIds)->get();

        // هر سفارش را به تعداد copies_per_order تکرار کن
        $labels = $orders->flatMap(fn (Order $order) => array_fill(0, $copiesPerOrder, $order));

        $label = self::LABEL_SIZES_MM[$labelSize];
        $paper = self::PAPER_SIZES_MM[$paperSize];
        $columns = max(1, (int) floor($paper['width'] / $label['width']));
        $rows = max(1, (int) floor($paper['height'] / $label['height']));
        $perPage = $columns * $rows;

        $pages = $labels->chunk($perPage);

        $html = view('labels.sheet', [
            'pages' => $pages,
            'sender' => $sender,
            'columns' => $columns,
            'labelWidthMm' => $label['width'],
            'labelHeightMm' => $label['height'],
        ])->render();

        $mpdf = new Mpdf([
            'format' => strtoupper($paperSize),
            'mode' => 'utf-8',
            'fontDir' => array_merge((new \Mpdf\Config\ConfigVariables())->getDefaults()['fontDir'], [storage_path('fonts')]),
            'fontdata' => (new \Mpdf\Config\FontVariables())->getDefaults()['fontdata'] + [
                'vazirmatn' => ['R' => 'Vazirmatn-Regular.ttf', 'B' => 'Vazirmatn-Bold.ttf'],
            ],
            'default_font' => 'vazirmatn',
            'margin_top' => 5, 'margin_bottom' => 5, 'margin_left' => 5, 'margin_right' => 5,
        ]);
        $mpdf->SetDirectionality('rtl');
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', 'S'); // 'S' = برگردوندن به‌صورت رشته، نه ذخیره روی دیسک
    }
}