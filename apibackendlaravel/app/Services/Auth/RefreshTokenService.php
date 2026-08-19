<?php

namespace App\Services\Auth;

use App\Exceptions\Auth\RefreshTokenExpiredException;
use App\Exceptions\Auth\RefreshTokenInvalidException;
use App\Exceptions\Auth\RefreshTokenReusedException;
use App\Models\RefreshToken;
use App\Models\User;
use App\Support\RefreshTokenIssued;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RefreshTokenService
{
    private int $graceSeconds;
    private int $ttlDays;

    public function __construct()
    {
        $this->graceSeconds = (int) config('refresh_tokens.grace_seconds', 10);
        $this->ttlDays = (int) config('refresh_tokens.ttl_days', 7);
    }

    /** شروع یه خانواده‌ی جدید (لاگین). */
    public function issueNew(User $user, Request $request): RefreshTokenIssued
    {
        return $this->createRecord(
            familyId: (string) Str::uuid(),
            userId: $user->id,
            request: $request,
        );
    }

    /**
     * توکن خام رو اعتبارسنجی و rotate می‌کنه.
     * @throws RefreshTokenInvalidException|RefreshTokenExpiredException|RefreshTokenReusedException
     */
    public function rotate(string $rawToken, Request $request): RefreshTokenIssued
    {
        $hash = hash('sha256', $rawToken);

        return DB::transaction(function () use ($hash, $request) {
            /** @var RefreshToken|null $token */
            $token = RefreshToken::where('token_hash', $hash)->lockForUpdate()->first();

            if (!$token) {
                throw new RefreshTokenInvalidException();
            }

            if ($token->revoked_at) {
                throw new RefreshTokenInvalidException();
            }

            if ($token->isExpired()) {
                $this->revokeFamily($token->family_id, $token->user_id);
                throw new RefreshTokenExpiredException();
            }

            // استفاده‌ی اول - مسیر عادی
            if ($token->used_at === null) {
                return $this->performRotation($token, $request);
            }

            // توکن قبلاً مصرف شده - آیا داخل grace window هستیم؟
            $elapsedSeconds = $token->used_at->diffInSeconds(now());

            if ($elapsedSeconds <= $this->graceSeconds) {
                $head = $this->resolveChainHead($token);

                if ($head->used_at === null) {
                    // race مشروع (StrictMode، تب موازی و...) - از سر زنجیره rotate کن
                    return $this->performRotation($head, $request);
                }
            }

            // خارج از grace window یا زنجیره هم مصرف‌شده - رخداد امنیتی
            $this->revokeFamily($token->family_id, $token->user_id);
            throw new RefreshTokenReusedException($token->user_id, $token->family_id);
        });
    }

    /** باطل‌کردن کل خانواده + همه‌ی توکن‌های دسترسی کاربر (force logout همه‌جا). */
    public function revokeFamily(string $familyId, ?int $userId = null): void
    {
        RefreshToken::where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        if ($userId) {
            User::find($userId)?->tokens()->delete();
        }
    }

    /** باطل‌کردن خانواده به‌درخواست کاربر (لاگ‌اوت عادی). */
    public function revokeByRawToken(string $rawToken): void
    {
        $hash = hash('sha256', $rawToken);
        $token = RefreshToken::where('token_hash', $hash)->first();

        if ($token) {
            $this->revokeFamily($token->family_id);
        }
    }

    private function performRotation(RefreshToken $token, Request $request): RefreshTokenIssued
    {
        $token->used_at = now();
        $token->save();

        $issued = $this->createRecord($token->family_id, $token->user_id, $request);

        $token->replaced_by_id = $issued->record->id;
        $token->save();

        return $issued;
    }

    private function resolveChainHead(RefreshToken $token): RefreshToken
    {
        $current = $token;

        while ($current->replaced_by_id !== null) {
            $next = RefreshToken::find($current->replaced_by_id);
            if (!$next) {
                break;
            }
            $current = $next;
        }

        return $current;
    }

    private function createRecord(string $familyId, int $userId, Request $request): RefreshTokenIssued
    {
        $plain = bin2hex(random_bytes(32)); // ۲۵۶ بیت آنتروپی
        $expiresAt = now()->addDays($this->ttlDays);

        $record = RefreshToken::create([
            'family_id' => $familyId,
            'user_id' => $userId,
            'token_hash' => hash('sha256', $plain),
            'expires_at' => $expiresAt,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        return new RefreshTokenIssued($record, $plain, $expiresAt);
    }
    public function revokeAllForUser(int $userId): void
    {
        RefreshToken::where('user_id', $userId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        User::find($userId)?->tokens()->delete();
    }
}