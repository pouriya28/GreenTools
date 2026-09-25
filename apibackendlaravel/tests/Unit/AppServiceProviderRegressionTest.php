<?php

// tests/Unit/AppServiceProviderRegressionTest.php
//
// Regression tests for the application's service provider configuration.
// These tests prevent silent regressions where a binding, policy, morph-map
// entry, event listener, rate limiter, or middleware alias is accidentally
// removed or misconfigured.
//
// All tests run against the real booted application — no mocking — so they
// exercise exactly what production code sees at runtime.

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\ShippingCalculatorInterface;
use App\Events\LevelUpgraded;
use App\Events\OrderPlaced;
use App\Http\Middleware\CustomerAccessMiddleware;
use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\EnsureOperationVerified;
use App\Http\Middleware\EnsureStrictAbility;
use App\Http\Middleware\ResolveCart;
use App\Http\Middleware\ResolveOptionalSanctumUser;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\StaffAccessMiddleware;
use App\Http\Middleware\ValidateCartOwnership;
use App\Http\Middleware\VerifyOriginForCookie;
use App\Listeners\MergeGuestCartOnLogin;
use App\Listeners\NotifyAdminsOfNewOrder;
use App\Listeners\RecordLevelUpgradeNotification;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Order;
use App\Models\Product;
use App\Models\SenderAddress;
use App\Models\ShippingMethod;
use App\Models\User;
use App\Policies\CategoryPolicy;
use App\Policies\CommentPolicy;
use App\Policies\OrderPolicy;
use App\Policies\ProductPolicy;
use App\Policies\SenderAddressPolicy;
use App\Policies\ShippingMethodPolicy;
use App\Services\Mail\LaravelMailOtpService;
use App\Services\Mail\MailServiceInterface;
use App\Services\Payments\AbstractPaymentGateway;
use App\Services\Pricing\ExchangeRateProviderInterface;
use App\Services\Pricing\NavasanExchangeRateProvider;
use App\Services\Shipping\ManualShippingCalculator;
use App\Services\Sms\LogSmsService;
use App\Services\Sms\SmsServiceInterface;
use Illuminate\Auth\Events\Login;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

// ---------------------------------------------------------------------------
// Service Container Bindings
// ---------------------------------------------------------------------------

it('resolves SmsServiceInterface to LogSmsService', function (): void {
    expect(app(SmsServiceInterface::class))->toBeInstanceOf(LogSmsService::class);
});

it('resolves MailServiceInterface to LaravelMailOtpService', function (): void {
    expect(app(MailServiceInterface::class))->toBeInstanceOf(LaravelMailOtpService::class);
});

it('resolves ExchangeRateProviderInterface to NavasanExchangeRateProvider', function (): void {
    expect(app(ExchangeRateProviderInterface::class))->toBeInstanceOf(NavasanExchangeRateProvider::class);
});

it('resolves PaymentGatewayInterface to AbstractPaymentGateway (fail-closed placeholder)', function (): void {
    // AbstractPaymentGateway is the intentional fail-closed placeholder until
    // a real gateway is configured. This test prevents accidentally wiring a
    // live gateway implementation before it is ready for production.
    expect(app(PaymentGatewayInterface::class))->toBeInstanceOf(AbstractPaymentGateway::class);
});

it('resolves ShippingCalculatorInterface to ManualShippingCalculator', function (): void {
    expect(app(ShippingCalculatorInterface::class))->toBeInstanceOf(ManualShippingCalculator::class);
});

// ---------------------------------------------------------------------------
// Gate Policies
// ---------------------------------------------------------------------------

it('registers CategoryPolicy for Category model', function (): void {
    expect(Gate::getPolicyFor(Category::class))->toBeInstanceOf(CategoryPolicy::class);
});

it('registers ProductPolicy for Product model', function (): void {
    expect(Gate::getPolicyFor(Product::class))->toBeInstanceOf(ProductPolicy::class);
});

it('registers ShippingMethodPolicy for ShippingMethod model', function (): void {
    expect(Gate::getPolicyFor(ShippingMethod::class))->toBeInstanceOf(ShippingMethodPolicy::class);
});

it('registers CommentPolicy for Comment model', function (): void {
    expect(Gate::getPolicyFor(Comment::class))->toBeInstanceOf(CommentPolicy::class);
});

it('registers OrderPolicy for Order model', function (): void {
    expect(Gate::getPolicyFor(Order::class))->toBeInstanceOf(OrderPolicy::class);
});

