<?php

use App\Mail\AdminPasswordResetMail;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

// ---------------------------------------------------------------------------
// Helpers (prefix "pwd" to avoid collision with other test files)
// ---------------------------------------------------------------------------

function pwdStaff(array $attrs = []): User
{
    return User::factory()->staff()->create($attrs);
}

function seedResetToken(string $email, string $plainToken, int $minutesAgo = 0): void
{
    DB::table('password_reset_tokens')->insert([
        'email'      => $email,
        'token'      => Hash::make($plainToken),
        'created_at' => now()->subMinutes($minutesAgo),
    ]);
}

const FORGOT_URL  = '/api/v1/auth/staff/forgot-password';
const RESET_URL   = '/api/v1/auth/staff/reset-password';
const GENERIC_MSG = 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی برای آن ارسال می‌شود.';

// ---------------------------------------------------------------------------
// forgot-password
// ---------------------------------------------------------------------------

describe('forgot-password', function () {

    it('returns 200 with generic message for existing staff email', function () {
        Mail::fake();
        $user = pwdStaff();

        $this->postJson(FORGOT_URL, ['email' => $user->email])
            ->assertStatus(200)
            ->assertJsonFragment(['message' => GENERIC_MSG]);
    });

    it('returns 200 with identical generic message for non-existent email (anti-enumeration)', function () {
        Mail::fake();

        $this->postJson(FORGOT_URL, ['email' => 'ghost@example.com'])
            ->assertStatus(200)
            ->assertJsonFragment(['message' => GENERIC_MSG]);
    });

    it('status code and message are identical for found and not-found emails', function () {
        Mail::fake();
        $user = pwdStaff();

        $r1 = $this->postJson(FORGOT_URL, ['email' => $user->email]);
        $r2 = $this->postJson(FORGOT_URL, ['email' => 'ghost@example.com']);

        expect($r1->status())->toBe($r2->status());
        expect($r1->json('message'))->toBe($r2->json('message'));
    });

    it('sends AdminPasswordResetMail to the correct staff email', function () {
        Mail::fake();
        $user = pwdStaff();

        $this->postJson(FORGOT_URL, ['email' => $user->email]);

        Mail::assertSent(AdminPasswordResetMail::class, fn ($m) => $m->hasTo($user->email));
    });

    it('does not send email when the address is not registered', function () {
        Mail::fake();

        $this->postJson(FORGOT_URL, ['email' => 'ghost@example.com']);

        Mail::assertNothingSent();
    });

    it('does not send email for a customer account (staff-only endpoint)', function () {
        Mail::fake();
        $customer = User::factory()->customer()->create();

        $this->postJson(FORGOT_URL, ['email' => $customer->email]);

        Mail::assertNothingSent();
    });

    it('stores a hashed (not plain) token in password_reset_tokens', function () {
        Mail::fake();
        $user = pwdStaff();

        $this->postJson(FORGOT_URL, ['email' => $user->email]);

        $record = DB::table('password_reset_tokens')->where('email', $user->email)->first();
        expect($record)->not->toBeNull();
        // Bcrypt hash is 60 chars; plain Str::random(64) would be 64 raw alphanum chars
        expect($record->token)->toStartWith('$2y$');
    });

    it('deletes old reset token before inserting a new one (no accumulation)', function () {
        Mail::fake();
        $user = pwdStaff();
        seedResetToken($user->email, Str::random(64), 30);

        $this->postJson(FORGOT_URL, ['email' => $user->email]);

        $count = DB::table('password_reset_tokens')->where('email', $user->email)->count();
        expect($count)->toBe(1);
    });

    it('returns 422 when email field is missing', function () {
        $this->postJson(FORGOT_URL, [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('returns 422 for an invalid email format', function () {
        $this->postJson(FORGOT_URL, ['email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });
});

// ---------------------------------------------------------------------------
// reset-password
// ---------------------------------------------------------------------------

describe('reset-password', function () {

    beforeEach(function () {
        // ⚠️  uncompromised() در ResetPasswordRequest به HIBP API وصل می‌شه.
        // در تست آفلاین fail-open هست (پسورد قبول می‌شه) ولی برای
        // جلوگیری از stray HTTP requests صریحاً fake می‌کنیم.
        // پاسخ خالی = هیچ hash ای match نشد = پسورد لو نرفته.
        Http::fake(['api.pwnedpasswords.com/*' => Http::response('', 200)]);
    });

    // --- happy path ----------------------------------------------------------

    it('returns 200 and success message on valid reset', function () {
        $user  = pwdStaff();
        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ])->assertStatus(200)
          ->assertJsonFragment(['message' => 'رمز عبور با موفقیت بازیابی شد. اکنون می‌توانید وارد شوید.']);
    });

    it('actually changes the password in the database', function () {
        $user  = pwdStaff(['password' => Hash::make('OldPassword1')]);
        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ]);

        expect(Hash::check('NewPassword1', $user->fresh()->password))->toBeTrue();
        expect(Hash::check('OldPassword1', $user->fresh()->password))->toBeFalse();
    });

    it('deletes the reset token after successful use (one-time token)', function () {
        $user  = pwdStaff();
        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $user->email)->first();
        expect($record)->toBeNull();
    });

    it('cannot use the same token twice', function () {
        $user  = pwdStaff();
        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $payload = [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ];

        $this->postJson(RESET_URL, $payload)->assertStatus(200);
        $this->postJson(RESET_URL, $payload)->assertStatus(422)
            ->assertJsonFragment(['message' => 'لینک بازیابی نامعتبر است.']);
    });

    it('clears failed_login_attempts after password reset', function () {
        $user = pwdStaff();
        $user->failed_login_attempts = 4;
        $user->save();

        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ]);

        expect($user->fresh()->failed_login_attempts)->toBe(0);
    });

    it('clears locked_until after password reset', function () {
        $user = pwdStaff();
        $user->locked_until = now()->addHour();
        $user->save();

        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ]);

        expect($user->fresh()->locked_until)->toBeNull();
    });

    it('revokes all active tokens after password reset (force logout from all devices)', function () {
        $user = pwdStaff();
        $user->createToken('device-1', ['*']);
        $user->createToken('device-2', ['*']);
        expect($user->tokens()->count())->toBe(2);

        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ]);

        expect($user->tokens()->count())->toBe(0);
    });

    // --- wrong / missing token -----------------------------------------------

    it('returns 422 for a wrong token', function () {
        $user = pwdStaff();
        seedResetToken($user->email, Str::random(64));

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => Str::random(64), // different token
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ])->assertStatus(422)
          ->assertJsonFragment(['message' => 'لینک بازیابی نامعتبر است.']);
    });

    it('returns 422 when no reset record exists for the email', function () {
        $user = pwdStaff();

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => Str::random(64),
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ])->assertStatus(422)
          ->assertJsonFragment(['message' => 'لینک بازیابی نامعتبر است.']);
    });

    // --- expiry --------------------------------------------------------------

    it('returns 422 for an expired token (older than 60 minutes)', function () {
        $base = \Illuminate\Support\Carbon::parse('2020-06-01 12:00:00'); // زمان ثابت، بدون میکروثانیه
        $this->travelTo($base);

        $user  = pwdStaff();
        $plain = Str::random(64);
        seedResetToken($user->email, $plain); // created_at = 2020-06-01 12:00:00

        $this->travelTo($base->copy()->addMinutes(61)); // دقیقاً 61 دقیقه بعد

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ])->assertStatus(422)
        ->assertJsonFragment(['message' => 'لینک بازیابی منقضی شده است. دوباره درخواست دهید.']);
    });

    it('deletes the expired token from the database', function () {
        $base = \Illuminate\Support\Carbon::parse('2020-06-01 12:00:00');
        $this->travelTo($base);

        $user  = pwdStaff();
        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $this->travelTo($base->copy()->addMinutes(61));

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $user->email)->first();
        expect($record)->toBeNull();
    });

    it('a token at exactly 60 minutes is still valid (boundary)', function () {
        $base = \Illuminate\Support\Carbon::parse('2020-06-01 12:00:00');
        $this->travelTo($base);

        $user  = pwdStaff();
        $plain = Str::random(64);
        seedResetToken($user->email, $plain);

        $this->travelTo($base->copy()->addMinutes(60)); // دقیقاً 60 دقیقه → هنوز معتبر

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ])->assertStatus(200);
    });

    // --- validation ----------------------------------------------------------

    it('returns 422 when email is missing', function () {
        $this->postJson(RESET_URL, [
            'token'                 => Str::random(64),
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    });

    it('returns 422 when token is missing', function () {
        $user = pwdStaff();

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ])->assertStatus(422)->assertJsonValidationErrors(['token']);
    });

    it('returns 422 when password is missing', function () {
        $user = pwdStaff();

        $this->postJson(RESET_URL, [
            'email' => $user->email,
            'token' => Str::random(64),
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    });

    it('returns 422 when password confirmation does not match', function () {
        $user = pwdStaff();

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => Str::random(64),
            'password'              => 'NewPassword1',
            'password_confirmation' => 'TotallyDifferent1',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    });

    it('returns 422 when password is shorter than 8 characters', function () {
        $user = pwdStaff();

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => Str::random(64),
            'password'              => 'Ab1',
            'password_confirmation' => 'Ab1',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    });

    it('returns 422 when password has no uppercase letter', function () {
        $user = pwdStaff();

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => Str::random(64),
            'password'              => 'allowercase1',
            'password_confirmation' => 'allowercase1',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    });

    it('returns 422 when password has no number', function () {
        $user = pwdStaff();

        $this->postJson(RESET_URL, [
            'email'                 => $user->email,
            'token'                 => Str::random(64),
            'password'              => 'NoNumbersHere',
            'password_confirmation' => 'NoNumbersHere',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    });

    // --- authorization -------------------------------------------------------

    it('returns 404 when token is valid but email belongs to a customer (not staff)', function () {
        $customer = User::factory()->customer()->create();
        $plain    = Str::random(64);
        seedResetToken($customer->email, $plain);

        $this->postJson(RESET_URL, [
            'email'                 => $customer->email,
            'token'                 => $plain,
            'password'              => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ])->assertStatus(404);
    });
});
