<?php

namespace App\Http\Controllers\Api\V1\Location;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Province;
use Illuminate\Support\Facades\Cache;

/**
 * Read-only reference data for building province/city selects on the
 * frontend. This is intentionally the single source of truth for
 * province_id/city_id values -- the frontend must never invent or guess
 * these ids (e.g. from a local JSON of names), because StoreAddressRequest
 * validates them with exists:provinces,id / exists:cities,id.
 */
class LocationController extends Controller
{
    /**
     * List every province with its cities, shaped for a two-level select
     * (province -> city), each carrying the real database id.
     */
    public function provinces()
    {
        // Provinces/cities are effectively static reference data (they change
        // only through manual admin/seed work), so a long-lived cache is safe.
        // Clear with `Cache::forget('locations:provinces')` after editing the
        // provinces/cities tables.
        $provinces = Cache::remember('locations:provinces', now()->addDay(), function () {
            return Province::query()
                ->with(['cities' => function ($query) {
                    $query->select(['id', 'province_id', 'name'])->orderBy('name');
                }])
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get()
                ->map(fn (Province $province) => [
                    'id' => $province->id,
                    'name' => $province->name,
                    'cities' => $province->cities->map(fn ($city) => [
                        'id' => $city->id,
                        'name' => $city->name,
                    ])->all(),
                ])
                ->all();
        });

        return ApiResponse::success($provinces);
    }
}
