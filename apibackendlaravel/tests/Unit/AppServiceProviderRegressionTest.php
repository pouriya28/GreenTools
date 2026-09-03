<?php

// tests/Unit/AppServiceProviderRegressionTest.php

it('does not double-register the guest cart merge listener', function () {
    $listeners = app('events')->getListeners(\Illuminate\Auth\Events\Login::class);

    $mergeListenerCount = collect($listeners)
        ->filter(fn ($listener) => str_contains(is_string($listener) ? $listener : '', 'MergeGuestCartOnLogin'))
        ->count();

    expect($mergeListenerCount)->toBeLessThanOrEqual(1);
});