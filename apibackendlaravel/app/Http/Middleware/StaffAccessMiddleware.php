<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffAccessMiddleware
{
    /**
     * فقط کاربرانی که user_type = 'staff' هستن اجازه‌ی عبور دارن.
     * بررسی is_active عمداً اینجا نیست — طبق تفکیک مسئولیت، اون کار
     * middleware جدای «account.active» ئه (که احتمالاً از قبل داری).
     * این باعث میشه پیام خطا برای هر حالت (نقش نادرست / حساب غیرفعال)
     * دقیق و جدا باشه، نه یه پیام کلی مبهم.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user || !$user->isStaff()) {
            return response()->json([
                'message' => 'دسترسی این بخش فقط برای کارکنان فروشگاه مجاز است.',
            ], 403);
        }

        return $next($request);
    }
}