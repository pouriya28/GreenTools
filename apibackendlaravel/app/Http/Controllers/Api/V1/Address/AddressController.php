<?php

namespace App\Http\Controllers\Api\V1\Address;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Address\StoreAddressRequest;
use App\Http\Requests\Api\V1\Address\UpdateAddressRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Address;
use App\Services\AddressService;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function __construct(private readonly AddressService $addressService)
    {
    }

    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()
            ->with(['province', 'city'])
            ->latest()
            ->get();

        return ApiResponse::success($addresses);
    }

    public function store(StoreAddressRequest $request)
    {
        $address = $this->addressService->create($request->user(), $request->validated());

        return ApiResponse::success($address->load(['province', 'city']), status: 201);
    }

    public function show(Request $request, Address $address)
    {
        $this->authorize('view', $address);

        return ApiResponse::success($address->load(['province', 'city']));
    }

    public function update(UpdateAddressRequest $request, Address $address)
    {
        $address = $this->addressService->update($address, $request->validated());

        return ApiResponse::success($address->load(['province', 'city']));
    }

    public function destroy(Request $request, Address $address)
    {
        $this->authorize('delete', $address);

        $this->addressService->delete($address);

        return ApiResponse::success(null, status: 204);
    }

    public function setDefault(Request $request, Address $address)
    {
        $this->authorize('setDefault', $address);

        $address = $this->addressService->setDefault($address);

        return ApiResponse::success($address->load(['province', 'city']));
    }
}