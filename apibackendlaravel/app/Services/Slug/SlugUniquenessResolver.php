<?php

namespace App\Services\Slug;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SlugUniquenessResolver
{
    public function __construct(private PersianSlugger $slugger) {}

    /**
     * @param class-string<Model> $modelClass
     */
    public function resolve(string $sourceText, string $modelClass, ?int $ignoreId = null): string
    {
        $base = $this->slugger->slug($sourceText);

        if ($base === '') {
            // اگه متن ورودی هیچ کاراکتر مجازی نداشت (خیلی نادره)، یه شناسه‌ی امن بساز
            $base = 'item-'.Str::lower(Str::random(8));
        }

        $slug = $base;
        $suffix = 1;

        while (
            $modelClass::withTrashed()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $suffix++;
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}