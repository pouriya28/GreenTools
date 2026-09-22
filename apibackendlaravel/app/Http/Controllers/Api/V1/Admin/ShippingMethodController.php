<?php
// app/Http/Controllers/Api/V1/Admin/ShippingMethodController.php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Shipping\StoreShippingMethodRequest;
use App\Http\Requests\Api\V1\Shipping\UpdateShippingMethodRequest;
use App\Http\Resources\Admin\ShippingMethodResource;
use App\Models\ShippingMethod;
use App\Http\Responses\ApiResponse;

class ShippingMethodController extends Controller
{
    public function index(): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', ShippingMethod::class);

        $methods = ShippingMethod::query()->orderBy('sort_order')->get();

        return ApiResponse::success(ShippingMethodResource::collection($methods));
    }

    public function store(StoreShippingMethodRequest $request): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', ShippingMethod::class);
        $method = ShippingMethod::create($request->validated());

        return ApiResponse::success(data: new ShippingMethodResource($method), status: 201);
    }

    public function show(ShippingMethod $shippingMethod): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', ShippingMethod::class);

        return ApiResponse::success(new ShippingMethodResource($shippingMethod));
    }

    public function update(UpdateShippingMethodRequest $request, ShippingMethod $shippingMethod): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', ShippingMethod::class);
        $shippingMethod->update($request->validated());

        return ApiResponse::success(new ShippingMethodResource($shippingMethod));
    }

    public function destroy(ShippingMethod $shippingMethod): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', ShippingMethod::class);

        // Soft delete only: existing orders keep their shipping snapshot via
        // the nullOnDelete FK, so past orders are unaffected.
        $shippingMethod->delete();

        return ApiResponse::success(status: 204);
    }
}