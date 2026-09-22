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
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
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

        // ادغام سبد مهمان با سبد کاربر، مستقل از مسیر ورود (فرم لاگین، Sanctum SPA، و...).
        Event::listen(Login::class, MergeGuestCartOnLogin::class);

        // NEW: level-up notification hook — see RecordLevelUpgradeNotification
        // for why this is intentionally minimal for now.
        Event::listen(LevelUpgraded::class, RecordLevelUpgradeNotification::class);
        Event::listen(\App\Events\OrderPlaced::class, \App\Listeners\NotifyAdminsOfNewOrder::class);
    }
}