<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\OtpChannel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\SendCustomerOtpRequest;
use App\Http\Requests\Api\Auth\VerifyCustomerOtpRequest;
use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use App\Services\OtpService;
use App\Traits\ManagesAuthTokens;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerOtpController extends Controller
{
    use ManagesAuthTokens;

    public function __construct(protected OtpService $otpService) {}

    public function send(SendCustomerOtpRequest $request): JsonResponse
    {
        $channel = OtpChannel::from($request->string('channel')->value());
        $identifier = $request->identifier();

        $result = $this->otpService->send($identifier, $channel);

        return response()->json(
            ['message' => $result['message']],
            $result['status'] ? 200 : ($result['code'] ?? 422)
        );
    }

    public function verify(VerifyCustomerOtpRequest $request): JsonResponse
    {
        $channel = OtpChannel::from($request->string('channel')->value());
        $identifier = $request->identifier();

        $result = $this->otpService->verify($identifier, $channel, $request->string('code')->value());

        if (!$result['status']) {
            return response()->json(['message' => $result['message']], 422);
        }

        // channel->value برابر است با نام ستون در دیتابیس ('phone' یا 'email')
        $field = $channel->value;
        $verifiedAtField = "{$field}_verified_at";

        // user_type/is_active عمداً guarded هستند؛ به همین دلیل با تخصیص مستقیم
        // (نه Mass Assignment) مقداردهی می‌شوند تا از privilege escalation جلوگیری شود.
        $user = User::firstOrNew([$field => $identifier]);
        if (!$user->exists) {
            $user->name = 'مشتری جدید';
            $user->user_type = 'customer';
            $user->is_active = true;
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'حساب کاربری شما مسدود شده است.',
            ], 403);
        }

        if (!$user->{$verifiedAtField}) {
            $user->{$verifiedAtField} = now();
        }
        $user->last_login_at = now();
        $user->save();

        event(new Login('customer_auth', $user, false));

        return $this->issueTokenPair($user, 'customer_auth', ['customer:api']);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $rawRefreshToken = $request->cookie('refresh_token');
        if ($rawRefreshToken) {
            app(RefreshTokenService::class)->revokeByRawToken($rawRefreshToken);
        }

        $user->tokens()->delete();

        return response()->json([
            'message' => 'با موفقیت از حساب کاربری خارج شدید.',
        ], 200)
            ->withoutCookie('refresh_token', '/api/v1/auth')
            ->withCookie(\Illuminate\Support\Facades\Cookie::forget('refresh_token', '/api/v1/auth/refresh'));
    }
    public function logoutAll(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->revokeAllSessions($user);
    }
}