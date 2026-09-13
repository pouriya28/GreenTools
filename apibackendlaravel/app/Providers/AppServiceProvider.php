<?php

namespace App\Providers;

use App\Events\LevelUpgraded;
use App\Listeners\MergeGuestCartOnLogin;
use App\Listeners\RecordLevelUpgradeNotification;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Policies\CategoryPolicy;
use App\Policies\ProductPolicy;
use App\Services\Mail\LaravelMailOtpService;
use App\Services\Mail\MailServiceInterface;
use App\Services\Sms\LogSmsService;
use App\Services\Sms\SmsServiceInterface;
use Illuminate\Auth\Events\Login;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use App\Models\Comment;
use App\Policies\CommentPolicy;
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SmsServiceInterface::class, LogSmsService::class);
        $this->app->bind(MailServiceInterface::class, LaravelMailOtpService::class);
        $this->app->bind(
            \App\Services\Pricing\ExchangeRateProviderInterface::class,
            \App\Services\Pricing\NavasanExchangeRateProvider::class
        );

        // Placeholder until a real payment gateway is selected (see
        // ORDER_SYSTEM_SPECIFICATION.md, section 5.1). AbstractPaymentGateway
        // fails closed on every method so nothing can be marked "paid" by mistake.
        $this->app->bind(
            \App\Contracts\PaymentGatewayInterface::class,
            \App\Services\Payments\AbstractPaymentGateway::class
        );
        $this->app->bind(
            \App\Contracts\ShippingCalculatorInterface::class,
            \App\Services\Shipping\ManualShippingCalculator::class
        );
    }

    public function boot(): void
    {
        // پالیسی‌های محصول/دسته‌بندی - پنل Filament و هر جای دیگه‌ی برنامه از همینا استفاده می‌کنن
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(\App\Models\ShippingMethod::class, \App\Policies\ShippingMethodPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(\App\Models\Order::class, \App\Policies\OrderPolicy::class);
        Gate::policy(\App\Models\SenderAddress::class, \App\Policies\SenderAddressPolicy::class);
        // فقط این مدل‌ها اجازه دارن taggable/metable باشن — بدون این، هر مدلی
        // (حتی User یا Order) از نظر DB می‌تونست به‌عنوان taggable_type/metable_type ثبت بشه.
        //
        // نکته مهم: enforceMorphMap سراسریه و روی همه‌ی رابطه‌های polymorphic
        // کل اپلیکیشن اعمال می‌شه — از جمله رابطه‌ی داخلی Sanctum بین
        // PersonalAccessToken و User (tokenable). به همین دلیل User هم باید
        // اینجا ثبت بشه، وگرنه لاگین/احراز هویت با ClassMorphViolationException
        // شکست می‌خوره.
        Relation::enforceMorphMap([
            'category' => Category::class,
            'product' => Product::class,
            'user' => User::class,
            
            // 'blog' => \App\Models\Blog::class, // وقتی مدل Blog ساخته شد اضافه کن
        ]);

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

        // NEW: rate limiting for the operation-password set/verify endpoints —
        // this is effectively a second password, so it needs the same
        // brute-force protection as login, keyed by user + IP together.
        RateLimiter::for('operation-password', function (Request $request) {
            return Limit::perMinutes(15, 3)->by('op-pwd:'.$request->user()?->id.'|'.$request->ip());
        });
        // Refresh happens automatically on every page load/tab, unlike login which
        // the user triggers rarely — so it needs a much higher ceiling. Keying by
        // the refresh_token cookie itself (hashed, never the raw value) instead of
        // just IP means a shared/NAT IP with several legitimate users doesn't
        // throttle all of them together; only a single token being hammered does.
        RateLimiter::for('token-refresh', function (Request $request) {
            $rawToken = $request->cookie('refresh_token');
            $key = $rawToken
                ? 'refresh-token:'.hash('sha256', $rawToken)
                : 'refresh-ip:'.$request->ip();

            return Limit::perMinute(30)->by($key);
        });
        RateLimiter::for('reverse-geocode', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });
        RateLimiter::for('search-address', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });
        RateLimiter::for('comment-write', function (\Illuminate\Http\Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?? $request->ip());
        });

        // ادغام سبد مهمان با سبد کاربر، مستقل از مسیر ورود (فرم لاگین، Sanctum SPA، و...).
        Event::listen(Login::class, MergeGuestCartOnLogin::class);

        // NEW: level-up notification hook — see RecordLevelUpgradeNotification
        // for why this is intentionally minimal for now.
        Event::listen(LevelUpgraded::class, RecordLevelUpgradeNotification::class);
        Event::listen(\App\Events\OrderPlaced::class, \App\Listeners\NotifyAdminsOfNewOrder::class);
        
    }
}