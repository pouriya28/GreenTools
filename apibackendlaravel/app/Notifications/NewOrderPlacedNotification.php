<?php
// app/Notifications/NewOrderPlacedNotification.php

namespace App\Notifications;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\BaleChannel;

class NewOrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    // Intentionally primitive values, not the Order model itself — avoids
    // serializing/queueing a stale or overly-detailed model snapshot.
    public function __construct(
        private readonly int $orderId,
        private readonly int $totalAmount,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database' , BaleChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('سفارش جدید ثبت شد - #' . $this->orderId)
            ->line('یک سفارش جدید با پرداخت موفق ثبت شد.')
            ->line('شماره سفارش: ' . $this->orderId)
            ->line('مبلغ کل: ' . number_format($this->totalAmount) . ' تومان')
            ->action('مشاهده در پنل ادمین', url('/admin/orders/' . $this->orderId));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->orderId,
            'total_amount' => $this->totalAmount,
        ];
    }
    public function toBale(object $notifiable): string
    {
        $order = Order::with(['items', 'addressSnapshot'])->find($this->orderId);

        if ($order === null) {
            return "سفارش #{$this->orderId} یافت نشد.";
        }

        $itemsText = $order->items
            ->map(fn ($item) => "- {$item->product_name} × {$item->quantity}")
            ->implode("\n");

        $address = $order->addressSnapshot;
        $addressText = $address
            ? "{$address->province_name}، {$address->city_name}، {$address->address_line}، پلاک {$address->plaque}"
            : 'آدرس ثبت نشده';

        return "🛒 سفارش جدید ثبت شد\n"
            . "شماره سفارش: #{$order->id}\n"
            . 'مبلغ کل: ' . number_format($order->total_amount) . " تومان\n\n"
            . "اقلام:\n{$itemsText}\n\n"
            . 'گیرنده: ' . ($address->recipient_name ?? '-') . ' (' . ($address->recipient_phone ?? '-') . ")\n"
            . "آدرس: {$addressText}";
    }    
}