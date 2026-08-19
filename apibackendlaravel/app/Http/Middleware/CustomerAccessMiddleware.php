<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomerAccessMiddleware
{
    /**
     * فقط کاربرانی که user_type = 'customer' (یعنی isStaff() === false) هستن
     * اجازه‌ی عبور دارن. این مانع میشه که یه توکن staff بتونه از endpoint های
     * مخصوص مشتری (مثل سبد خرید/سفارش) استفاده کنه و برعکس.
     * بررسی is_active عمداً اینجا نیست، مسئولیت middleware جدای «account.active»ست.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user || $user->isStaff()) {
            return response()->json([
                'message' => 'دسترسی این بخش فقط برای مشتریان مجاز است.',
            ], 403);
        }

        return $next($request);
    }
}