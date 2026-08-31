<?php

it('rejects a webhook callback with an invalid/unverifiable signature', function () {
    $this->postJson('/api/v1/payments/webhook', ['transaction_id' => 'fake-123'])
        ->assertStatus(401);
});