<?php

use App\Models\User;
use App\Notifications\NewOrderPlacedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;

function adminWithOrdersView(): User
{
    $admin = User::factory()->staff()->create();
    $permission = Permission::firstOrCreate(
        ['name' => 'orders.view', 'guard_name' => 'sanctum']
    );
    $admin->givePermissionTo($permission);
    return $admin;
}

function createNotification(
    User $user,
    string $orderId = '01ORDER0000000000000000001',
    int $total = 1_500_000,
): string {
    $id = (string) Str::uuid();
    DB::table('notifications')->insert([
        'id'              => $id,
        'type'            => NewOrderPlacedNotification::class,
        'notifiable_type' => 'user',   // ← alias از morphMap، نه User::class
        'notifiable_id'   => $user->id,
        'data'            => json_encode(['order_id' => $orderId, 'total_amount' => $total]),
        'read_at'         => null,
        'created_at'      => now(),
        'updated_at'      => now(),
    ]);
    return $id;
}

beforeEach(function () {
    $this->app->make(\Illuminate\Cache\RateLimiter::class)->clear('notifications');
});

describe('GET /api/v1/admin/notifications', function () {

    it('returns 401 for unauthenticated request', function () {
        $this->getJson('/api/v1/admin/notifications')->assertStatus(401);
    });

    it('returns empty list when no unread notifications', function () {
        $admin = adminWithOrdersView();
        $this->actingAs($admin)
            ->getJson('/api/v1/admin/notifications')
            ->assertOk()
            ->assertJson(['data' => [], 'count' => 0]);
    });

    it('returns only unread notifications', function () {
        $admin = adminWithOrdersView();
        $id1 = createNotification($admin, '01ORDER0000000000000000001');
        createNotification($admin, '01ORDER0000000000000000002');

        // Mark first one as read
        DB::table('notifications')->where('id', $id1)->update(['read_at' => now()]);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('count', 1);
    });

    it('returns correct notification shape', function () {
        $admin = adminWithOrdersView();
        createNotification($admin, '01ORDER0000000000000000001', 1_500_000);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/notifications')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'type', 'data', 'created_at']],
                'count',
            ])
            ->assertJsonPath('data.0.data.order_id', '01ORDER0000000000000000001')
            ->assertJsonPath('data.0.data.total_amount', 1_500_000);
    });

    it('does not return other users notifications', function () {
        $admin = adminWithOrdersView();
        $other = adminWithOrdersView();
        createNotification($other);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/notifications')
            ->assertOk()
            ->assertJson(['data' => [], 'count' => 0]);
    });

    it('caps results at 50', function () {
        $admin = adminWithOrdersView();
        foreach (range(1, 55) as $i) {
            createNotification($admin, str_pad((string) $i, 26, '0', STR_PAD_LEFT));
        }

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/notifications')
            ->assertOk();

        expect($response->json('data'))->toHaveCount(50);
    });

});

describe('POST /api/v1/admin/notifications/{id}/read', function () {

    it('marks a notification as read', function () {
        $admin = adminWithOrdersView();
        $id = createNotification($admin);

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/notifications/{$id}/read")
            ->assertOk();

        expect($admin->unreadNotifications()->count())->toBe(0);
    });

    it('returns 404 when notification not found', function () {
        $admin = adminWithOrdersView();
        $this->actingAs($admin)
            ->postJson('/api/v1/admin/notifications/' . Str::uuid() . '/read')
            ->assertNotFound();
    });


    it('cannot mark another users notification as read (IDOR prevention)', function () {
        $admin = adminWithOrdersView();
        $other = adminWithOrdersView();
        $otherId = createNotification($other);

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/notifications/{$otherId}/read")
            ->assertNotFound();

        expect($other->fresh()->unreadNotifications()->count())->toBe(1);
    });

    it('returns 401 for unauthenticated request', function () {
        $this->postJson('/api/v1/admin/notifications/some-id/read')
            ->assertStatus(401);
    });

});

describe('POST /api/v1/admin/notifications/read-all', function () {

    it('marks all unread notifications as read', function () {
        $admin = adminWithOrdersView();
        createNotification($admin, '01ORDER0000000000000000001');
        createNotification($admin, '01ORDER0000000000000000002');

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/notifications/read-all')
            ->assertOk();

        expect($admin->fresh()->unreadNotifications()->count())->toBe(0);
    });

    it('does not affect other users notifications', function () {
        $admin = adminWithOrdersView();
        $other = adminWithOrdersView();
        createNotification($other);

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/notifications/read-all')
            ->assertOk();

        expect($other->fresh()->unreadNotifications()->count())->toBe(1);
    });

    it('returns 401 for unauthenticated request', function () {
        $this->postJson('/api/v1/admin/notifications/read-all')
            ->assertStatus(401);
    });

});

describe('rate limiting', function () {

    it('returns 429 after 3 mark-read requests in 10 minutes', function () {
        $admin = adminWithOrdersView();
        $ids = [];
        foreach (range(1, 4) as $i) {
            $ids[] = createNotification($admin, str_pad((string) $i, 26, '0', STR_PAD_LEFT));
        }

        // First 3 succeed
        foreach (array_slice($ids, 0, 3) as $id) {
            $this->actingAs($admin)
                ->postJson("/api/v1/admin/notifications/{$id}/read")
                ->assertOk();
        }

        // 4th is throttled
        $this->actingAs($admin)
            ->postJson("/api/v1/admin/notifications/{$ids[3]}/read")
            ->assertStatus(429);
    });

});