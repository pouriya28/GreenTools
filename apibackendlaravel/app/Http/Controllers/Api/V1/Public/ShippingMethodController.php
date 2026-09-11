<?php
// app/Http/Controllers/Api/V1/Public/ShippingMethodController.php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShippingMethodResource;
use App\Models\ShippingMethod;
use App\Http\Responses\ApiResponse;

class ShippingMethodController extends Controller
{
    public function index(): \Illuminate\Http\JsonResponse
    {
        $methods = ShippingMethod::query()
            ->active()
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success(ShippingMethodResource::collection($methods));
    }
}