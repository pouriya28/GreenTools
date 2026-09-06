<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Loyalty\LoyaltyPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerLoyaltyController extends Controller
{
    public function __construct(private readonly LoyaltyPresenter $loyaltyPresenter) {}

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $this->loyaltyPresenter->present($user),
        ]);
    }
}