{{-- resources/views/labels/sheet.blade.php --}}
<style>
    body { font-family: vazirmatn; direction: rtl; }
    .page { page-break-after: always; }
    .grid { display: flex; flex-wrap: wrap; }
    .label {
        width: {{ $labelWidthMm }}mm;
        height: {{ $labelHeightMm }}mm;
        border: 1px dashed #333;
        box-sizing: border-box;
        padding: 4mm;
        font-size: 10pt;
    }
    .label .sender { font-size: 8pt; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 2mm; margin-bottom: 2mm; }
    .label .recipient { font-size: 11pt; font-weight: bold; margin: 2mm 0; }
    .label .order-id { font-size: 9pt; color: #333; margin-top: 2mm; }
</style>

@foreach ($pages as $page)
    <div class="page">
        <div class="grid">
            @foreach ($page as $order)
                @php($address = $order->addressSnapshot)
                <div class="label">
                    <div class="sender">
                        فرستنده: {{ $sender->sender_name }} | {{ $sender->sender_phone }}<br>
                        {{ $sender->province_name }}، {{ $sender->city_name }}، {{ $sender->address_line }}
                    </div>
                    <div class="recipient">
                        {{ $address?->recipient_name ?? '-' }} | {{ $address?->recipient_phone ?? '-' }}
                    </div>
                    <div>
                        {{ $address?->province_name }}، {{ $address?->city_name }}، {{ $address?->district }}<br>
                        {{ $address?->address_line }}
                        @if ($address?->plaque) پلاک {{ $address->plaque }} @endif
                        @if ($address?->unit) واحد {{ $address->unit }} @endif
                        <br>کدپستی: {{ $address?->postal_code }}
                    </div>
                    <div class="order-id">سفارش #{{ $order->id }}</div>
                </div>
            @endforeach
        </div>
    </div>
@endforeach