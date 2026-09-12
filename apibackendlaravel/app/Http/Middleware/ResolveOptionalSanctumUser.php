<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * برای مسیرهایی که هم مهمان و هم کاربر لاگین‌شده باید بتونن ازشون استفاده
 * کنن (مثل ثبت کامنت). اگه توکن Bearer معتبر sanctum وجود داشته باشه،
 * $request->user() رو به همون کاربر resolve می‌کنه؛ در غیر این صورت هیچ
 * خطایی نمی‌ده و درخواست به‌عنوان مهمان ادامه پیدا می‌کنه.
 *
 * بدون این middleware، $request->user() همیشه null برمی‌گرده چون گارد
 * پیش‌فرض اپلیکیشن sanctum نیست و هیچ middleware دیگه‌ای گارد sanctum رو
 * برای این مسیر فعال نمی‌کنه.
 */
class ResolveOptionalSanctumUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('sanctum')->user();

        if ($user !== null) {
            $request->setUserResolver(fn () => $user);
        }

        return $next($request);
    }
}