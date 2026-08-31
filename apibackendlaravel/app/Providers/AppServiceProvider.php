<?php

namespace App\Providers;

use App\Listeners\MergeGuestCartOnLogin;
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
    }

    public function boot(): void
    {
        // پالیسی‌های محصول/دسته‌بندی - پنل Filament و هر جای دیگه‌ی برنامه از همینا استفاده می‌کنن
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);

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

        // ادغام سبد مهمان با سبد کاربر، مستقل از مسیر ورود (فرم لاگین، Sanctum SPA، و...).
        Event::listen(Login::class, MergeGuestCartOnLogin::class);
    }
}