<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimiterServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // حداکثر ۶ تلاش ورود در دقیقه، بر اساس ترکیب IP و شناسه ورودی (ضد Brute-force)
        RateLimiter::for('admin-login', function (Request $request) {
            $key = strtolower((string) $request->input('login')).'|'.$request->ip();
            return Limit::perMinute(6)->by($key);
        });

        // حداکثر ۳ درخواست ارسال کد در دقیقه بر اساس IP (علاوه بر cooldown داخل Redis)
        RateLimiter::for('otp-send', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        // حداکثر ۱۰ تلاش verify در دقیقه بر اساس IP
        RateLimiter::for('otp-verify', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // محدودیت درخواست فراموشی رمز عبور
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(6)->by($request->ip());
        });

        // نوشتن روی سبد خرید (add/update/remove) - بر اساس کاربر، یا در نبود آن
        // توکن مهمان، و در نبود آن IP.
        RateLimiter::for('cart-write', function (Request $request) {
            $identity = $request->user()?->id ?? $request->cookie('cart_guest_token') ?? $request->ip();
            return Limit::perMinute(30)->by('cart-write:'.$identity);
        });

        // شروع چک‌اوت - محدودیت سخت‌گیرانه‌تر چون سفارش/رزرو موجودی می‌سازد.
        RateLimiter::for('checkout', function (Request $request) {
            return Limit::perMinute(5)->by('checkout:'.$request->user()->id);
        });

        // رمز تأیید عملیات - عملاً یه پسورد دومه، پس همون محافظت ضد brute-force لاگین رو می‌خواد.
        RateLimiter::for('operation-password', function (Request $request) {
            // ترکیب user_id + IP: اگه attacker از IP دیگه‌ای trial کنه، باز هم block می‌شه
            $userId = $request->user()?->id ?? 'guest';
            $key    = "op-pwd:{$userId}|{$request->ip()}";

            return [
                // حداکثر ۵ تلاش در دقیقه (محافظت real-time)
                Limit::perMinute(5)->by($key),
                // حداکثر ۱۰ تلاش در ۱۵ دقیقه (محافظت slow-brute-force)
                Limit::perMinutes(15, 10)->by($key),
            ];
        });

        // رفرش خودکار توکن (هر بار لود صفحه/تب) سقف بالاتری لازم داره؛ کلید بر
        // اساس هش کوکی refresh_token (نه IP) تا کاربرهای پشت یک NAT مشترک روی هم اثر نذارن.
        RateLimiter::for('token-refresh', function (Request $request) {
            $rawToken = (string) $request->cookie('refresh_token', '');
            $clientIp = (string) $request->ip();

            $tokenKey = $rawToken !== ''
                ? 'refresh-token:'.hash('sha256', $rawToken)
                : 'refresh-token-missing:'.$clientIp;

            return [
                // Stable protection across successful token rotations.
                Limit::perMinute(60)->by('refresh-ip:'.$clientIp),

                // Protects repeated use of the same token and invalid/replay attempts.
                Limit::perMinute(30)->by($tokenKey),
            ];
        });

        RateLimiter::for('reverse-geocode', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('search-address', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('comment-write', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?? $request->ip());
        });

        // برای رفع باگ throttle نبودن verify-2fa/enable-2fa/disable-2fa
        RateLimiter::for('2fa-verify', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });
    }
}