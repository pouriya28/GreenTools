<?php

namespace App\Models\Concerns;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait HasTags
{
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')->orderBy('name');
    }

    /**
     * فقط id هایی که واقعاً توی جدول tags هست sync می‌شن — چون Request
     * بالادستی از قبل با exists:tags,id چک کرده، ولی این یه لایه‌ی دفاعی
     * اضافه‌ست، نه اعتماد کور به ورودی.
     */
    public function syncTags(array $tagIds): void
    {
        $validIds = Tag::whereIn('id', $tagIds)->pluck('id')->all();
        $this->tags()->sync($validIds);
    }
}