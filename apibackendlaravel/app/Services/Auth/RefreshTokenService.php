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
        $this->graceSeconds = (int) config(
            'refresh_tokens.grace_seconds',
            10
        );

        $this->ttlDays = (int) config(
            'refresh_tokens.ttl_days',
            7
        );
    }

    public function issueNew(
        User $user,
        Request $request
    ): RefreshTokenIssued {
        return $this->createRecord(
            familyId: (string) Str::uuid(),
            userId: $user->id,
            request: $request,
        );
    }

    /**
     * @throws RefreshTokenInvalidException
     * @throws RefreshTokenExpiredException
     * @throws RefreshTokenReusedException
     */
    public function rotate(
        string $rawToken,
        Request $request
    ): RefreshTokenIssued {
        $hash = hash('sha256', $rawToken);

        $result = DB::transaction(function () use (
            $hash,
            $request
        ): RefreshTokenIssued|RefreshTokenExpiredException|RefreshTokenReusedException {
            /** @var RefreshToken|null $token */
            $token = RefreshToken::query()
                ->where('token_hash', $hash)
                ->lockForUpdate()
                ->first();

            if (! $token) {
                throw new RefreshTokenInvalidException();
            }

            if ($token->revoked_at) {
                throw new RefreshTokenInvalidException();
            }

            if ($token->isExpired()) {
                $this->revokeFamily(
                    $token->family_id,
                    $token->user_id
                );

                // Return the exception so the revocation transaction commits.
                return new RefreshTokenExpiredException();
            }

            if ($token->used_at === null) {
                return $this->performRotation($token, $request);
            }

            $elapsedSeconds = $token->used_at->diffInSeconds(now());

            if ($elapsedSeconds <= $this->graceSeconds) {
                $head = $this->resolveChainHead($token);

                if ($head->used_at === null) {
                    return $this->performRotation($head, $request);
                }
            }

            $this->revokeFamily(
                $token->family_id,
                $token->user_id
            );

            // Throwing inside the transaction would roll back revocation.
            return new RefreshTokenReusedException(
                $token->user_id,
                $token->family_id
            );
        });

        if (
            $result instanceof RefreshTokenExpiredException
            || $result instanceof RefreshTokenReusedException
        ) {
            throw $result;
        }

        return $result;
    }

    public function revokeFamily(
        string $familyId,
        ?string $userId = null
    ): void {
        RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        if ($userId) {
            User::find($userId)?->tokens()->delete();
        }
    }

    public function revokeByRawToken(string $rawToken): void
    {
        $hash = hash('sha256', $rawToken);

        $token = RefreshToken::query()
            ->where('token_hash', $hash)
            ->first();

        if ($token) {
            $this->revokeFamily($token->family_id);
        }
    }

    public function revokeAllForUser(string $userId): void
    {
        RefreshToken::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        User::find($userId)?->tokens()->delete();
    }

    private function performRotation(
        RefreshToken $token,
        Request $request
    ): RefreshTokenIssued {
        $token->used_at = now();
        $token->save();

        $issued = $this->createRecord(
            $token->family_id,
            $token->user_id,
            $request
        );

        $token->replaced_by_id = $issued->record->id;
        $token->save();

        return $issued;
    }

    private function resolveChainHead(
        RefreshToken $token
    ): RefreshToken {
        $current = $token;

        while ($current->replaced_by_id !== null) {
            $next = RefreshToken::find($current->replaced_by_id);

            if (! $next) {
                break;
            }

            $current = $next;
        }

        return $current;
    }

    private function createRecord(
        string $familyId,
        string $userId,
        Request $request
    ): RefreshTokenIssued {
        $plainToken = bin2hex(random_bytes(32));
        $expiresAt = now()->addDays($this->ttlDays);

        $record = RefreshToken::create([
            'family_id' => $familyId,
            'user_id' => $userId,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => $expiresAt,
            'ip_address' => $request->ip(),
            'user_agent' => substr(
                (string) $request->userAgent(),
                0,
                255
            ),
        ]);

        return new RefreshTokenIssued(
            $record,
            $plainToken,
            $expiresAt
        );
    }
}