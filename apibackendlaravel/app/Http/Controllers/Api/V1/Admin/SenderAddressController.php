<?php
// app/Http/Controllers/Api/V1/Admin/SenderAddressController.php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreSenderAddressRequest;
use App\Http\Requests\Api\V1\Admin\UpdateSenderAddressRequest;
use App\Http\Resources\SenderAddressResource;
use App\Http\Responses\ApiResponse;
use App\Models\SenderAddress;
use App\Services\SenderAddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SenderAddressController extends Controller
{
    public function __construct(private readonly SenderAddressService $senderAddressService)
    {
    }

    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', SenderAddress::class);

        $senderAddresses = SenderAddress::query()
            ->orderByDesc('is_default')
            ->orderBy('label')
            ->get();

        return ApiResponse::success(SenderAddressResource::collection($senderAddresses));
    }

    public function store(StoreSenderAddressRequest $request): JsonResponse
    {
        // مجوز از قبل داخل StoreSenderAddressRequest::authorize() چک شده.
        $senderAddress = $this->senderAddressService->create($request->validated());

        return ApiResponse::success(new SenderAddressResource($senderAddress), 'آدرس فرستنده ایجاد شد.', status: 201);
    }

    public function show(SenderAddress $senderAddress): JsonResponse
    {
        Gate::authorize('viewAny', SenderAddress::class);

        return ApiResponse::success(new SenderAddressResource($senderAddress));
    }

    public function update(UpdateSenderAddressRequest $request, SenderAddress $senderAddress): JsonResponse
    {
        // مجوز از قبل داخل UpdateSenderAddressRequest::authorize() چک شده.
        $senderAddress = $this->senderAddressService->update($senderAddress, $request->validated());

        return ApiResponse::success(new SenderAddressResource($senderAddress), 'آدرس فرستنده به‌روزرسانی شد.');
    }

    public function destroy(SenderAddress $senderAddress): JsonResponse
    {
        Gate::authorize('manage', SenderAddress::class);

        $this->senderAddressService->delete($senderAddress);

        return ApiResponse::success(null, 'آدرس فرستنده حذف شد.');
    }
}