<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Exceptions\Auth\AccountInactiveException;
use App\Exceptions\Auth\RefreshTokenInvalidException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use App\Traits\ManagesAuthTokens;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TokenController extends Controller
{
    use ManagesAuthTokens;

    public function __construct(private readonly RefreshTokenService $refreshTokenService) {}

    public function refresh(Request $request): JsonResponse
    {
        $rawToken = $request->cookie('refresh_token');

        if (!$rawToken) {
            throw new RefreshTokenInvalidException();
        }

        $refresh = $this->refreshTokenService->rotate($rawToken, $request);

        /** @var User|null $user */
        $user = $refresh->record->user;

        if (!$user instanceof User || !$user->is_active) {
            $this->refreshTokenService->revokeFamily($refresh->record->family_id, $user?->id);
            throw new AccountInactiveException();
        }

        $tokenName = $user->isStaff() ? 'staff_auth' : 'customer_auth';
        $abilities = $user->isStaff() ? ['*'] : ['customer:api'];

        return $this->issueRotatedTokenPair($user, $refresh, $tokenName, $abilities);
    }
}