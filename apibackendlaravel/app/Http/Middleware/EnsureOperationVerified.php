<?php

namespace App\Http\Middleware;

use App\Exceptions\Auth\OperationVerificationRequiredException;
use App\Models\Permission;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

class EnsureOperationVerified
{
    /**
     * Usage on a route: ->middleware('operation.verified:categories.delete')
     *
     * The permission name is the single source of truth for whether a route
     * is "sensitive" — this reads Permission::requires_operation_confirmation
     * from the database instead of hard-coding a route list here. Flipping
     * that flag later automatically updates every route guarded by it.
     */
    public function handle(Request $request, Closure $next, string $permissionName): Response
    {
        $permission = Permission::query()
            ->where('name', $permissionName)
            ->where('guard_name', 'sanctum')
            ->first();

        if (!$permission || !$permission->requires_operation_confirmation) {
            return $next($request);
        }

        $userId = $request->user()?->id;

        if (!$userId || !Redis::exists("op_verified:{$userId}")) {
            throw new OperationVerificationRequiredException();
        }

        return $next($request);
    }
}