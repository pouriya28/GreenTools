<?php

namespace App\Services;

use App\Enums\OtpChannel;
use App\Services\Mail\MailServiceInterface;
use App\Services\Sms\SmsServiceInterface;
use Illuminate\Support\Facades\Redis;

class OtpService
{
    protected int $ttl = 120;              // اعتبار کد (ثانیه)
    protected int $maxAttempts = 5;        // حداکثر تلاش اشتباه برای verify
    protected int $cooldownSeconds = 60;   // فاصله بین دو ارسال متوالی
    protected int $maxSendsPerHour = 5;    // سقف ارسال در هر ساعت برای هر شناسه

    public function __construct(
        protected SmsServiceInterface $smsService,
        protected MailServiceInterface $mailService,
    ) {}

    public function send(string $identifier, OtpChannel $channel): array
    {
        $key = $this->normalizedKey($identifier, $channel);
        $cooldownKey = "otp_cooldown:{$key}";
        $otpKey = "otp:{$key}";
        $hourlyKey = "otp_hourly:{$key}";

        if (Redis::exists($cooldownKey)) {
            $ttlLeft = Redis::ttl($cooldownKey);

            return [
                'status' => false,
                'message' => "لطفاً {$ttlLeft} ثانیه دیگر مجدداً تلاش کنید.",
                'code' => 429,
            ];
        }

        if ((int) Redis::get($hourlyKey) >= $this->maxSendsPerHour) {
            return [
                'status' => false,
                'message' => 'تعداد درخواست‌های شما در این ساعت بیش از حد مجاز است.',
                'code' => 429,
            ];
        }

        $code = (string) random_int(100000, 999999);

        Redis::hmset($otpKey, [
            'code' => password_hash($code, PASSWORD_BCRYPT),
            'attempts' => 0,
        ]);
        Redis::expire($otpKey, $this->ttl);

        Redis::setex($cooldownKey, $this->cooldownSeconds, '1');

        Redis::incr($hourlyKey);
        Redis::expire($hourlyKey, 3600);

        match ($channel) {
            OtpChannel::Sms => $this->smsService->sendOtp($identifier, $code),
            OtpChannel::Mail => $this->mailService->sendOtp($identifier, $code),
        };

        return [
            'status' => true,
            'message' => $channel === OtpChannel::Sms
                ? 'کد تایید به شماره موبایل شما ارسال شد.'
                : 'کد تایید به ایمیل شما ارسال شد.',
            'expires_in' => $this->ttl,
        ];
    }

    public function verify(string $identifier, OtpChannel $channel, string $code): array
    {
        $key = $this->normalizedKey($identifier, $channel);
        $otpKey = "otp:{$key}";

        if (!Redis::exists($otpKey)) {
            return [
                'status' => false,
                'message' => 'کد تایید منقضی شده یا یافت نشد.',
            ];
        }

        $data = Redis::hgetall($otpKey);
        $attempts = (int) ($data['attempts'] ?? 0);

        if ($attempts >= $this->maxAttempts) {
            Redis::del($otpKey);

            return [
                'status' => false,
                'message' => 'تعداد تلاش‌های اشتباه بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.',
            ];
        }

        if (!password_verify($code, $data['code'] ?? '')) {
            Redis::hincrby($otpKey, 'attempts', 1);
            $remaining = $this->maxAttempts - ($attempts + 1);

            return [
                'status' => false,
                'message' => "کد وارد شده اشتباه است. ({$remaining} تلاش باقی مانده)",
            ];
        }

        Redis::del($otpKey);
        Redis::del("otp_cooldown:{$key}");

        return ['status' => true];
    }

    private function normalizedKey(string $identifier, OtpChannel $channel): string
    {
        return $channel->value.':'.mb_strtolower(trim($identifier));
    }
}
