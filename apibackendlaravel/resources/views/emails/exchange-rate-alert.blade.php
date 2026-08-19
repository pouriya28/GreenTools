<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; direction: rtl;">
    <h2>هشدار سیستم قیمت‌گذاری</h2>
    <p>{{ $reason }}</p>
    @if (! empty($context))
        <pre style="background:#f4f4f4; padding:12px; border-radius:6px;">{{ json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</pre>
    @endif
    <p>لطفاً وضعیت نرخ ارز و قیمت محصولات را بررسی کنید.</p>
</body>
</html>