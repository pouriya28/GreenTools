<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function opStaff(array $attrs = []): User
{
    return User::factory()->staff()->create($attrs);
}

/**
 * یه staff user با token می‌سازه و tokenId هم برمی‌گردونه
 * @return array{user: User, plain: string, tokenId: int}
 */
function opStaffWithToken(array $attrs = []): array
{
    $user        = opStaff($attrs);
    $result      = $user->createToken('test', ['*']);
    return [
        'user'    => $user,
        'plain'   => $result->plainTextToken,
        'tokenId' => $result->accessToken->id,
    ];
}

const OP_SET_URL    = '/api/v1/auth/staff/operation-password/set';
const OP_VERIFY_URL = '/api/v1/auth/staff/operation-password/verify';

// ---------------------------------------------------------------------------
// operation-password/set
// ---------------------------------------------------------------------------

describe('operation-password/set', function () {

    it('returns 200 on valid set', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);
        Redis::shouldReceive('del')->andReturn(1);
        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'OpPassword12',
            'operation_password_confirmation' => 'OpPassword12',
        ])->assertStatus(200)
          ->assertJsonFragment(['message' => 'رمز تأیید عملیات با موفقیت تنظیم شد.']);
    });

    it('saves a bcrypt hash of the operation password in the database', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);
        Redis::shouldReceive('del')->andReturn(1);
        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'OpPassword12',
            'operation_password_confirmation' => 'OpPassword12',
        ]);

        expect(Hash::check('OpPassword12', $user->fresh()->operation_password_hash))->toBeTrue();
    });

    it('can overwrite an existing operation password', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);
        $user->forceFill(['operation_password_hash' => Hash::make('OldOpPass12')])->save();
         Redis::shouldReceive('del')->andReturn(1);
        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'NewOpPassw0rd',
            'operation_password_confirmation' => 'NewOpPassw0rd',
        ])->assertStatus(200);

        expect(Hash::check('NewOpPassw0rd', $user->fresh()->operation_password_hash))->toBeTrue();
        expect(Hash::check('OldOpPass12', $user->fresh()->operation_password_hash))->toBeFalse();
    });

    it('returns 422 when current_login_password is wrong', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'WrongLogin9',
            'operation_password'              => 'OpPassword12',
            'operation_password_confirmation' => 'OpPassword12',
        ])->assertStatus(422)
          ->assertJsonFragment(['code' => 'INVALID_OPERATION_PASSWORD']);
    });

    it('invalidates all active session verifications when password is changed', function () {
        ['user' => $user, 'plain' => $token, 'tokenId' => $tokenId] =
            opStaffWithToken(['password' => Hash::make('LoginPass1')]);

        $user->forceFill(['operation_password_hash' => Hash::make('OldOpPass12')])->save();

        // انتظار داریم Redis::del برای token فعلی صدا زده بشه
        Redis::shouldReceive('del')
            ->once()
            ->with("op_verified:{$user->id}:{$tokenId}");

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'NewOpPassw0rd',
            'operation_password_confirmation' => 'NewOpPassw0rd',
        ])->assertStatus(200);
    });

    // --- password policy -----------------------------------------------------

    it('returns 422 when operation_password is shorter than 12 characters', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'Short1',
            'operation_password_confirmation' => 'Short1',
        ])->assertStatus(422)->assertJsonValidationErrors(['operation_password']);
    });

    it('returns 422 when operation_password has no letters', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => '123456789012',
            'operation_password_confirmation' => '123456789012',
        ])->assertStatus(422)->assertJsonValidationErrors(['operation_password']);
    });

    it('returns 422 when operation_password has no numbers', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'OperPassword',
            'operation_password_confirmation' => 'OperPassword',
        ])->assertStatus(422)->assertJsonValidationErrors(['operation_password']);
    });

    it('returns 422 when operation_password equals the login password', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'LoginPass1', // ← همان login password
            'operation_password_confirmation' => 'LoginPass1',
        ])->assertStatus(422)->assertJsonValidationErrors(['operation_password']);
    });

    it('returns 422 when operation_password_confirmation does not match', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'OpPassword12',
            'operation_password_confirmation' => 'Different999',
        ])->assertStatus(422)->assertJsonValidationErrors(['operation_password']);
    });

    // --- required fields -----------------------------------------------------

    it('returns 422 when current_login_password is missing', function () {
        ['plain' => $token] = opStaffWithToken();

        $this->withToken($token)->postJson(OP_SET_URL, [
            'operation_password'              => 'OpPassword12',
            'operation_password_confirmation' => 'OpPassword12',
        ])->assertStatus(422)->assertJsonValidationErrors(['current_login_password']);
    });

    it('returns 422 when operation_password is missing', function () {
        ['plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password' => 'LoginPass1',
        ])->assertStatus(422)->assertJsonValidationErrors(['operation_password']);
    });

    // --- authorization -------------------------------------------------------

    it('returns 401 when not authenticated', function () {
        $this->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'OpPassword12',
            'operation_password_confirmation' => 'OpPassword12',
        ])->assertStatus(401);
    });

    it('returns 403 for a customer account', function () {
        $customer = User::factory()->customer()->create();
        $token    = $customer->createToken('test', ['*'])->plainTextToken;

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'password',
            'operation_password'              => 'OpPassword12',
            'operation_password_confirmation' => 'OpPassword12',
        ])->assertStatus(403);
    });

    it('returns 403 for an inactive staff account', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken(['password' => Hash::make('LoginPass1')]);
        $user->deactivate();

        $this->withToken($token)->postJson(OP_SET_URL, [
            'current_login_password'         => 'LoginPass1',
            'operation_password'              => 'OpPassword12',
            'operation_password_confirmation' => 'OpPassword12',
        ])->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// operation-password/verify
// ---------------------------------------------------------------------------

describe('operation-password/verify', function () {

    it('returns 409 when no operation password has been set yet', function () {
        ['plain' => $token] = opStaffWithToken();

        $this->withToken($token)->postJson(OP_VERIFY_URL, [
            'operation_password' => 'OpPassword12',
        ])->assertStatus(409)
          ->assertJsonFragment(['message' => 'ابتدا باید رمز تأیید عملیات را تنظیم کنید.']);
    });

    it('returns 422 when operation password is wrong', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken();
        $user->forceFill(['operation_password_hash' => Hash::make('OpPassword12')])->save();

        $this->withToken($token)->postJson(OP_VERIFY_URL, [
            'operation_password' => 'WrongOp9999',
        ])->assertStatus(422)
          ->assertJsonFragment(['code' => 'INVALID_OPERATION_PASSWORD']);
    });

    it('returns 200 with expires_in on correct operation password', function () {
        ['user' => $user, 'plain' => $token, 'tokenId' => $tokenId] = opStaffWithToken();
        $user->forceFill(['operation_password_hash' => Hash::make('OpPassword12')])->save();

        Redis::shouldReceive('setex')
            ->once()
            ->with("op_verified:{$user->id}:{$tokenId}", 300, '1')
            ->andReturn(true);

        $this->withToken($token)->postJson(OP_VERIFY_URL, [
            'operation_password' => 'OpPassword12',
        ])->assertStatus(200)
          ->assertJsonFragment([
              'message'    => 'عملیات تأیید شد.',
              'expires_in' => 300,
          ]);
    });

    it('stores the verification in Redis with key = op_verified:{user_id}:{token_id}', function () {
        ['user' => $user, 'plain' => $token, 'tokenId' => $tokenId] = opStaffWithToken();
        $user->forceFill(['operation_password_hash' => Hash::make('OpPassword12')])->save();

        Redis::shouldReceive('setex')
            ->once()
            ->with("op_verified:{$user->id}:{$tokenId}", 300, '1')
            ->andReturn(true);

        $this->withToken($token)->postJson(OP_VERIFY_URL, [
            'operation_password' => 'OpPassword12',
        ])->assertStatus(200);
    });

    it('verification on session A does not grant access on session B', function () {
        $user = opStaff();
        $user->forceFill(['operation_password_hash' => Hash::make('OpPassword12')])->save();

        // session A verify می‌کنه
        $tokenA    = $user->createToken('device-A', ['*']);
        $tokenAId  = $tokenA->accessToken->id;

        Redis::shouldReceive('setex')
            ->once()
            ->with("op_verified:{$user->id}:{$tokenAId}", 300, '1')
            ->andReturn(true);

        $this->withToken($tokenA->plainTextToken)->postJson(OP_VERIFY_URL, [
            'operation_password' => 'OpPassword12',
        ])->assertStatus(200);

        // session B باید verified نباشه
        $tokenB   = $user->createToken('device-B', ['*']);
        $tokenBId = $tokenB->accessToken->id;

        // key برای B وجود نداره
        Redis::shouldReceive('get')
            ->with("op_verified:{$user->id}:{$tokenBId}")
            ->andReturn(null);

        expect(Redis::get("op_verified:{$user->id}:{$tokenBId}"))->toBeNull();
    });

    // --- validation + authorization ------------------------------------------

    it('returns 422 when operation_password field is missing', function () {
        ['plain' => $token] = opStaffWithToken();

        $this->withToken($token)->postJson(OP_VERIFY_URL, [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['operation_password']);
    });

    it('returns 401 when not authenticated', function () {
        $this->postJson(OP_VERIFY_URL, ['operation_password' => 'OpPassword12'])
            ->assertStatus(401);
    });

    it('returns 403 for a customer account', function () {
        $customer = User::factory()->customer()->create();
        $token    = $customer->createToken('test', ['*'])->plainTextToken;

        $this->withToken($token)->postJson(OP_VERIFY_URL, [
            'operation_password' => 'OpPassword12',
        ])->assertStatus(403);
    });

    it('returns 403 for an inactive staff account', function () {
        ['user' => $user, 'plain' => $token] = opStaffWithToken();
        $user->forceFill(['operation_password_hash' => Hash::make('OpPassword12')])->save();
        $user->deactivate();

        $this->withToken($token)->postJson(OP_VERIFY_URL, [
            'operation_password' => 'OpPassword12',
        ])->assertStatus(403);
    });
});
