<?php

use App\Http\Responses\ApiResponse;
use App\Support\HttpStatusCodes;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'staff.access' => \App\Http\Middleware\StaffAccessMiddleware::class,
            'customer.access' => \App\Http\Middleware\CustomerAccessMiddleware::class,
            'account.active' => \App\Http\Middleware\EnsureAccountIsActive::class,
            'abilities' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
            'ability' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'verify.origin' => \App\Http\Middleware\VerifyOriginForCookie::class,
            'resolve-cart' => \App\Http\Middleware\ResolveCart::class,
            'validate-cart-ownership' => \App\Http\Middleware\ValidateCartOwnership::class, 
            'operation.verified' => \App\Http\Middleware\EnsureOperationVerified::class,
            ]);

        // ترتیب مهمه: RequestId باید همیشه اولین middleware باشه چون
        // SecurityHeaders و همه‌ی لاگ‌ها و پاسخ‌های بعدی به request_id وابسته‌ن.
        $middleware->api(prepend: [
            \App\Http\Middleware\RequestId::class,
        ]);
        $middleware->api(append: [
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        // ------------------------------------------------------------
        // لایه ۱: Authentication — 401
        // ------------------------------------------------------------
        $exceptions->renderable(function (AuthenticationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                message: 'توکن شما منقضی شده یا نامعتبر است. لطفاً دوباره وارد شوید.',
                code: 'UNAUTHENTICATED',
                status: 401,
            );
        });

        // ------------------------------------------------------------
        // لایه ۲: Authorization — 403
        // ------------------------------------------------------------
        $exceptions->renderable(function (AuthorizationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                message: 'شما دسترسی لازم برای این عملیات را ندارید.',
                code: 'FORBIDDEN',
                status: 403,
            );
        });

        // ------------------------------------------------------------
        // لایه ۳: Validation — 422 (پیام فیلدها از خود FormRequest میان)
        // ------------------------------------------------------------
        $exceptions->renderable(function (ValidationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                message: 'اطلاعات ارسالی معتبر نیست.',
                code: 'VALIDATION_ERROR',
                status: 422,
                errors: $e->errors(),
            );
        });

        // ------------------------------------------------------------
        // لایه ۴: Model Not Found — 404
        // پیام پیش‌فرض لاراول اسم کامل کلاس مدل رو لو می‌ده، این‌جا می‌گیریمش.
        // ------------------------------------------------------------
        $exceptions->renderable(function (ModelNotFoundException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                message: 'موردی با این مشخصات یافت نشد.',
                code: 'NOT_FOUND',
                status: 404,
            );
        });

        // ------------------------------------------------------------
        // لایه ۵: Rate Limiting — 429
        // ------------------------------------------------------------
        $exceptions->renderable(function (TooManyRequestsHttpException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                message: 'تعداد درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید.',
                code: 'RATE_LIMITED',
                status: 429,
                meta: ['retry_after' => $e->getHeaders()['Retry-After'] ?? null],
            );
        });

        // ------------------------------------------------------------
        // لایه ۶: Maintenance Mode — 503
        // ------------------------------------------------------------
        $exceptions->renderable(function (ServiceUnavailableHttpException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                message: 'سرویس موقتاً در حال به‌روزرسانی است. لطفاً کمی بعد تلاش کنید.',
                code: 'MAINTENANCE',
                status: 503,
                meta: ['retry_after' => $e->getRetryAfter()],
            );
        });

        // ------------------------------------------------------------
        // لایه ۷: خطاهای دیتابیس ناشناخته (مثل unique constraint از مسیر
        // غیرمنتظره). با کد جدا لاگ می‌شه تا از 500 عمومی قابل تفکیک باشه.
        // ------------------------------------------------------------
        $exceptions->renderable(function (QueryException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            Log::error('Unhandled database error', [
                'sql_state' => $e->errorInfo[0] ?? null,
                'driver_code' => $e->errorInfo[1] ?? null,
                'exception' => $e,
            ]);

            return ApiResponse::error(
                message: 'خطایی در پردازش اطلاعات رخ داد. لطفاً بعداً تلاش کنید.',
                code: 'DATABASE_ERROR',
                status: 500,
            );
        });

        // ------------------------------------------------------------
        // لایه ۷/ب — شبکه‌ی ایمنی موقت برای کدهای قدیمی:
        // اگه جایی از پروژه هنوز \DomainException خام throw می‌شه (به‌جای
        // ApiException)، این‌جا می‌گیریمش تا حداقل 422 با پیام درست برگرده
        // نه یه 500 عمومی. توصیه: هر جا این‌ها رو پیدا کردی، تبدیلشون کن
        // به یه زیرکلاس ApiException (مثل CategoryNotEmptyException) و
        // بعداً این بلاک رو حذف کن.
        // ------------------------------------------------------------
        $exceptions->renderable(function (\DomainException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            Log::notice('Legacy DomainException used — migrate to ApiException', [
                'message' => $e->getMessage(),
                'exception_class' => get_class($e),
            ]);

            return ApiResponse::error(
                message: $e->getMessage(),
                code: 'DOMAIN_ERROR',
                status: 422,
            );
        });

        // ------------------------------------------------------------
        // لایه ۸: catch-all بر اساس status code — پوشش‌دهنده‌ی هر
        // HttpExceptionInterface دیگه (405, 415, 409, ...) حتی مواردی که
        // بعداً تو نسخه‌های جدید لاراول اضافه بشن.
        // ------------------------------------------------------------
        $exceptions->renderable(function (HttpExceptionInterface $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = $e->getStatusCode();

            return ApiResponse::error(
                message: HttpStatusCodes::safeMessageFor($status),
                code: HttpStatusCodes::codeFor($status),
                status: $status,
            );
        });

        // ------------------------------------------------------------
        // لایه ۹: ApiException — خودش متد render() داره (در کلاس پایه)،
        // لاراول به‌صورت خودکار صداش می‌زنه، این‌جا کاری لازم نیست.
        // ------------------------------------------------------------

        // ------------------------------------------------------------
        // لایه ۱۰: fallback نهایی — هر Throwable ناشناخته (باگ واقعی).
        // حتی با APP_DEBUG=true، به کلاینت API پیام امن می‌ره؛ جزئیات کامل
        // فقط در storage/logs/laravel.log ثبت می‌شه.
        // ------------------------------------------------------------
        $exceptions->renderable(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            Log::error($e->getMessage(), [
                'exception' => $e,
                'class' => get_class($e),
            ]);

            return ApiResponse::error(
                message: 'خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید.',
                code: 'SERVER_ERROR',
                status: 500,
            );
        });
    })
    ->create();