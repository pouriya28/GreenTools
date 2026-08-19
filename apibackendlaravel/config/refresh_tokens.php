<?php

return [
    // پنجره‌ی زمانی که استفاده‌ی دوباره از توکن قبلی رو race مشروع فرض می‌کنیم
    // (نه سرقت). بعد از این مدت، reuse = رخداد امنیتی.
    'grace_seconds' => (int) env('REFRESH_TOKEN_GRACE_SECONDS', 10),

    'ttl_days' => (int) env('REFRESH_TOKEN_TTL_DAYS', 7),
];