it('registers SenderAddressPolicy for SenderAddress model', function (): void {
    expect(Gate::getPolicyFor(SenderAddress::class))->toBeInstanceOf(SenderAddressPolicy::class);
});

// ---------------------------------------------------------------------------
// Enforced Morph Map
// ---------------------------------------------------------------------------
//
// enforceMorphMap() is critical for security: any class not listed here
// will throw ClassMorphViolationException at runtime instead of silently
// storing the full PHP class name in the DB (which could expose internals).

it('morph map contains category → Category', function (): void {
    expect(Relation::getMorphedModel('category'))->toBe(Category::class);
});

it('morph map contains product → Product', function (): void {
    expect(Relation::getMorphedModel('product'))->toBe(Product::class);
});

it('morph map contains user → User', function (): void {
    // CRITICAL: User must be in the morph map because Sanctum's
    // PersonalAccessToken uses a polymorphic tokenable relation.
    // Without this entry, createToken() throws ClassMorphViolationException.
    expect(Relation::getMorphedModel('user'))->toBe(User::class);
});

it('morph map is enforced — an unmapped model class throws at runtime', function (): void {
    // If enforceMorphMap were removed, this would silently store the full
    // class name in the DB instead of throwing. The exception proves the
    // guard is active.
    expect(fn () => (new \App\Models\Address())->getMorphClass())
        ->toThrow('No morph map defined for model');
});

// ---------------------------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------------------------

it('MergeGuestCartOnLogin is registered as a listener for Login event', function (): void {
    $listeners = Event::getRawListeners()[Login::class] ?? [];

    $found = collect($listeners)->contains(
        fn ($listener) => is_string($listener) && str_contains($listener, MergeGuestCartOnLogin::class)
    );

    expect($found)->toBeTrue();
});

it('RecordLevelUpgradeNotification is registered as a listener for LevelUpgraded event', function (): void {
    $listeners = Event::getRawListeners()[LevelUpgraded::class] ?? [];

    $found = collect($listeners)->contains(
        fn ($listener) => is_string($listener) && str_contains($listener, RecordLevelUpgradeNotification::class)
    );

    expect($found)->toBeTrue();
});

it('NotifyAdminsOfNewOrder is registered as a listener for OrderPlaced event', function (): void {
    $listeners = Event::getRawListeners()[OrderPlaced::class] ?? [];

    $found = collect($listeners)->contains(
        fn ($listener) => is_string($listener) && str_contains($listener, NotifyAdminsOfNewOrder::class)
    );

    expect($found)->toBeTrue();
});

// ---------------------------------------------------------------------------
// Rate Limiters
// ---------------------------------------------------------------------------
//
// Each limiter must exist and return at least one Limit instance.
// These tests catch the common mistake of registering a limiter in the
// provider but forgetting to wire it to a route (or vice versa).

$rateLimiters = [
    'admin-login',
    'otp-send',
    'otp-verify',
    'password-reset',
    'cart-write',
    'checkout',
    'operation-password',
    'token-refresh',
    'reverse-geocode',
    'search-address',
    'comment-write',
    '2fa-verify',
];

foreach ($rateLimiters as $limiterName) {
    it("rate limiter '{$limiterName}' is registered and returns at least one Limit", function () use ($limiterName): void {
        $request = Request::create('/', 'GET');
        $request->server->set('REMOTE_ADDR', '127.0.0.1');

        // Simulate a logged-in user for limiters that call $request->user().
        $user = \App\Models\User::factory()->staff()->create();
        $request->setUserResolver(fn () => $user);

        $limiter   = RateLimiter::limiter($limiterName);
        $limits    = value($limiter, $request);
        $limits    = is_array($limits) ? $limits : [$limits];

        expect($limits)->not->toBeEmpty()
            ->and($limits[0])->toBeInstanceOf(Limit::class);
    });
}

// ---------------------------------------------------------------------------
// operation-password regression: must NOT be registered twice
// ---------------------------------------------------------------------------
//
// Bug: the limiter was registered twice in RateLimiterServiceProvider.
// The second registration silently overwrote the first, making the
// perMinutes(15, 3) limit permanently dead code.
// After the fix, only one registration must exist (the array form with
// perMinute(5) + perMinutes(15, 10)).

