<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CloseStoreRequest;
use App\Http\Responses\ApiResponse;
use App\Services\StoreStatusService;
use Illuminate\Http\Request;

class StoreStatusController extends Controller
{
    public function __construct(private readonly StoreStatusService $storeStatusService)
    {
    }

    public function show(Request $request)
    {
        return ApiResponse::success($this->storeStatusService->current());
    }

    public function close(CloseStoreRequest $request)
    {
        $status = $this->storeStatusService->close($request->user(), $request->validated('reason'));

        return ApiResponse::success($status);
    }

    public function open(Request $request)
    {
        // همان permission بستن برای باز کردن هم لازم است — هر دو عمل حساسیتیکسان دارند.
        abort_unless($request->user()?->can('store.manage-status'), 403);

        $status = $this->storeStatusService->open($request->user());

        return ApiResponse::success($status);
    }
}
