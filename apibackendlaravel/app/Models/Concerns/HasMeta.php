<?php

namespace App\Models\Concerns;

use App\Models\Meta;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait HasMeta
{
    public function meta(): MorphOne
    {
        return $this->morphOne(Meta::class, 'metable');
    }

    public function syncMeta(?array $data): void
    {
        if (empty($data['meta_title']) && empty($data['meta_description'])) {
            $this->meta()->delete();
            return;
        }

        $this->meta()->updateOrCreate([], [
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
        ]);
    }
}