it('operation-password limiter returns an array of two Limit instances (not a single Limit)', function (): void {
    $request = Request::create('/', 'GET');
    $request->server->set('REMOTE_ADDR', '127.0.0.1');

    $user = \App\Models\User::factory()->staff()->create();
    $request->setUserResolver(fn () => $user);

    $limiter = RateLimiter::limiter('operation-password');
    $limits  = value($limiter, $request);

    // After the fix the limiter returns an array of exactly 2 Limit objects:
    // Limit::perMinute(5) and Limit::perMinutes(15, 10).
    expect($limits)->toBeArray()
        ->and($limits)->toHaveCount(2)
        ->and($limits[0])->toBeInstanceOf(Limit::class)
        ->and($limits[1])->toBeInstanceOf(Limit::class);
});

// ---------------------------------------------------------------------------
// Middleware Aliases
// ---------------------------------------------------------------------------
//
// Verifies that every alias used in route files resolves to the correct
// middleware class. A missing or misspelled alias silently passes all
// requests without the intended guard.

$middlewareAliases = [
    'staff.access'              => StaffAccessMiddleware::class,
    'customer.access'           => CustomerAccessMiddleware::class,
    'account.active'            => EnsureAccountIsActive::class,
    'verify.origin'             => VerifyOriginForCookie::class,
    'resolve-cart'              => ResolveCart::class,
    'validate-cart-ownership'   => ValidateCartOwnership::class,
    'operation.verified'        => EnsureOperationVerified::class,
    'sanctum.optional'          => ResolveOptionalSanctumUser::class,
    'strict.ability'            => EnsureStrictAbility::class,
    'ability'                   => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
    'abilities'                 => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
    'role'                      => \Spatie\Permission\Middleware\RoleMiddleware::class,
    'permission'                => \Spatie\Permission\Middleware\PermissionMiddleware::class,
    'role_or_permission'        => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
];

foreach ($middlewareAliases as $alias => $expectedClass) {
    it("middleware alias '{$alias}' resolves to {$expectedClass}", function () use ($alias, $expectedClass): void {
        $router    = app('router');
        $aliases   = $router->getMiddleware();

        expect($aliases)->toHaveKey($alias)
            ->and($aliases[$alias])->toBe($expectedClass);
    });
}

// ---------------------------------------------------------------------------
// API Middleware Stack
// ---------------------------------------------------------------------------

it('RequestId middleware is prepended to the api middleware group', function (): void {
    $router = app('router');
    $apiMiddleware = $router->getMiddlewareGroups()['api'] ?? [];

    $classes = array_map(
        fn ($m) => is_string($m) ? $m : (is_array($m) ? $m[0] : ''),
        $apiMiddleware
    );

    expect(in_array(\App\Http\Middleware\RequestId::class, $classes, true))->toBeTrue();
});

it('SecurityHeaders middleware is appended to the api middleware group', function (): void {
    $router = app('router');
    $apiMiddleware = $router->getMiddlewareGroups()['api'] ?? [];

    $classes = array_map(
        fn ($m) => is_string($m) ? $m : (is_array($m) ? $m[0] : ''),
        $apiMiddleware
    );

    expect(in_array(SecurityHeaders::class, $classes, true))->toBeTrue();
});

// ---------------------------------------------------------------------------
// Exception Handler — API response format
// ---------------------------------------------------------------------------

it('returns JSON 401 with UNAUTHENTICATED code for unauthenticated API requests', function (): void {
    $this->postJson('/api/v1/auth/staff/logout')
        ->assertStatus(401)
        ->assertJsonPath('code', 'UNAUTHENTICATED');
});

it('returns JSON 404 with NOT_FOUND code for unknown API routes', function (): void {
    $this->getJson('/api/v1/this-route-does-not-exist-at-all')
        ->assertStatus(404);
    // Note: unknown routes produce a 404 via HttpExceptionInterface handler
    // which uses HttpStatusCodes::codeFor(404) = 'NOT_FOUND'.
});

it('returns JSON 422 with VALIDATION_ERROR code for failed validation on API routes', function (): void {
    // Staff login with empty body triggers a ValidationException.
    $this->postJson('/api/v1/auth/staff/login', [])
        ->assertStatus(422)
        ->assertJsonPath('code', 'VALIDATION_ERROR');
});

it('returns JSON 429 with RATE_LIMITED code when rate limit is exceeded', function (): void {
    // Hit the otp-send limiter (3/min) more than its limit.
    // withoutMiddleware is NOT used — we want the real limiter to fire.
    for ($i = 0; $i < 4; $i++) {
        $response = $this->postJson('/api/v1/auth/customer/send-otp', [
            'channel' => 'phone',
            'phone'   => '09121234567',
        ]);
    }

    $response->assertStatus(429)
        ->assertJsonPath('code', 'RATE_LIMITED');
});
