<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Loyalty\GrantLoyaltyPointsRequest;
use App\Services\Loyalty\LoyaltyService;
use Illuminate\Http\JsonResponse;

class LoyaltyController extends Controller
{
    public function __construct(private readonly LoyaltyService $loyaltyService) {}

    public function grant(GrantLoyaltyPointsRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = $this->loyaltyService->addPoints(
            userId: $data['user_id'],
            points: $data['points'],
            type: 'manual_admin_grant',
            description: $data['description'] ?? null,
            grantedBy: $request->user()->id,
        );

        return response()->json([
            'message' => 'امتیاز با موفقیت اضافه شد.',
            'data' => [
                'user_id' => $user->id,
                'loyalty_points' => $user->loyalty_points,
                'customer_level' => $user->customerLevel?->only(['id', 'code', 'name', 'icon']),
            ],
        ]);
    }
}