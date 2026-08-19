<?php

namespace App\Services\Category;

use App\Models\Category;
use App\Services\Slug\SlugUniquenessResolver;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public function __construct(
        private SlugUniquenessResolver $slugResolver
    ) {}

    public function create(array $data, int $userId): Category
    {
        return DB::transaction(function () use ($data, $userId) {

            $parent = $this->resolveParent(
                $data['parent_id'] ?? null
            );

            $this->assertValidParentForCreate($parent);

            $categoryData = Arr::except(
                $data,
                ['meta', 'tag_ids']
            );

            $categoryData['slug'] = $this->slugResolver->resolve(
                $data['name'],
                Category::class
            );

            $categoryData['created_by'] = $userId;

            $categoryData['description'] =
                $this->sanitizeDescription(
                    $categoryData['description'] ?? null
                );

            $category = Category::create($categoryData);

            $category->syncMeta(
                $data['meta'] ?? null
            );

            $category->syncTags(
                $data['tag_ids'] ?? []
            );

            Log::info('category.created', [
                'category_id' => $category->id,
                'user_id' => $userId,
            ]);

            return $category->fresh([
                'tags',
                'meta',
                'children',
            ]);
        });
    }

    public function update(
        Category $category,
        array $data
    ): Category {

        return DB::transaction(function () use ($category, $data) {

            /*
             * Category ممکن است در فاصله دریافت Request
             * تا اجرای Service تغییر کرده باشد.
             *
             * بنابراین دوباره از DB می‌خوانیم.
             */
            $category->refresh();

            $newParentId = array_key_exists(
                'parent_id',
                $data
            )
                ? $data['parent_id']
                : $category->parent_id;

            $parent = $this->resolveParent($newParentId);

            $this->assertValidParentForUpdate(
                $category,
                $parent
            );

            $categoryData = Arr::except(
                $data,
                ['meta', 'tag_ids']
            );

            if (
                isset($categoryData['name']) &&
                $categoryData['name'] !== $category->name
            ) {
                $categoryData['slug'] =
                    $this->slugResolver->resolve(
                        $categoryData['name'],
                        Category::class,
                        $category->id
                    );
            }

            if (array_key_exists(
                'description',
                $categoryData
            )) {
                $categoryData['description'] =
                    $this->sanitizeDescription(
                        $categoryData['description']
                    );
            }

            /*
             * اگر parent تغییر می‌کند، کل subtree باید
             * از نظر MAX_DEPTH بررسی شود.
             */
            if (
                $newParentId !== $category->parent_id
            ) {
                $this->assertSubtreeDepthAllowed(
                    $category,
                    $parent
                );
            }

            $category->update($categoryData);

            if (array_key_exists('meta', $data)) {
                $category->syncMeta($data['meta']);
            }

            if (array_key_exists('tag_ids', $data)) {
                $category->syncTags($data['tag_ids']);
            }

            Log::info('category.updated', [
                'category_id' => $category->id,
            ]);

            return $category->fresh([
                'tags',
                'meta',
                'children',
            ]);
        });
    }

    public function delete(Category $category): void
    {
        DB::transaction(function () use ($category) {

            $category->refresh();

            if ($category->children()->exists()) {
                throw new \DomainException(
                    'این دسته‌بندی دارای زیردسته است.'
                );
            }

            if ($category->products()->exists()) {
                throw new \DomainException(
                    'این دسته‌بندی دارای محصول است.'
                );
            }

            $category->delete();

            Log::info('category.soft_deleted', [
                'category_id' => $category->id,
            ]);
        });
    }

    public function restore(Category $category): Category
    {
        return DB::transaction(function () use ($category) {

            /*
             * Parent ممکن است در زمانی که این Category
             * در Trash بوده حذف شده باشد.
             */
            $parent = $category->parent()
                ->whereNull('deleted_at')
                ->first();

            if ($category->parent_id !== null && ! $parent) {
                throw new \DomainException(
                    'والد این دسته‌بندی دیگر قابل استفاده نیست.'
                );
            }

            if ($parent) {
                $this->assertValidParentForCreate(
                    $parent
                );
            }

            $category->restore();

            Log::info('category.restored', [
                'category_id' => $category->id,
            ]);

            return $category->fresh();
        });
    }

    public function forceDelete(Category $category): void
    {
        DB::transaction(function () use ($category) {

            if (
                $category
                    ->children()
                    ->withTrashed()
                    ->exists()
            ) {
                throw new \DomainException(
                    'این دسته‌بندی دارای زیردسته است.'
                );
            }

            if ($category->products()->exists()) {
                throw new \DomainException(
                    'این دسته‌بندی دارای محصول است.'
                );
            }

            $category->tags()->detach();
            $category->meta()->delete();

            $category->forceDelete();

            Log::warning('category.force_deleted', [
                'category_id' => $category->id,
            ]);
        });
    }

    private function resolveParent(
        ?int $parentId
    ): ?Category {

        if ($parentId === null) {
            return null;
        }

        return Category::query()
            ->whereKey($parentId)
            ->whereNull('deleted_at')
            ->firstOrFail();
    }

    private function assertValidParentForCreate(
        ?Category $parent
    ): void {

        if (! $parent) {
            return;
        }

        if ($parent->depth() >= Category::MAX_DEPTH) {
            throw ValidationException::withMessages([
                'parent_id' =>
                    'این دسته‌بندی والد به حداکثر عمق مجاز رسیده است.',
            ]);
        }
    }

    private function assertValidParentForUpdate(
        Category $category,
        ?Category $parent
    ): void {

        if (! $parent) {
            return;
        }

        if ($parent->id === $category->id) {
            throw ValidationException::withMessages([
                'parent_id' =>
                    'یک دسته‌بندی نمی‌تواند والد خودش باشد.',
            ]);
        }

        if ($category->hasDescendant($parent->id)) {
            throw ValidationException::withMessages([
                'parent_id' =>
                    'نمی‌توان یکی از زیردسته‌ها را والد قرار داد.',
            ]);
        }
    }

    private function assertSubtreeDepthAllowed(
        Category $category,
        ?Category $newParent
    ): void {

        if (! $newParent) {
            /*
             * انتقال به root همیشه از نظر depth مجاز است.
             */
            return;
        }

        $parentDepth = $newParent->depth();

        $subtreeHeight = $this->subtreeHeight(
            $category
        );

        /*
         * مثال:
         *
         * parent = depth 2
         * subtree height = 2
         *
         * deepest node = 2 + 1 + 2 = 5
         *
         * اگر MAX_DEPTH = 4 → ممنوع
         */
        $deepestDepth =
            $parentDepth +
            1 +
            $subtreeHeight;

        if ($deepestDepth > Category::MAX_DEPTH) {
            throw ValidationException::withMessages([
                'parent_id' =>
                    'انتقال این دسته‌بندی باعث عبور یکی از زیرشاخه‌ها از حداکثر عمق مجاز می‌شود.',
            ]);
        }
    }

    private function subtreeHeight(
        Category $category
    ): int {

        $children = $category->children()->get();

        if ($children->isEmpty()) {
            return 0;
        }

        $max = 0;

        foreach ($children as $child) {
            $max = max(
                $max,
                1 + $this->subtreeHeight($child)
            );
        }

        return $max;
    }

    private function sanitizeDescription(
        ?string $value
    ): ?string {

        return $value !== null
            ? strip_tags($value)
            : null;
    }
}